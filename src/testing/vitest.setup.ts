import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { server } from "./mocks/server";

beforeEach(() => {
  Object.defineProperty(globalThis, "origin", {
    configurable: true,
    value: "http://localhost:3000",
    writable: true,
  });
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();

  cleanup();
});
