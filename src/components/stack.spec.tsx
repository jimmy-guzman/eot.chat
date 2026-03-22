import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Stack } from "./stack";

describe("Stack", () => {
  it("should render with default vertical direction", () => {
    render(
      <Stack>
        <span>Item A</span>
        <span>Item B</span>
      </Stack>,
    );

    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();
  });

  it("should render with horizontal direction", () => {
    render(
      <Stack direction="horizontal">
        <span>Left</span>
        <span>Right</span>
      </Stack>,
    );

    expect(screen.getByText("Left")).toBeInTheDocument();
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("should render with a custom gap", () => {
    render(
      <Stack gap={8}>
        <span>Top</span>
        <span>Bottom</span>
      </Stack>,
    );

    expect(screen.getByText("Top")).toBeInTheDocument();
    expect(screen.getByText("Bottom")).toBeInTheDocument();
  });
});
