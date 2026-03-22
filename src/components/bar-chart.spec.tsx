import type * as React from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BarChart } from "./bar-chart";

vi.mock("recharts", () => {
  return {Bar: () => null, BarChart: ({children}: {children: React.ReactNode}) => {return <figure>{children}</figure>;}, CartesianGrid: () => {
    return null;
  }, ResponsiveContainer: ({children}: {children: React.ReactNode}) => {return <div>{children}</div>;}, Tooltip: () => {
    return null;
  }, XAxis: () => null, YAxis: () => null};
});

const data = [
  { label: "Jan", value: 10 },
  { label: "Feb", value: 20 },
];

describe("BarChart", () => {
  it("should render with a data array", () => {
    render(<BarChart data={data} />);

    expect(screen.getByRole("figure")).toBeInTheDocument();
  });

  it("should render with an optional title", () => {
    render(<BarChart data={data} title="Monthly Sales" />);

    expect(screen.getByText("Monthly Sales")).toBeInTheDocument();
  });

  it("should render without crashing when data is empty", () => {
    render(<BarChart data={[]} />);

    expect(screen.getByRole("figure")).toBeInTheDocument();
  });
});
