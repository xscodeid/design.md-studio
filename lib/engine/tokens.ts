import type { DesignTokens } from "./types";

// Resolve a token reference like "{colors.primary}" against the token tree.
// Returns the raw string value at that dotted path, or null if missing.
export function resolveRef(ref: string, tokens: DesignTokens): string | null {
  const m = ref.match(/^\{\s*([\w.-]+)\s*\}$/);
  if (!m) return null;
  const path = m[1].split(".");
  let cur: unknown = tokens;
  for (const seg of path) {
    if (cur && typeof cur === "object" && seg in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[seg];
    } else {
      return null;
    }
  }
  return typeof cur === "string" ? cur : null;
}

// Is the string a token reference? (used to decide whether to attempt resolve)
export function isRef(s: string): boolean {
  return /^\{\s*[\w.-]+\s*\}$/.test(s.trim());
}

// Immutable set of a token at a dotted path. Returns a new tokens object.
export function setTokenAt(
  tokens: DesignTokens,
  path: string,
  value: unknown
): DesignTokens {
  const segments = path.split(".");
  const clone: Record<string, unknown> = structuredCloneSafe(tokens);
  let cur = clone;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (typeof cur[seg] !== "object" || cur[seg] === null) {
      cur[seg] = {};
    }
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[segments[segments.length - 1]] = value;
  return clone as DesignTokens;
}

// Immutable delete of a token at a dotted path. Returns a new tokens object.
export function deleteTokenAt(tokens: DesignTokens, path: string): DesignTokens {
  const segments = path.split(".");
  const clone: Record<string, unknown> = structuredCloneSafe(tokens);
  let cur = clone;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (typeof cur[seg] !== "object" || cur[seg] === null) return tokens;
    cur = cur[seg] as Record<string, unknown>;
  }
  delete cur[segments[segments.length - 1]];
  return clone as DesignTokens;
}

function structuredCloneSafe<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Rename a token key within a group (e.g. rename "colors.primary" → "colors.brand").
// Returns null if the old name doesn't exist or the new name already exists.
export function renameTokenAt(
  tokens: DesignTokens,
  group: string,
  oldName: string,
  newName: string
): DesignTokens | null {
  if (oldName === newName || !newName.trim()) return null;

  const root = tokens as Record<string, unknown>;
  const groupTokens = root[group] as Record<string, unknown> | undefined;
  if (!groupTokens || !(oldName in groupTokens)) return null;
  if (newName in groupTokens) return null; // prevent silent overwrite

  const value = groupTokens[oldName];
  const oldPath = `${group}.${oldName}`;
  const newPath = `${group}.${newName}`;

  const afterDelete = deleteTokenAt(tokens, oldPath);
  return setTokenAt(afterDelete, newPath, value);
}

// Resolve a value that may be a reference; returns the final concrete string.
export function resolveValue(value: unknown, tokens: DesignTokens): string {
  if (typeof value !== "string") return String(value ?? "");
  if (isRef(value)) return resolveRef(value, tokens) ?? value;
  return value;
}
