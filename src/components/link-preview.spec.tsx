import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LinkPreview } from "./link-preview";

describe("LinkPreview", () => {
  it("should render title, domain and link", () => {
    render(
      <LinkPreview
        domain="vercel.com"
        title="Vercel"
        url="https://vercel.com"
      />,
    );

    expect(screen.getByText("Vercel")).toBeInTheDocument();
    expect(screen.getByText("vercel.com")).toBeInTheDocument();
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("should render optional description when provided", () => {
    render(
      <LinkPreview
        description="Deploy web apps"
        domain="vercel.com"
        title="Vercel"
        url="https://vercel.com"
      />,
    );

    expect(screen.getByText("Deploy web apps")).toBeInTheDocument();
  });
});
