import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImageCard } from "./image-card";

describe("ImageCard", () => {
  it("should render an image with the given url", () => {
    render(<ImageCard alt="test image" url="https://example.com/img.png" />);

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("should render optional caption when provided", () => {
    render(
      <ImageCard
        alt="A chart"
        caption="Q3 results"
        url="https://example.com/img.png"
      />,
    );

    expect(screen.getByText("Q3 results")).toBeInTheDocument();
  });
});
