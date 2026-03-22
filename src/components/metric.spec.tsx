import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Metric } from "./metric";

describe("Metric", () => {
  it("should render label and value", () => {
    render(<Metric label="Revenue" value="$1,200" />);

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("$1,200")).toBeInTheDocument();
  });

  it("should render trend up indicator", () => {
    render(<Metric label="Users" trend="up" value="500" />);

    expect(screen.getByText("↑")).toBeInTheDocument();
  });

  it("should render trend down indicator", () => {
    render(<Metric label="Churn" trend="down" value="3%" />);

    expect(screen.getByText("↓")).toBeInTheDocument();
  });

  it("should render trend neutral indicator", () => {
    render(<Metric label="Uptime" trend="neutral" value="99.9%" />);

    expect(screen.getByText("→")).toBeInTheDocument();
  });

  it("should render without trend prop", () => {
    render(<Metric label="Score" value="42" />);

    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render optional detail text", () => {
    render(<Metric detail="vs last month" label="Sales" value="200" />);

    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });
});
