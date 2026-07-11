"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  deleteTokenAt,
  renameTokenAt,
  serializeDesignMd,
  setTokenAt,
  type DesignTokens,
} from "@/lib/engine";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ColorField } from "@/components/ColorField";

interface TokenEditorProps {
  tokens: DesignTokens;
  body: string;
  setText: (text: string) => void;
}

function commit(tokens: DesignTokens, body: string, setText: (t: string) => void) {
  setText(serializeDesignMd(tokens, body));
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TokenNameInput({
  group,
  name,
  tokens,
  body,
  setText,
  className,
}: {
  group: string;
  name: string;
  tokens: DesignTokens;
  body: string;
  setText: (t: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      return;
    }
    const result = renameTokenAt(tokens, group, name, trimmed);
    if (result) {
      setText(serializeDesignMd(result, body));
    } else {
      setValue(name);
    }
  };

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn(
        "h-7 px-1 font-mono text-xs border-transparent bg-transparent hover:border-input focus:border-input focus:bg-background",
        className
      )}
    />
  );
}

function nextName(existing: Record<string, unknown>, prefix: string): string {
  let max = 0;
  const re = new RegExp(`^${prefix}(\\d+)$`);
  for (const key of Object.keys(existing)) {
    const m = key.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}${max + 1}`;
}

export function TokenEditor({ tokens, body, setText }: TokenEditorProps) {
  const [showContent, setShowContent] = useState(true);
  const colors = tokens.colors ?? {};
  const typography = tokens.typography ?? {};
  const rounded = tokens.rounded ?? {};
  const spacing = tokens.spacing ?? {};

  const addColor = () => {
    const name = nextName(colors, "color");
    commit(setTokenAt(tokens, `colors.${name}`, "#000000"), body, setText);
  };
  const addSimple = (group: "rounded" | "spacing", unit: string) => {
    const obj = group === "rounded" ? rounded : spacing;
    const name = nextName(obj, "sm");
    commit(setTokenAt(tokens, `${group}.${name}`, `4${unit}`), body, setText);
  };
  const addTypography = () => {
    const name = nextName(typography, "text");
    commit(
      setTokenAt(tokens, `typography.${name}`, {
        fontFamily: "Inter",
        fontSize: "1rem",
        fontWeight: 400,
        lineHeight: 1.5,
      }),
      body,
      setText
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setShowContent((p) => !p)}
          className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50"
        >
          <span>Token Editor</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${showContent ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <div className={`space-y-6 p-4 ${showContent ? "block" : "hidden md:block"}`}>
        <Section title="Colors">
          <div className="space-y-4">
            {Object.entries(colors).map(([name, value]) => (
              <div key={name} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <TokenNameInput
                    group="colors"
                    name={name}
                    tokens={tokens}
                    body={body}
                    setText={setText}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Delete ${name}`}
                    onClick={() =>
                      commit(deleteTokenAt(tokens, `colors.${name}`), body, setText)
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <ColorField
                  hideLabel
                  label={name}
                  value={value}
                  onChange={(v) =>
                    commit(setTokenAt(tokens, `colors.${name}`, v), body, setText)
                  }
                />
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={addColor}>
            <Plus /> Add color
          </Button>
        </Section>

        <Separator />

        <Section title="Typography">
          <div className="space-y-4">
            {Object.entries(typography).map(([name, t]) => (
              <div key={name} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <TokenNameInput
                    group="typography"
                    name={name}
                    tokens={tokens}
                    body={body}
                    setText={setText}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Delete ${name}`}
                    onClick={() =>
                      commit(deleteTokenAt(tokens, `typography.${name}`), body, setText)
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Font</Label>
                    <Input
                      value={t.fontFamily ?? ""}
                      className="h-7 text-xs"
                      onChange={(e) =>
                        commit(
                          setTokenAt(tokens, `typography.${name}.fontFamily`, e.target.value),
                          body,
                          setText
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Size</Label>
                    <Input
                      value={String(t.fontSize ?? "")}
                      className="h-7 text-xs"
                      onChange={(e) =>
                        commit(
                          setTokenAt(tokens, `typography.${name}.fontSize`, e.target.value),
                          body,
                          setText
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Weight</Label>
                    <Input
                      value={String(t.fontWeight ?? "")}
                      className="h-7 text-xs"
                      onChange={(e) =>
                        commit(
                          setTokenAt(
                            tokens,
                            `typography.${name}.fontWeight`,
                            Number(e.target.value) || 400
                          ),
                          body,
                          setText
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Line</Label>
                    <Input
                      value={String(t.lineHeight ?? "")}
                      className="h-7 text-xs"
                      onChange={(e) =>
                        commit(
                          setTokenAt(tokens, `typography.${name}.lineHeight`, e.target.value),
                          body,
                          setText
                        )
                      }
                    />
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Letter Spacing</Label>
                  <Input
                    value={String(t.letterSpacing ?? "")}
                    className="h-7 text-xs"
                    onChange={(e) =>
                      commit(
                        setTokenAt(tokens, `typography.${name}.letterSpacing`, e.target.value),
                        body,
                        setText
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={addTypography}>
            <Plus /> Add typography
          </Button>
        </Section>

        <Separator />

        <Section title="Radius">
          <div className="space-y-2">
            {Object.entries(rounded).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <TokenNameInput
                  group="rounded"
                  name={name}
                  tokens={tokens}
                  body={body}
                  setText={setText}
                  className="w-20 shrink-0"
                />
                <Input
                  value={value}
                  className="h-7 flex-1 text-xs"
                  onChange={(e) =>
                    commit(setTokenAt(tokens, `rounded.${name}`, e.target.value), body, setText)
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground"
                  aria-label={`Delete ${name}`}
                  onClick={() => commit(deleteTokenAt(tokens, `rounded.${name}`), body, setText)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => addSimple("rounded", "px")}>
            <Plus /> Add radius
          </Button>
        </Section>

        <Separator />

        <Section title="Spacing">
          <div className="space-y-2">
            {Object.entries(spacing).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <TokenNameInput
                  group="spacing"
                  name={name}
                  tokens={tokens}
                  body={body}
                  setText={setText}
                  className="w-20 shrink-0"
                />
                <Input
                  value={value}
                  className="h-7 flex-1 text-xs"
                  onChange={(e) =>
                    commit(setTokenAt(tokens, `spacing.${name}`, e.target.value), body, setText)
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground"
                  aria-label={`Delete ${name}`}
                  onClick={() => commit(deleteTokenAt(tokens, `spacing.${name}`), body, setText)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => addSimple("spacing", "px")}>
            <Plus /> Add spacing
          </Button>
        </Section>
      </div>
    </ScrollArea>
  );
}
