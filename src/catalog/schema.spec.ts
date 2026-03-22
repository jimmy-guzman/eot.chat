import { describe, expect, expectTypeOf, it } from "vitest";

import { schemas, systemPrompt } from "./schema";

describe("schemas.TextMessage", () => {
  it("should accept valid props", () => {
    expect(schemas.TextMessage.parse({ body: "hello" })).toStrictEqual({
      body: "hello",
    });
  });

  it("should reject missing body", () => {
    expect(() => schemas.TextMessage.parse({})).toThrow("Invalid input");
  });
});

describe("schemas.LinkPreview", () => {
  it("should accept valid required props", () => {
    expect(
      schemas.LinkPreview.parse({
        domain: "vercel.com",
        title: "Vercel",
        url: "https://vercel.com",
      }),
    ).toStrictEqual({
      domain: "vercel.com",
      title: "Vercel",
      url: "https://vercel.com",
    });
  });

  it("should accept optional description", () => {
    const result = schemas.LinkPreview.parse({
      description: "Deploy web apps",
      domain: "vercel.com",
      title: "Vercel",
      url: "https://vercel.com",
    });

    expect(result.description).toBe("Deploy web apps");
  });

  it("should reject missing required fields", () => {
    expect(() =>
      schemas.LinkPreview.parse({ url: "https://vercel.com" }),
    ).toThrow("Invalid input");
  });
});

describe("schemas.RepoCard", () => {
  it("should accept valid required props", () => {
    expect(
      schemas.RepoCard.parse({
        owner: "vercel",
        repo: "next.js",
        url: "https://github.com/vercel/next.js",
      }),
    ).toStrictEqual({
      owner: "vercel",
      repo: "next.js",
      url: "https://github.com/vercel/next.js",
    });
  });

  it("should accept optional fields", () => {
    const result = schemas.RepoCard.parse({
      description: "The React Framework",
      language: "TypeScript",
      owner: "vercel",
      repo: "next.js",
      stars: 120_000,
      url: "https://github.com/vercel/next.js",
    });

    expect(result.stars).toBe(120_000);
    expect(result.language).toBe("TypeScript");
  });

  it("should reject missing required fields", () => {
    expect(() => {
      return schemas.RepoCard.parse({
        url: "https://github.com/vercel/next.js",
      });
    }).toThrow("Invalid input");
  });
});

describe("schemas.CodeBlock", () => {
  it("should accept valid props", () => {
    expect(schemas.CodeBlock.parse({ code: "const x = 1;" })).toStrictEqual({
      code: "const x = 1;",
    });
  });

  it("should accept optional language and filename", () => {
    const result = schemas.CodeBlock.parse({
      code: "const x = 1;",
      filename: "example.ts",
      language: "ts",
    });

    expect(result.language).toBe("ts");
    expect(result.filename).toBe("example.ts");
  });

  it("should reject missing code", () => {
    expect(() => schemas.CodeBlock.parse({})).toThrow("Invalid input");
  });
});

describe("schemas.Table", () => {
  it("should accept valid props", () => {
    expect(
      schemas.Table.parse({
        headers: ["Name", "Role"],
        rows: [["Alice", "Engineer"]],
      }),
    ).toStrictEqual({
      headers: ["Name", "Role"],
      rows: [["Alice", "Engineer"]],
    });
  });

  it("should accept optional caption", () => {
    const result = schemas.Table.parse({
      caption: "Team roster",
      headers: ["Name"],
      rows: [],
    });

    expect(result.caption).toBe("Team roster");
  });

  it("should reject missing headers", () => {
    expect(() => schemas.Table.parse({ rows: [] })).toThrow("Invalid input");
  });
});

describe("schemas.Poll", () => {
  it("should accept valid props", () => {
    expect(
      schemas.Poll.parse({
        options: ["Yes", "No"],
        question: "Ship it?",
      }),
    ).toStrictEqual({ options: ["Yes", "No"], question: "Ship it?" });
  });

  it("should reject missing question", () => {
    expect(() => schemas.Poll.parse({ options: ["Yes"] })).toThrow(
      "Invalid input",
    );
  });

  it("should reject missing options", () => {
    expect(() => schemas.Poll.parse({ question: "Ship it?" })).toThrow(
      "Invalid input",
    );
  });
});

describe("schemas.ImageCard", () => {
  it("should accept valid props", () => {
    expect(
      schemas.ImageCard.parse({ url: "https://example.com/img.png" }),
    ).toStrictEqual({ url: "https://example.com/img.png" });
  });

  it("should accept optional alt and caption", () => {
    const result = schemas.ImageCard.parse({
      alt: "A chart",
      caption: "Q3 results",
      url: "https://example.com/img.png",
    });

    expect(result.alt).toBe("A chart");
    expect(result.caption).toBe("Q3 results");
  });

  it("should reject missing url", () => {
    expect(() => schemas.ImageCard.parse({})).toThrow("Invalid input");
  });
});

describe("systemPrompt", () => {
  it("should be a non-empty string", () => {
    expectTypeOf(systemPrompt).toBeString();

    expect(systemPrompt.length).toBeGreaterThan(0);
  });

  it("should mention all component names", () => {
    expect(systemPrompt).toContain("TextMessage");
    expect(systemPrompt).toContain("LinkPreview");
    expect(systemPrompt).toContain("RepoCard");
    expect(systemPrompt).toContain("CodeBlock");
    expect(systemPrompt).toContain("Table");
    expect(systemPrompt).toContain("Poll");
    expect(systemPrompt).toContain("ImageCard");
  });
});
