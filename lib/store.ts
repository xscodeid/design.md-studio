"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  exportDtcg,
  exportTailwind,
  extractBody,
  lint,
  parseDesignMd,
  serializeDesignMd,
  type LintIssue,
} from "@/lib/engine";
import { SAMPLE_DESIGN_MD } from "@/lib/sample";

const STORAGE_KEY = "designmd-studio:doc";

export interface StudioState {
  text: string;
  setText: (t: string) => void;
  reset: () => void;
  loadSample: () => void;
}

export function useStudioDoc(initial?: string): StudioState {
  const [text, setText] = useState<string>(initial ?? SAMPLE_DESIGN_MD);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setText(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {
      /* ignore */
    }
  }, [text]);

  const reset = useCallback(() => setText(SAMPLE_DESIGN_MD), []);
  const loadSample = useCallback(() => setText(SAMPLE_DESIGN_MD), []);

  return { text, setText, reset, loadSample };
}

// Derive parsed model + lint + exports from raw text. Memoized on text.
export function useDerived(text: string) {
  return useMemo(() => {
    const parsed = parseDesignMd(text);
    const issues: LintIssue[] = lint(parsed);
    const body = extractBody(text);
    let tailwind = "";
    let dtcg = "";
    try {
      tailwind = JSON.stringify(exportTailwind(parsed.tokens), null, 2);
    } catch {
      tailwind = "";
    }
    try {
      dtcg = JSON.stringify(exportDtcg(parsed.tokens), null, 2);
    } catch {
      dtcg = "";
    }
    return {
      parsed,
      issues,
      body,
      tailwind,
      dtcg,
      errors: issues.filter((i) => i.severity === "error"),
      warnings: issues.filter((i) => i.severity === "warning"),
      infos: issues.filter((i) => i.severity === "info"),
    };
  }, [text]);
}
