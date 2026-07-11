import {
  CANONICAL_SECTIONS,
  COMPONENT_PROPERTY_WHITELIST,
  canonicalSection,
  type DesignTokens,
  type LintIssue,
  type ParseResult,
  type SectionDef,
  type TypographyToken,
} from "./types";
import { contrastRatio, parseHex } from "./wcag";
import { isRef, resolveRef } from "./tokens";

// Run all lint rules against a parsed DESIGN.md.
// Structural parse errors (from ParseResult.errors) are surfaced as yaml-error issues.
export function lint(parsed: ParseResult): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const e of parsed.errors) {
    issues.push({ rule: "yaml-error", severity: "error", message: e });
  }

  const tokens = parsed.tokens;
  lintColors(tokens, issues);
  lintTypography(tokens, issues);
  lintDimensions(tokens, issues);
  lintReferences(tokens, issues);
  lintSections(parsed.sections, issues);
  lintComponents(tokens, issues);

  return issues;
}

// ---- value validators ----

export function isColorValue(v: string): boolean {
  if (isRef(v)) return true; // reference resolution handled separately
  return parseHex(v) !== null;
}

export function isDimensionValue(v: string): boolean {
  if (isRef(v)) return true;
  return /^-?\d*\.?\d+(px|em|rem|%)$/.test(v.trim());
}

function isPositiveNumber(v: unknown): boolean {
  return typeof v === "number" && v > 0;
}

// ---- rules ----

function lintColors(tokens: DesignTokens, issues: LintIssue[]) {
  const colors = tokens.colors ?? {};
  for (const [k, v] of Object.entries(colors)) {
    if (typeof v !== "string") {
      issues.push({
        rule: "invalid-color",
        severity: "error",
        message: `Color "${k}" must be a hex string or token reference, got ${JSON.stringify(v)}.`,
        tokenPath: `colors.${k}`,
      });
      continue;
    }
    if (isRef(v)) continue; // resolved later
    if (!isColorValue(v)) {
      issues.push({
        rule: "invalid-color",
        severity: "error",
        message: `Color "${k}" is not a valid hex color (expected "#RRGGBB").`,
        tokenPath: `colors.${k}`,
      });
    }
  }
}

function lintDimensions(tokens: DesignTokens, issues: LintIssue[]) {
  for (const group of ["rounded", "spacing", "elevation", "shapes"] as const) {
    const obj = tokens[group];
    if (!obj) continue;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== "string") {
        issues.push({
          rule: "invalid-dimension",
          severity: "error",
          message: `${group}.${k} must be a dimension string (e.g. "8px"), got ${JSON.stringify(v)}.`,
          tokenPath: `${group}.${k}`,
        });
        continue;
      }
      if (isRef(v)) continue;
      if (!isDimensionValue(v)) {
        issues.push({
          rule: "invalid-dimension",
          severity: "error",
          message: `${group}.${k} is not a valid dimension (expected number+unit like "8px", "1rem").`,
          tokenPath: `${group}.${k}`,
        });
      }
    }
  }
}

function lintTypography(tokens: DesignTokens, issues: LintIssue[]) {
  const typo = tokens.typography ?? {};
  for (const [name, t] of Object.entries(typo) as [string, TypographyToken][]) {
    if (!t || typeof t !== "object") {
      issues.push({
        rule: "invalid-typography",
        severity: "error",
        message: `typography.${name} must be an object of typography properties.`,
        tokenPath: `typography.${name}`,
      });
      continue;
    }
    if (t.fontSize !== undefined && !isDimensionValue(String(t.fontSize)) && !isRef(String(t.fontSize))) {
      issues.push({
        rule: "invalid-typography",
        severity: "error",
        message: `typography.${name}.fontSize "${t.fontSize}" is not a valid dimension.`,
        tokenPath: `typography.${name}.fontSize`,
      });
    }
    if (t.lineHeight !== undefined && typeof t.lineHeight !== "number" && !isDimensionValue(String(t.lineHeight)) && !isRef(String(t.lineHeight))) {
      issues.push({
        rule: "invalid-typography",
        severity: "error",
        message: `typography.${name}.lineHeight "${t.lineHeight}" must be a number or dimension.`,
        tokenPath: `typography.${name}.lineHeight`,
      });
    }
    if (t.fontWeight !== undefined && typeof t.fontWeight !== "number" && typeof t.fontWeight !== "string") {
      issues.push({
        rule: "invalid-typography",
        severity: "error",
        message: `typography.${name}.fontWeight must be a number or named weight.`,
        tokenPath: `typography.${name}.fontWeight`,
      });
    }
  }
}

function lintReferences(tokens: DesignTokens, issues: LintIssue[]) {
  // Walk all string values, resolve refs, flag broken ones.
  const walk = (obj: unknown, prefix: string) => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string" && isRef(v)) {
        const resolved = resolveRef(v, tokens);
        if (resolved === null) {
          issues.push({
            rule: "broken-ref",
            severity: "error",
            message: `Reference ${v} in ${path} points to a non-existent token.`,
            tokenPath: path,
          });
        }
      } else if (v && typeof v === "object") {
        walk(v, path);
      }
    }
  };
  walk(tokens, "");
}

function lintSections(sections: SectionDef[], issues: LintIssue[]) {
  const seen = new Map<string, number>(); // canonical -> count
  for (const s of sections) {
    const canon = canonicalSection(s.heading);
    if (canon === null) continue; // unknown section preserved
    const count = (seen.get(canon) ?? 0) + 1;
    seen.set(canon, count);
    if (count > 1) {
      issues.push({
        rule: "duplicate-section",
        severity: "error",
        message: `Duplicate section "${s.heading}" (canonical: "${canon}"). Each section may appear only once.`,
      });
    }
  }
  // Order check: sections must appear in canonical order.
  const order = CANONICAL_SECTIONS.map((c) => c.canonical);
  const present = sections
    .map((s) => canonicalSection(s.heading))
    .filter((c): c is string => c !== null);
  let lastIdx = -1;
  for (const c of present) {
    const idx = order.indexOf(c);
    if (idx < lastIdx) {
      issues.push({
        rule: "duplicate-section",
        severity: "error",
        message: `Section "${c}" appears out of canonical order. Reorder sections to: ${order.join(" > ")}.`,
      });
      break;
    }
    lastIdx = idx;
  }
}

function lintComponents(tokens: DesignTokens, issues: LintIssue[]) {
  const components = tokens.components ?? {};
  for (const [compName, props] of Object.entries(components)) {
    if (!props || typeof props !== "object") continue;
    for (const [prop, val] of Object.entries(props as Record<string, string>)) {
      const whitelist = COMPONENT_PROPERTY_WHITELIST as readonly string[];
      if (!whitelist.includes(prop)) {
        issues.push({
          rule: "unknown-component-property",
          severity: "warning",
          message: `Component "${compName}" uses unknown property "${prop}". Whitelist: ${whitelist.join(", ")}.`,
          component: compName,
          property: prop,
        });
      }
    }
    runComponentContrast(compName, props as Record<string, string>, tokens, issues);
  }
}

function runComponentContrast(
  compName: string,
  props: Record<string, string>,
  tokens: DesignTokens,
  issues: LintIssue[]
) {
  const fg = props.textColor;
  const bg = props.backgroundColor;
  if (!fg || !bg) return;
  const fgV = isRef(fg) ? resolveRef(fg, tokens) ?? fg : fg;
  const bgV = isRef(bg) ? resolveRef(bg, tokens) ?? bg : bg;
  const res = contrastRatio(fgV, bgV);
  if (!res) return;
  issues.push({
    rule: "wcag-contrast",
    severity: res.aa ? "info" : "warning",
    message: `Component "${compName}": text/bg contrast ratio ${res.ratio}:1 (AA needs 4.5:1, AAA 7:1).`,
    component: compName,
    ratio: res.ratio,
    required: res.aa ? 4.5 : 4.5,
    level: res.aaa ? "AAA" : res.aa ? "AA" : "AA",
  });
}
