import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { StatusNotification } from "./room-machine";

import { StatusBar } from "./status-bar";

describe("StatusBar", () => {
  it("should render nothing when notification is null", () => {
    const { container } = render(<StatusBar notification={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render a polite live region when a notification is present", () => {
    const notification: StatusNotification = {
      displayName: "Alice",
      type: "entered",
    };

    render(<StatusBar notification={notification} />);

    expect(screen.getByRole("paragraph")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("should display the correct text for a single typing user", () => {
    const notification: StatusNotification = {
      names: ["Alice"],
      type: "typing",
    };

    render(<StatusBar notification={notification} />);

    expect(screen.getByRole("paragraph")).toHaveTextContent("Alice is typing…");
  });

  it("should display the correct text for two typing users", () => {
    const notification: StatusNotification = {
      names: ["Alice", "Bob"],
      type: "typing",
    };

    render(<StatusBar notification={notification} />);

    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "Alice and Bob are typing…",
    );
  });

  it("should display the correct text for three or more typing users", () => {
    const notification: StatusNotification = {
      names: ["Alice", "Bob", "Carol"],
      type: "typing",
    };

    render(<StatusBar notification={notification} />);

    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "Alice, Bob and Carol are typing…",
    );
  });

  it("should display the correct text when a user has entered", () => {
    const notification: StatusNotification = {
      displayName: "Alice",
      type: "entered",
    };

    render(<StatusBar notification={notification} />);

    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "Alice has entered",
    );
  });

  it("should display the correct text when a user has exited", () => {
    const notification: StatusNotification = {
      displayName: "Alice",
      type: "exited",
    };

    render(<StatusBar notification={notification} />);

    expect(screen.getByRole("paragraph")).toHaveTextContent("Alice has exited");
  });

  it("should display the correct text when the chat was cleared", () => {
    const notification: StatusNotification = {
      displayName: "Alice",
      type: "cleared",
    };

    render(<StatusBar notification={notification} />);

    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "Alice cleared the chat",
    );
  });
});
