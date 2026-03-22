import type * as React from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LineChart } from "./line-chart";

vi.mock("recharts", () => {
  return {CartesianGrid: () => null, Line: () => null, LineChart: ({children}: {children: React.ReactNode}) => {return <figure>{children}</figure>;}, ResponsiveContainer: ({children}: {children: React.ReactNode}) => {return <div>{children}</div>;}, Tooltip: () => {
    return null;
  }, XAxis: () => null, YAxis: () => null};
});

const data = [
  { label: "Mon", value: 5 },
  { label: "Tue", value: 15 },
];

describe("LineChart", () => {
  it("should render with a data array", () => {
    render(<LineChart data={data} />);

    expect(screen.getByRole("figure")).toBeInTheDocument();
  });

  it("should render with an optional title", () => {
    render(<LineChart data={data} title="Weekly Trend" />);

    expect(screen.getByText("Weekly Trend")).toBeInTheDocument();
  });

  it("should render without crashing when data is empty", () => {
    render(<LineChart data={[]} />);

    expect(screen.getByRole("figure")).toBeInTheDocument();
  });
});
