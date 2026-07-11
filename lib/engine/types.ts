// Core type definitions for the DESIGN.md spec engine.
// Spec source of truth: https://github.com/google-labs-code/design.md (Apache-2.0)
// Current spec version: alpha (as of Apr 2026). Token model below follows the
// skill/CLI contract used by `@google/design.md` 0.3.x.

export interface TypographyToken {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number | string;
  lineHeight?: string | number;
  letterSpacing?: string;
  fontFeature?: string;
  fontVariation?: string;
}

export type ColorValue = string; // "#RRGGBB" or "#RGB"
export type DimensionValue = string; // e.g. "8px", "1rem", "-0.02em"

export interface DesignTokens {
  version?: string;
  name?: string;
  description?: string;
  colors?: Record<string, ColorValue>;
  typography?: Record<string, TypographyToken>;
  rounded?: Record<string, DimensionValue>;
  spacing?: Record<string, DimensionValue>;
  elevation?: Record<string, DimensionValue | string>;
  shapes?: Record<string, DimensionValue | string>;
  components?: Record<string, Record<string, string>>;
  [key: string]: unknown;
}

export interface SectionDef {
  heading: string; // canonical markdown heading (normalized, lowercased compare)
  body: string; // raw markdown body of the section
  lineStart: number; // 1-indexed line where the heading lives
}

export interface ParseResult {
  tokens: DesignTokens;
  sections: SectionDef[];
  raw: string;
  errors: string[]; // structural parse errors (not lint rules)
}

// ---- Lint ----

export type LintSeverity = "error" | "warning" | "info";

export interface LintIssue {
  rule:
    | "broken-ref"
    | "duplicate-section"
    | "invalid-color"
    | "invalid-dimension"
    | "invalid-typography"
    | "wcag-contrast"
    | "unknown-component-property"
    | "yaml-error";
  severity: LintSeverity;
  message: string;
  tokenPath?: string; // dotted path, e.g. "colors.primary"
  component?: string; // component key, e.g. "button-primary"
  property?: string; // component property, e.g. "backgroundColor"
  ratio?: number; // WCAG contrast ratio
  required?: number; // required ratio (4.5 / 7)
  level?: "AA" | "AAA";
}

// ---- WCAG ----

export interface ContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  aa: boolean; // >= 4.5
  aaa: boolean; // >= 7
  aaLarge: boolean; // >= 3 (large text)
}

// ---- Export ----

export interface TailwindThemeExport {
  theme: {
    extend: {
      colors: Record<string, string>;
      fontFamily: Record<string, string[]>;
      fontSize: Record<string, [string, Record<string, string>]>;
      borderRadius: Record<string, string>;
      spacing: Record<string, string>;
    };
  };
}

export interface DtcgToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
  [key: string]: unknown;
}

export interface DtcgExport {
  [key: string]: DtcgToken | DtcgExport | string;
}

export const COMPONENT_PROPERTY_WHITELIST = [
  "backgroundColor",
  "textColor",
  "typography",
  "rounded",
  "padding",
  "size",
  "height",
  "width",
] as const;

export type ComponentProperty = (typeof COMPONENT_PROPERTY_WHITELIST)[number];

// Canonical section order. Aliases resolve to the canonical key.
export const CANONICAL_SECTIONS: { canonical: string; aliases: string[] }[] = [
  { canonical: "Overview", aliases: ["Brand & Style", "Brand and Style"] },
  { canonical: "Colors", aliases: [] },
  { canonical: "Typography", aliases: [] },
  { canonical: "Layout", aliases: ["Layout & Spacing", "Layout and Spacing"] },
  { canonical: "Elevation & Depth", aliases: ["Elevation"] },
  { canonical: "Shapes", aliases: [] },
  { canonical: "Components", aliases: [] },
  { canonical: "Do's and Don'ts", aliases: ["Dos and Donts", "Do and Don't", "Do's and Don'ts"] },
];

export function canonicalSection(heading: string): string | null {
  const h = heading.trim().toLowerCase().replace(/\s+/g, " ");
  for (const s of CANONICAL_SECTIONS) {
    if (s.canonical.toLowerCase() === h) return s.canonical;
    if (s.aliases.some((a) => a.toLowerCase() === h)) return s.canonical;
  }
  return null; // unknown section — preserved, not errored
}
