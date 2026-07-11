"use client";

import { useState } from "react";
import { Github, Palette, Eye, FileCode2, ShieldCheck, Download } from "lucide-react";
import { useDerived, useStudioDoc } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TokenEditor } from "@/components/TokenEditor";
import { LivePreview } from "@/components/LivePreview";
import { WcagPanel } from "@/components/WcagPanel";
import { ExportPanel } from "@/components/ExportPanel";
import { LintPanel } from "@/components/LintPanel";

export default function Home() {
  const { text, setText, reset } = useStudioDoc();
  const { parsed, issues, body, tailwind, dtcg, errors, warnings, infos } = useDerived(text);
  const [leftTab, setLeftTab] = useState("tokens");

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <img src="/logo.png" alt="DESIGN.md Studio" className="h-7 w-7" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-semibold">DESIGN.md Studio</h1>
            <p className="hidden truncate text-[10px] text-muted-foreground sm:block">
              Visual editor &amp; linter for Google&apos;s DESIGN.md spec
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant={errors.length ? "destructive" : "success"}>
            {errors.length ? `${errors.length} errors` : "valid"}
          </Badge>
          {warnings.length > 0 && <Badge variant="warning" className="hidden sm:inline-flex">{warnings.length} warns</Badge>}
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={reset}>
            Reset
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
            <a href="https://github.com/google-labs-code/design.md" target="_blank" rel="noreferrer">
              <Github className="h-3.5 w-3.5" /> Spec
            </a>
          </Button>
        </div>
      </header>

      {/* 2-panel workspace */}
      <div className="grid flex-1 grid-cols-1 grid-rows-[auto_1fr] overflow-hidden md:grid-cols-[minmax(320px,380px)_1fr] md:grid-rows-1">
        {/* LEFT: editor */}
        <aside className={`flex min-h-0 flex-col border-r ${leftTab === "source" ? "max-md:col-span-full max-md:row-span-full" : ""}`}>
          <Tabs value={leftTab} onValueChange={setLeftTab} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b px-3 pb-2 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="tokens">
                  <Palette className="mr-1 h-3.5 w-3.5" /> Tokens
                </TabsTrigger>
                <TabsTrigger value="source">
                  <FileCode2 className="mr-1 h-3.5 w-3.5" /> Source
                </TabsTrigger>
                <TabsTrigger value="lint">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Lint
                  {issues.length > 0 && (
                    <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] text-white">
                      {issues.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="tokens" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
              <TokenEditor tokens={parsed.tokens} body={body} setText={setText} />
            </TabsContent>
            <TabsContent value="source" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                className="h-full resize-none rounded-none border-0 font-mono text-xs leading-relaxed focus-visible:ring-0"
              />
            </TabsContent>
            <TabsContent value="lint" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
              <LintPanel issues={issues} />
            </TabsContent>
          </Tabs>
        </aside>

        {/* RIGHT: preview / wcag / export */}
        <main className={`flex min-h-0 flex-col ${leftTab === "source" ? "hidden md:flex" : ""}`}>
          <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col">
            <div className="border-b px-3 pb-2 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="preview">
                  <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                </TabsTrigger>
                <TabsTrigger value="wcag">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> WCAG
                </TabsTrigger>
                <TabsTrigger value="export">
                  <Download className="mr-1 h-3.5 w-3.5" /> Export
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preview" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
              <LivePreview tokens={parsed.tokens} />
            </TabsContent>
            <TabsContent value="wcag" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
              <WcagPanel tokens={parsed.tokens} />
            </TabsContent>
            <TabsContent value="export" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
              <ExportPanel tailwind={tailwind} dtcg={dtcg} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Separator />
      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-1.5 text-[10px] text-muted-foreground sm:justify-between">
        <span className="truncate">Local-only · state saved to your browser (localStorage)</span>
        <span className="font-mono">{errors.length} errors · {warnings.length} warnings · {infos.length} info</span>
      </footer>
    </div>
  );
}
