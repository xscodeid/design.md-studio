# DESIGN.md Studio

![DESIGN.md Studio](./public/logo.png)

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Tests](https://img.shields.io/badge/tests-18%20passing-brightgreen)](#)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](#)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)](#)

A visual editor + linter for [Google's DESIGN.md design-token spec](https://github.com/google-labs-code/design.md) (alpha). Author tokens in a structured editor, see a live component preview, catch WCAG contrast problems, and export a Tailwind theme or a W3C DTCG token file — all in the browser.

**Live demo:** [designmd-studio.xscode.biz.id](https://designmd-studio.xscode.biz.id/)

Everything runs client-side: the parsing, linting, WCAG math, and export are a pure-TypeScript engine with no backend. Your document is persisted to `localStorage`, so the app is fully deployable as a static Vercel site.

## Features

- **Token Editor** — add/edit/remove colors, typography, radius, and spacing. Token names are editable inline. Letter-spacing is supported alongside font family, size, weight, and line height. Color values accept both raw hex and `{token}` references with a disabled native picker for refs.
- **Live Preview** — components, color swatches, and type specimens rendered straight from your tokens with `{token}` reference resolution. Component chips auto-select visible text color against their background.
- **Linter** — flags invalid hex, bad dimensions, broken `{refs}`, unknown component properties, duplicate/out-of-order sections, and emits a WCAG contrast finding per component.
- **WCAG 2.1 Panel** — per-component text/background contrast ratio with AA (4.5:1) / AAA (7:1) verdicts. Token references are resolved before computing contrast.
- **1-click Export** — `tailwind.theme.json` (`theme.extend`) and a W3C DTCG `tokens.json` (`$type`/`$value`), with copy + download.
- **Mobile Responsive** — collapsible token editor panel, wrapping header/footer, single-column layout on small screens.

## Architecture

```
app/                 Next.js App Router entry (page.tsx, layout.tsx, globals.css)
components/          TokenEditor, LivePreview, LintPanel, WcagPanel, ExportPanel, ColorField
components/ui/       shadcn/ui primitives (button, card, tabs, …)
lib/engine/          Pure-TS engine — no React, fully unit-tested
  types.ts           DESIGN.md token model + lint/WCAG/export types
  parser.ts          YAML front-matter + markdown section parsing/serialization
  tokens.ts          reference resolution, immutable set/delete/rename
  wcag.ts            sRGB relative-luminance + contrast-ratio math
  lint.ts            all lint rules (colors, typography, dimensions, refs, sections, components)
  export.ts          Tailwind theme + W3C DTCG JSON exporters
  index.ts           barrel export
lib/                 store.ts (localStorage + derived model), sample.ts, utils.ts
tests/               vitest suite for the engine (18 tests)
```

The engine is framework-agnostic: `lib/engine/*` imports nothing from React or Next.js and is covered by `tests/engine.test.ts`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build (strict TypeScript)
npm run test     # vitest engine suite
npm run lint     # eslint
```

## DESIGN.md spec model

The editor follows the alpha token model from `@google/design.md` (Apache-2.0). A document is YAML front matter delimited by `---` plus a markdown body of `##` sections (Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts). Token values may reference other tokens with `{group.key}` syntax; references are resolved everywhere (preview, lint, export, WCAG).

## Deploy

This is a static-friendly Next.js app (all routes produce static output) — deploy to Vercel with zero config:

```bash
vercel
```

No environment variables or secrets are required.

## Contributing

Contributions are welcome. The project is small and intentionally kept focused. Before investing time in a larger change, please open an issue to discuss.

### Project conventions

- **TypeScript only** — no plain JS. Use strict types; `any` is not allowed.
- **Framework-agnostic engine** — `lib/engine/` must not import from React, Next.js, or any DOM/browser API. Keep it pure TypeScript so it remains fully unit-testable.
- **Server Components by default** — only add `"use client"` when interactivity (state, effects, event handlers) is required.
- **Input validation** — use Zod for any user-facing form or API input.
- **Secrets** — all API keys and sensitive values go in `.env` (`.env*.local` is gitignored). Never hardcode secrets.
- **CSS** — use Tailwind CSS v4 utility classes. Avoid custom CSS files unless absolutely necessary.
- **Naming** — `camelCase` for variables/functions, `PascalCase` for components/types, `UPPER_SNAKE_CASE` for constants. All code artifacts must be in English.
- **Commit messages** — concise, focused on the "why". One commit per logical change.

### Development workflow

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests before pushing
npm test

# Lint and type-check
npm run lint
npm run build
```

### Codebase overview

```
lib/engine/     Pure-TS engine (parser, tokens, lint, export, WCAG math)
components/     React components (TokenEditor, LivePreview, LintPanel, …)
components/ui/  shadcn/ui primitives
app/            Next.js App Router pages and layout
tests/          Vitest test suite for the engine
```

### Pull request checklist

- [ ] `npm run build` passes with zero errors
- [ ] `npm test` passes (all existing + new tests for added functionality)
- [ ] No `any` types introduced
- [ ] Engine changes include corresponding unit tests
- [ ] UI changes are responsive (test at mobile and desktop widths)
- [ ] No hardcoded secrets or environment-specific values

## License

Apache-2.0. The DESIGN.md specification is © Google LLC (Apache-2.0).
