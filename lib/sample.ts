// A starter DESIGN.md (Google alpha spec, Apache-2.0 model) used as the default
// document when the app first loads. Editable in the studio.
export const SAMPLE_DESIGN_MD = `---
version: alpha
name: Heritage
description: Architectural minimalism meets journalistic gravitas.
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 4px
  md: 8px
  lg: 16px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
---

## Overview

Architectural Minimalism meets Journalistic Gravitas. Heritage is a quiet,
confident identity: deep ink, a single warm accent, and a humanist sans used
everywhere so nothing competes for attention.

## Colors

- **Primary (#1A1C1E):** Deep ink for headlines and core text.
- **Secondary (#6C7278):** Muted slate for supporting copy.
- **Tertiary (#B8422E):** "Boston Clay" — the sole driver for interaction.
- **Neutral (#F7F5F2):** Warm paper for surfaces.

## Typography

Public Sans for everything except small all-caps labels, which tighten to a
negative tracking for an editorial feel.

## Components

\`button-primary\` is the only high-emphasis action on a page. Its hover state
sinks to primary ink, keeping the accent reserved for rest state.
`;
