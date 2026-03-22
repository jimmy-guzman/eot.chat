import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Timeline } from "./timeline";

const items = [
  { status: "completed" as const, title: "Design" },
  { status: "current" as const, title: "Build" },
  { status: "upcoming" as const, title: "Launch" },
];

describe("Timeline", () => {
  it("should render all items", () => {
    render(<Timeline items={items} />);

    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Launch")).toBeInTheDocument();
  });

  it("should render item with optional date", () => {
    render(<Timeline items={[{ date: "2025-01-01", title: "Kickoff" }]} />);

    expect(screen.getByText("Kickoff")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01")).toBeInTheDocument();
  });

  it("should render item with optional description", () => {
    render(
      <Timeline
        items={[{ description: "Gather requirements", title: "Discovery" }]}
      />,
    );

    expect(screen.getByText("Discovery")).toBeInTheDocument();
    expect(screen.getByText("Gather requirements")).toBeInTheDocument();
  });

  it("should render item without optional fields", () => {
    render(<Timeline items={[{ title: "Step One" }]} />);

    expect(screen.getByText("Step One")).toBeInTheDocument();
  });
});
