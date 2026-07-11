"use client";

import { cn } from "@/lib/utils";
import { isRef, parseHex, rgbToHex } from "@/lib/engine";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  hideLabel?: boolean;
}

// A color editor: native picker + hex text input. Keeps value as "#RRGGBB".
export function ColorField({ label, value, onChange, hideLabel }: ColorFieldProps) {
  const isRefValue = isRef(value);
  const rgb = parseHex(value) ?? { r: 0, g: 0, b: 0 };
  return (
    <div className="flex items-center gap-2">
      {!hideLabel && (
        <label className="w-28 shrink-0 truncate text-sm text-muted-foreground" title={label}>
          {label}
        </label>
      )}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border">
        <input
          type="color"
          aria-label={`${label} color`}
          value={isRefValue ? "#000000" : rgbToHex(rgb)}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={isRefValue}
          className="absolute inset-0 h-12 w-12 -translate-x-2 -translate-y-2 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-30"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={cn(
          "h-8 flex-1 rounded-md border border-input bg-transparent px-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isRefValue ? "" : parseHex(value) ? "" : "border-destructive"
        )}
      />
    </div>
  );
}
