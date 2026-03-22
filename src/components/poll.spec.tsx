import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Poll } from "./poll";

describe("Poll", () => {
  it("should render the question and all options", () => {
    render(
      <Poll
        options={["This week", "Next week"]}
        question="When should we ship?"
      />,
    );

    expect(screen.getByText("When should we ship?")).toBeInTheDocument();
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("Next week")).toBeInTheDocument();
  });
});
