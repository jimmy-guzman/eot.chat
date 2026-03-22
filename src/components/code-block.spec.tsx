import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("should render the code content", () => {
    render(<CodeBlock code="const x = 42;" />);

    expect(screen.getByText("const x = 42;")).toBeInTheDocument();
  });

  it("should render optional filename and language when provided", () => {
    render(
      <CodeBlock code="const x = 42;" filename="example.ts" language="ts" />,
    );

    expect(screen.getByText("example.ts")).toBeInTheDocument();
    expect(screen.getByText("ts")).toBeInTheDocument();
  });
});
