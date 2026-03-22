import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Callout } from "./callout";

describe("Callout", () => {
  it("should render type info with content", () => {
    render(<Callout content="This is informational." type="info" />);

    expect(screen.getByText("This is informational.")).toBeInTheDocument();
    expect(screen.getByText("ℹ")).toBeInTheDocument();
  });

  it("should render type tip with content", () => {
    render(<Callout content="Use the shortcut." type="tip" />);

    expect(screen.getByText("Use the shortcut.")).toBeInTheDocument();
    expect(screen.getByText("✦")).toBeInTheDocument();
  });

  it("should render type warning with content", () => {
    render(<Callout content="Danger ahead." type="warning" />);

    expect(screen.getByText("Danger ahead.")).toBeInTheDocument();
    expect(screen.getByText("⚠")).toBeInTheDocument();
  });

  it("should render optional title", () => {
    render(<Callout content="Some detail." title="Note" type="info" />);

    expect(screen.getByText("Note")).toBeInTheDocument();
  });

  it("should render without title", () => {
    render(<Callout content="Just the content." type="tip" />);

    expect(screen.getByText("Just the content.")).toBeInTheDocument();
  });
});
