"use client";

import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import {
  contrastRatio,
  resolveValue,
  type DesignTokens,
} from "@/lib/engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WcagPanelProps {
  tokens: DesignTokens;
}

interface Pair {
  component: string;
  fg: string;
  bg: string;
  ratio: number;
  aa: boolean;
  aaa: boolean;
}

export function WcagPanel({ tokens }: WcagPanelProps) {
  const components = tokens.components ?? {};
  const pairs: Pair[] = [];

  for (const [name, props] of Object.entries(components)) {
    const fg = resolveValue(props.textColor, tokens);
    const bg = resolveValue(props.backgroundColor, tokens);
    if (!fg || !bg) continue;
    const res = contrastRatio(fg, bg);
    if (!res) continue;
    pairs.push({
      component: name,
      fg: res.foreground,
      bg: res.background,
      ratio: res.ratio,
      aa: res.aa,
      aaa: res.aaa,
    });
  }

  return (
    <div className="h-full space-y-4 overflow-auto p-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">WCAG 2.1 Contrast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          <p>AA requires 4.5:1 for normal text (3:1 for large text).</p>
          <p>AAA requires 7:1.</p>
        </CardContent>
      </Card>

      {pairs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No component defines both <code>textColor</code> and <code>backgroundColor</code>.
          Add a component with both to check contrast.
        </p>
      ) : (
        <div className="space-y-2">
          {pairs.map((p) => (
            <div key={p.component} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs">{p.component}</span>
                {p.aaa ? (
                  <Badge variant="success">AAA</Badge>
                ) : p.aa ? (
                  <Badge variant="default">AA</Badge>
                ) : (
                  <Badge variant="destructive">Fail</Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold"
                  style={{ background: p.bg, color: p.fg }}
                >
                  Aa
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {p.aa ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="font-mono">{p.ratio}:1</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>
                      {p.fg} on {p.bg}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
