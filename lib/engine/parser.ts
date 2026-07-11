import * as YAML from "yaml";
import type { DesignTokens, ParseResult, SectionDef } from "./types";

// Split a DESIGN.md string into YAML front matter + markdown body.
// Returns null front matter parse errors in result.errors.
export function parseDesignMd(raw: string): ParseResult {
  const errors: string[] = [];
  const result: ParseResult = {
    tokens: {},
    sections: [],
    raw,
    errors,
  };

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!fmMatch) {
    errors.push("Missing YAML front matter delimited by --- ... --- at the top of the file.");
    result.sections = splitSections(raw, 1);
    return result;
  }

  const yamlText = fmMatch[1];
  const body = raw.slice(fmMatch[0].length);

  try {
    const tokens = YAML.parse(yamlText);
    result.tokens = tokens && typeof tokens === "object" ? (tokens as DesignTokens) : {};
  } catch (e) {
    errors.push(`YAML front matter parse error: ${(e as Error).message}`);
    result.tokens = {};
  }

  // Compute the line offset of the body (front matter block + closing ---).
  const fmLines = yamlText.split(/\r?\n/).length + 1; // include opening + closing ---
  const bodyStartLine = fmLines + 1;
  result.sections = splitSections(body, bodyStartLine);

  return result;
}

// Split markdown body into H2 sections (## Heading), preserving order.
function splitSections(body: string, startLine: number): SectionDef[] {
  const lines = body.split(/\r?\n/);
  const sections: SectionDef[] = [];
  let current: SectionDef | null = null;

  lines.forEach((line, i) => {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (current) sections.push(current);
      current = {
        heading: m[1].trim(),
        body: "",
        lineStart: startLine + i,
      };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  });
  if (current) sections.push(current);
  return sections;
}

// Serialize tokens back to a DESIGN.md string, preserving the markdown body
// captured separately (body is passed in so the editor can keep prose intact).
export function serializeDesignMd(tokens: DesignTokens, body: string): string {
  const yamlText = YAML.stringify(tokens).trimEnd();
  const sep = body ? "\n\n" : "";
  return `---\n${yamlText}\n---\n${sep}${body.trim() ? body.trim() + "\n" : ""}`;
}

// Extract the markdown body (everything after the closing ---) from raw text.
export function extractBody(raw: string): string {
  const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!fmMatch) return raw;
  return raw.slice(fmMatch[0].length);
}
