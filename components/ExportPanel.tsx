"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExportPanelProps {
  tailwind: string;
  dtcg: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function CodeView({
  title,
  content,
  downloadName,
}: {
  title: string;
  content: string;
  downloadName: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7" onClick={onCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" className="h-7" onClick={() => download(downloadName, content)}>
            <Download />
            JSON
          </Button>
        </div>
      </div>
      <pre className="max-h-[60vh] overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-relaxed">
        <code>{content || "// nothing to export"}</code>
      </pre>
    </div>
  );
}

export function ExportPanel({ tailwind, dtcg }: ExportPanelProps) {
  return (
    <div className="h-full space-y-4 overflow-auto p-4">
      <p className="text-sm text-muted-foreground">
        One-click exports. Copy or download a Tailwind theme and a W3C DTCG token file.
      </p>
      <Tabs defaultValue="tailwind" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
          <TabsTrigger value="dtcg">DTCG JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="tailwind">
          <CodeView title="tailwind.theme.json" content={tailwind} downloadName="tailwind.theme.json" />
        </TabsContent>
        <TabsContent value="dtcg">
          <CodeView title="tokens.json" content={dtcg} downloadName="tokens.json" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
