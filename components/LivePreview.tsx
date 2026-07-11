"use client";

import { parseHex, resolveValue, type DesignTokens } from "@/lib/engine";

interface LivePreviewProps {
  tokens: DesignTokens;
}

// Render a CSSProperties object for a component entry, resolving {refs}.
function componentStyle(
  props: Record<string, string>,
  tokens: DesignTokens
): React.CSSProperties {
  const style: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(props)) {
    const val = resolveValue(v, tokens);
    switch (k) {
      case "backgroundColor":
        style.background = val;
        break;
      case "textColor":
        style.color = val;
        break;
      case "rounded":
        style.borderRadius = val;
        break;
      case "padding":
        style.padding = typeof v === "string" && /^\d+$/.test(v) ? `${v}px` : val;
        break;
      case "width":
        style.width = val;
        break;
      case "height":
        style.height = val;
        break;
      case "size":
        style.width = val;
        style.height = val;
        break;
      case "typography": {
        const tp = tokens.typography?.[v.replace(/^\{|\}$/g, "").split(".").pop() ?? ""];
        if (tp) {
          if (tp.fontFamily) style.fontFamily = tp.fontFamily;
          if (tp.fontSize) style.fontSize = tp.fontSize as string;
          if (tp.fontWeight) style.fontWeight = tp.fontWeight as number;
          if (tp.lineHeight) style.lineHeight = String(tp.lineHeight);
        }
        break;
      }
    }
  }

  // Auto-select visible text color when background is set but no explicit text color.
  if (style.background && !style.color) {
    const bgHex = typeof style.background === "string" ? style.background : "";
    const rgb = parseHex(bgHex);
    if (rgb) {
      // Relative luminance approximation (ITU-R BT.709)
      const luminance = 0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
      style.color = luminance > 0.5 ? "#000000" : "#FFFFFF";
    }
  }

  // Apply defaults for consistent chip-like rendering unless explicitly set.
  if (!style.padding) style.padding = "8px 12px";
  if (!style.borderRadius) style.borderRadius = "4px";

  return style as React.CSSProperties;
}

export function LivePreview({ tokens }: LivePreviewProps) {
  const colors = tokens.colors ?? {};
  const typography = tokens.typography ?? {};
  const components = tokens.components ?? {};

  const surface = resolveValue(colors.neutral ?? colors.background ?? "#FFFFFF", tokens);
  const ink = resolveValue(colors.primary ?? "#000000", tokens);

  return (
    <div
      className="h-full overflow-auto p-6"
      style={{ background: surface, color: ink }}
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest opacity-60">{tokens.name ?? "Untitled"}</p>
          {typography.h1 ? (
            <h1
              style={{
                fontFamily: typography.h1.fontFamily,
                fontSize: typography.h1.fontSize as string,
                fontWeight: typography.h1.fontWeight as number,
                lineHeight: typography.h1.lineHeight as number,
                letterSpacing: typography.h1.letterSpacing,
              }}
            >
              {tokens.description ?? "Design System Preview"}
            </h1>
          ) : (
            <h1 className="text-3xl font-bold">{tokens.description ?? "Design System Preview"}</h1>
          )}
          <p className="opacity-70" style={{ fontFamily: typography["body-md"]?.fontFamily }}>
            A live render of your DESIGN.md tokens. Edit tokens on the left and watch this
            preview update instantly.
          </p>
        </header>

        {/* Color swatches */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold opacity-70">Colors</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {Object.entries(colors).map(([name, value]) => {
              const hex = resolveValue(value, tokens);
              return (
                <div key={name} className="space-y-1 text-center">
                  <div
                    className="aspect-square w-full rounded-md border shadow-inner"
                    style={{ background: hex }}
                  />
                  <div className="truncate text-[10px] opacity-70">{name}</div>
                  <div className="truncate font-mono text-[9px] opacity-50">{hex}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold opacity-70">Typography</h2>
          <div className="space-y-2">
            {Object.entries(typography).map(([name, t]) => (
              <div key={name} className="flex items-baseline justify-between gap-4 border-b pb-2">
                <span className="font-mono text-[10px] opacity-50">{name}</span>
                <span
                  style={{
                    fontFamily: t.fontFamily,
                    fontSize: (t.fontSize as string) ?? "1rem",
                    fontWeight: t.fontWeight as number,
                    lineHeight: t.lineHeight as number,
                  }}
                >
                  The quick brown fox
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Components */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold opacity-70">Components</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(components).map(([name, props]) => (
              <span key={name} title={name} style={componentStyle(props, tokens)} className="inline-flex items-center gap-2 text-sm">
                {name.replace(/[-_]/g, " ")}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
