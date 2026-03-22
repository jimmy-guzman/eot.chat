import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextMessage } from "./text-message";

describe("TextMessage", () => {
  it("should render the message body", () => {
    render(<TextMessage body="Hello world" />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
