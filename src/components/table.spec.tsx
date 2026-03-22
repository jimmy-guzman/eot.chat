import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Table } from "./table";

describe("Table", () => {
  it("should render headers and row data", () => {
    render(<Table headers={["Name", "Role"]} rows={[["Alice", "Engineer"]]} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
  });

  it("should render optional caption when provided", () => {
    render(<Table caption="Team roster" headers={["Name"]} rows={[]} />);

    expect(screen.getByText("Team roster")).toBeInTheDocument();
  });
});
