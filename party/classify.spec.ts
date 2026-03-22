import { Effect } from "effect";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/testing/mocks/server";

import { classify } from "./classify";

const MOCK_API_KEY = "sk-test-key";
const MOCK_SYSTEM_PROMPT = "Classify the message.";

const sseBody = (content: string): string => {
  const response = {
    id: "resp-1",
    output: [],
    outputText: content,
    status: "completed",
    usage: { inputTokens: 1, outputTokens: 1 },
  };

  return `data: ${JSON.stringify({ response, type: "response.completed" })}\n\n`;
};

const mockOpenRouterResponse = (content: string) => {
  server.use(
    http.post("https://openrouter.ai/api/v1/responses", () => {
      return new HttpResponse(sseBody(content), {
        headers: { "Content-Type": "text/event-stream" },
        status: 200,
      });
    }),
  );
};

describe("classify", () => {
  it("should return a valid Classification from a well-formed OpenRouter response", async () => {
    mockOpenRouterResponse(
      JSON.stringify({ props: { body: "hello" }, type: "TextMessage" }),
    );

    const result = await Effect.runPromise(
      classify("hello", MOCK_API_KEY, MOCK_SYSTEM_PROMPT),
    );

    expect(result).toStrictEqual({
      props: { body: "hello" },
      type: "TextMessage",
    });
  });

  it("should fall back to TextMessage when the response contains malformed JSON", async () => {
    mockOpenRouterResponse("not valid json at all");

    const result = await Effect.runPromise(
      classify("hello", MOCK_API_KEY, MOCK_SYSTEM_PROMPT),
    );

    expect(result).toStrictEqual({
      props: { body: "hello" },
      type: "TextMessage",
    });
  });

  it("should fall back to TextMessage when the response has an unknown component type", async () => {
    mockOpenRouterResponse(
      JSON.stringify({ props: {}, type: "UnknownComponent" }),
    );

    const result = await Effect.runPromise(
      classify("hello", MOCK_API_KEY, MOCK_SYSTEM_PROMPT),
    );

    expect(result).toStrictEqual({
      props: { body: "hello" },
      type: "TextMessage",
    });
  });

  it("should fall back to TextMessage on a network error", async () => {
    server.use(
      http.post("https://openrouter.ai/api/v1/responses", () => {
        return HttpResponse.error();
      }),
    );

    const result = await Effect.runPromise(
      classify("hello", MOCK_API_KEY, MOCK_SYSTEM_PROMPT),
    );

    expect(result).toStrictEqual({
      props: { body: "hello" },
      type: "TextMessage",
    });
  });
});
