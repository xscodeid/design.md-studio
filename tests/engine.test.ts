import { describe, it, expect } from "vitest";
import {
  parseDesignMd,
  serializeDesignMd,
  resolveRef,
  isRef,
  lint,
  contrastRatio,
  parseHex,
  exportTailwind,
  exportDtcg,
  canonicalSection,
  type DesignTokens,
} from "@/lib/engine";
import { SAMPLE_DESIGN_MD } from "@/lib/sample";

const TOKENS: DesignTokens = {
  version: "alpha",
  name: "Heritage",
  colors: {
    primary: "#1A1C1E",
    tertiary: "#B8422E",
    neutral: "#F7F5F2",
  },
  typography: {
    h1: { fontFamily: "Public Sans", fontSize: "3rem", fontWeight: 700, lineHeight: 1.1 },
  },
  rounded: { sm: "4px" },
  spacing: { md: "16px" },
  components: {
    "button-primary": {
      backgroundColor: "{colors.tertiary}",
      textColor: "#FFFFFF",
    },
  },
};

describe("wcag", () => {
  it("parses hex", () => {
    expect(parseHex("#1A1C1E")).toEqual({ r: 26, g: 28, b: 30 });
    expect(parseHex("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("nope")).toBeNull();
  });

  it("computes black/white contrast as 21:1", () => {
    const r = contrastRatio("#000000", "#FFFFFF");
    expect(r?.ratio).toBe(21);
    expect(r?.aa).toBe(true);
    expect(r?.aaa).toBe(true);
  });

  it("flags low contrast", () => {
    const r = contrastRatio("#777777", "#FFFFFF");
    expect(r).not.toBeNull();
    expect(r!.aa).toBe(false);
  });
});

describe("token refs", () => {
  it("detects refs", () => {
    expect(isRef("{colors.primary}")).toBe(true);
    expect(isRef("#fff")).toBe(false);
  });
  it("resolves existing path", () => {
    expect(resolveRef("{colors.primary}", TOKENS)).toBe("#1A1C1E");
  });
  it("returns null for missing path", () => {
    expect(resolveRef("{colors.missing}", TOKENS)).toBeNull();
  });
});

describe("parser", () => {
  it("parses the sample into front matter + sections", () => {
    const res = parseDesignMd(SAMPLE_DESIGN_MD);
    expect(res.errors).toHaveLength(0);
    expect(res.tokens.name).toBe("Heritage");
    expect(Object.keys(res.tokens.colors ?? {})).toContain("tertiary");
    const headings = res.sections.map((s) => s.heading);
    expect(headings).toContain("Overview");
    expect(headings).toContain("Components");
  });

  it("reports missing front matter", () => {
    const res = parseDesignMd("# Just a heading");
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("round-trips tokens + body", () => {
    const body = "## Overview\n\nHi.";
    const out = serializeDesignMd(TOKENS, body);
    const reparsed = parseDesignMd(out);
    expect(reparsed.tokens.name).toBe("Heritage");
    expect(reparsed.sections[0].heading).toBe("Overview");
  });
});

describe("lint", () => {
  it("passes a clean sample with no errors", () => {
    const res = parseDesignMd(SAMPLE_DESIGN_MD);
    const issues = lint(res);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("flags a broken reference", () => {
    const bad: DesignTokens = {
      colors: { primary: "#000000" },
      components: { btn: { backgroundColor: "{colors.missing}" } },
    };
    const issues = lint({ tokens: bad, sections: [], raw: "", errors: [] });
    expect(issues.some((i) => i.rule === "broken-ref")).toBe(true);
  });

  it("flags invalid color", () => {
    const bad: DesignTokens = { colors: { primary: "notacolor" } };
    const issues = lint({ tokens: bad, sections: [], raw: "", errors: [] });
    expect(issues.some((i) => i.rule === "invalid-color")).toBe(true);
  });

  it("flags duplicate sections", () => {
    const issues = lint({
      tokens: TOKENS,
      sections: [
        { heading: "Colors", body: "", lineStart: 1 },
        { heading: "Colors", body: "", lineStart: 2 },
      ],
      raw: "",
      errors: [],
    });
    expect(issues.some((i) => i.rule === "duplicate-section")).toBe(true);
  });

  it("flags unknown component property as warning", () => {
    const bad: DesignTokens = {
      components: { btn: { backgroundColor: "#000", textColor: "#fff", weird: "x" } },
    };
    const issues = lint({ tokens: bad, sections: [], raw: "", errors: [] });
    expect(issues.some((i) => i.rule === "unknown-component-property")).toBe(true);
  });

  it("emits a wcag-contrast finding for button-primary", () => {
    const res = parseDesignMd(SAMPLE_DESIGN_MD);
    const issues = lint(res);
    expect(issues.some((i) => i.rule === "wcag-contrast" && i.component === "button-primary")).toBe(true);
  });
});

describe("canonical sections", () => {
  it("resolves aliases", () => {
    expect(canonicalSection("Brand & Style")).toBe("Overview");
    expect(canonicalSection("Layout & Spacing")).toBe("Layout");
    expect(canonicalSection("Random Section")).toBeNull();
  });
});

describe("export", () => {
  it("exports tailwind theme with resolved colors", () => {
    const tw = exportTailwind(TOKENS);
    expect(tw.theme.extend.colors.primary).toBe("#1A1C1E");
    expect(tw.theme.extend.colors.tertiary).toBe("#B8422E");
    expect(tw.theme.extend.borderRadius.sm).toBe("4px");
    // fontSize carries weight/letterSpacing options like the reference CLI
    expect((tw.theme.extend.fontSize.h1 as [string, Record<string, string>])[0]).toBe("3rem");
  });

  it("exports dtcg with $type/$value", () => {
    const dtcg = exportDtcg(TOKENS) as Record<string, any>;
    expect(dtcg.color.primary.$type).toBe("color");
    expect(dtcg.color.primary.$value.hex).toBe("#1a1c1e");
    expect(dtcg.component["button-primary"].backgroundColor.$value).toBe("#B8422E");
    expect(dtcg.typography.h1.$type).toBe("typography");
  });
});
