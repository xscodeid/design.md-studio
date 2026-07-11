import type {
  DesignTokens,
  DtcgExport,
  DtcgToken,
  TailwindThemeExport,
  TypographyToken,
} from "./types";
import { isRef, resolveRef } from "./tokens";
import { parseHex } from "./wcag";

// Build a Tailwind theme.extend export from tokens. Colors map to hex (refs
// resolved); typography -> fontFamily + fontSize (with weight/letterSpacing);
// rounded/spacing -> borderRadius/spacing. Shaped to match `@google/design.md`.
export function exportTailwind(tokens: DesignTokens): TailwindThemeExport {
  const colors: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens.colors ?? {})) {
    const hex = isRef(v) ? resolveRef(v, tokens) ?? v : v;
    colors[k] = hex;
  }

  const fontFamily: Record<string, string[]> = {};
  const fontSize: Record<string, [string, Record<string, string>]> = {};
  for (const [k, v] of Object.entries(tokens.typography ?? {})) {
    if (typeof v !== "object" || !v) continue;
    if (v.fontFamily) {
      fontFamily[k] = [v.fontFamily, "ui-sans-serif", "system-ui", "sans-serif"];
    }
    const opts: Record<string, string> = {};
    if (v.letterSpacing) opts.letterSpacing = v.letterSpacing;
    if (v.fontWeight !== undefined) opts.fontWeight = String(v.fontWeight);
    if (v.lineHeight !== undefined) opts.lineHeight = String(v.lineHeight);
    if (v.fontSize) {
      fontSize[k] = [String(v.fontSize), opts];
    }
  }

  const borderRadius: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens.rounded ?? {})) {
    borderRadius[k] = isRef(v) ? resolveRef(v, tokens) ?? v : v;
  }

  const spacing: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens.spacing ?? {})) {
    spacing[k] = isRef(v) ? resolveRef(v, tokens) ?? v : v;
  }

  return {
    theme: {
      extend: {
        colors,
        fontFamily,
        fontSize,
        borderRadius,
        spacing,
      },
    },
  };
}

function hexToDtcgColor(hex: string) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return {
    colorSpace: "srgb",
    components: [
      Math.round(r * 1000) / 1000,
      Math.round(g * 1000) / 1000,
      Math.round(b * 1000) / 1000,
    ],
    hex: hex.toLowerCase(),
  };
}

function dtcgFromTypography(t: TypographyToken): DtcgToken {
  const val: Record<string, unknown> = {};
  if (t.fontFamily) val.fontFamily = t.fontFamily;
  if (t.fontSize) val.fontSize = t.fontSize;
  if (t.fontWeight !== undefined) val.fontWeight = t.fontWeight;
  if (t.lineHeight !== undefined) val.lineHeight = t.lineHeight;
  if (t.letterSpacing) val.letterSpacing = t.letterSpacing;
  return { $type: "typography", $value: val };
}

// Build a W3C DTCG (Design Tokens Format Module) JSON structure, matching the
// shape produced by `@google/design.md` (srgb + components + hex per color).
export function exportDtcg(tokens: DesignTokens): DtcgExport {
  const root: DtcgExport = {};

  if (tokens.description) {
    root.$description = tokens.description;
  }
  root.$schema =
    "https://www.designtokens.org/schemas/2025.10/format.json";

  root.color = { $type: "color" };
  for (const [k, v] of Object.entries(tokens.colors ?? {})) {
    const raw = (isRef(v) ? resolveRef(v, tokens) ?? v : v).toLowerCase();
    const hex = raw.startsWith("#") ? raw : `#${raw}`;
    if (parseHex(hex)) {
      (root.color as DtcgExport)[k] = {
        $type: "color",
        $value: hexToDtcgColor(hex),
      };
    }
  }

  root.typography = {};
  for (const [k, v] of Object.entries(tokens.typography ?? {})) {
    if (v && typeof v === "object") {
      (root.typography as DtcgExport)[k] = dtcgFromTypography(v);
    }
  }

  const dimGroup = (group: "rounded" | "spacing" | "elevation" | "shapes") => {
    const g: DtcgExport = {};
    for (const [k, v] of Object.entries(tokens[group] ?? {})) {
      const resolved = isRef(v as string) ? resolveRef(v as string, tokens) ?? v : v;
      g[k] = { $value: resolved };
    }
    return g;
  };

  root.radius = dimGroup("rounded");
  root.spacing = dimGroup("spacing");
  root.elevation = dimGroup("elevation");
  root.shape = dimGroup("shapes");

  if (tokens.components) {
    root.component = {};
    for (const [name, props] of Object.entries(tokens.components)) {
      const entry: DtcgExport = {};
      for (const [p, val] of Object.entries(props)) {
        entry[p] = { $value: isRef(val) ? resolveRef(val, tokens) ?? val : val };
      }
      (root.component as DtcgExport)[name] = entry;
    }
  }

  return root;
}
