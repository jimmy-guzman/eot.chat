import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RepoCard } from "./repo-card";

describe("RepoCard", () => {
  it("should render owner/repo and link", () => {
    render(
      <RepoCard
        owner="vercel"
        repo="next.js"
        url="https://github.com/vercel/next.js"
      />,
    );

    expect(screen.getByText("vercel/next.js")).toBeInTheDocument();
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("should render optional description, language and stars when provided", () => {
    render(
      <RepoCard
        description="The React Framework"
        language="TypeScript"
        owner="vercel"
        repo="next.js"
        stars={120_000}
        url="https://github.com/vercel/next.js"
      />,
    );

    expect(screen.getByText("The React Framework")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("★ 120000")).toBeInTheDocument();
  });
});
