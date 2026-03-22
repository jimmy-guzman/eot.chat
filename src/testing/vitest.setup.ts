import "@testing-library/jest-dom/vitest";

import { afterEach, beforeEach } from "node:test";

import { cleanup } from "@testing-library/react";
import { afterAll, beforeAll } from "vitest";

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
