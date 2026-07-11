"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { LintIssue } from "@/lib/engine";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LintPanelProps {
  issues: LintIssue[];
}

const SEV_ICON = {
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-sky-500" />,
} as const;

const SEV_BADGE = {
  error: "destructive",
  warning: "warning",
  info: "secondary",
} as const;

export function LintPanel({ issues }: LintPanelProps) {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2 px-1 pb-1 text-xs">
          <Badge variant="destructive">{errors.length} errors</Badge>
          <Badge variant="warning">{warnings.length} warns</Badge>
          <Badge variant="secondary">{infos.length} info</Badge>
        </div>

        {issues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> No issues — valid DESIGN.md.
          </div>
        ) : (
          issues.map((issue, idx) => (
            <div
              key={idx}
              className="rounded-lg border bg-card p-2.5 text-xs"
            >
              <div className="mb-1 flex items-center gap-2">
                {SEV_ICON[issue.severity]}
                <code className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {issue.rule}
                </code>
                {issue.tokenPath && (
                  <span className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    {issue.tokenPath}
                  </span>
                )}
              </div>
              <p className="leading-relaxed">{issue.message}</p>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
