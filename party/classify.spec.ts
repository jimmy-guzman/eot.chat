import { Effect, Logger, LogLevel } from "effect";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/testing/mocks/server";

import { classify } from "./classify";

const MOCK_API_KEY = "sk-test-key";
const MOCK_SYSTEM_PROMPT = "Classify the message.";

/**
 * Builds a minimal non-streaming OpenResponses JSON body.
 * The SDK's `isNonStreamingResponse` check requires an `output` field and no
 * `toReadableStream` method. `output_text` is used by `extractTextFromResponse`
 * so the SDK returns it directly from `getText()`.
 */
const mockJsonResponse = (outputText: string) => {
  return HttpResponse.json({
    completed_at: 1_000_000,
    created_at: 1_000_000,
    error: null,
    frequency_penalty: null,
    id: "resp-test",
    incomplete_details: null,
    instructions: null,
    metadata: {},
    model: "google/gemini-2.0-flash-001",
    object: "response",
    output: [],
    output_text: outputText,
    parallel_tool_calls: false,
    presence_penalty: null,
    status: "completed",
    temperature: null,
    tool_choice: "none",
    tools: [],
    top_p: null,
    usage: {
      input_tokens: 1,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 1,
      output_tokens_details: { reasoning_tokens: 0 },
      total_tokens: 2,
    },
  });
};

const mockOpenRouterResponse = (outputText: string) => {
  server.use(
    http.post("https://openrouter.ai/api/v1/responses", () => {
      return mockJsonResponse(outputText);
    },
    ),
  );
};

interface LogEntry {
  level: string;
  message: string;
}

const makeCaptureLayer = (logs: LogEntry[]) => {
  const logger = Logger.make(({ logLevel, message }) => {
    logs.push({ level: logLevel.label, message: String(message) });
  });

  return Logger.replace(Logger.defaultLogger, logger);
};

const withCapturedLogs = <A>(
  effect: Effect.Effect<A>,
): Effect.Effect<{ logs: LogEntry[]; result: A }> => {
  return Effect.gen(function* () {
    const logs: LogEntry[] = [];
    const result = yield* effect.pipe(
      Logger.withMinimumLogLevel(LogLevel.Debug),
      Effect.provide(makeCaptureLayer(logs)),
    );

    return { logs, result };
  });
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

  it("should log classify:success at INFO level on a successful classification", async () => {
    mockOpenRouterResponse(
      JSON.stringify({ props: { body: "hello" }, type: "TextMessage" }),
    );

    const { logs } = await Effect.runPromise(
      withCapturedLogs(classify("hello", MOCK_API_KEY, MOCK_SYSTEM_PROMPT)),
    );

    const infoLogs = logs.filter((l) => l.level === "INFO");

    expect(infoLogs.some((l) => l.message.includes("classify: success"))).toBe(
      true,
    );
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

  it("should log a WARNING when falling back to TextMessage on malformed JSON", async () => {
    mockOpenRouterResponse("not valid json at all");

    const { logs } = await Effect.runPromise(
      withCapturedLogs(classify("hello", MOCK_API_KEY, MOCK_SYSTEM_PROMPT)),
    );

    const warnLogs = logs.filter((l) => l.level === "WARN");

    expect(warnLogs.some((l) => l.message.includes("classify: fallback"))).toBe(
      true,
    );
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
      },
      ),
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
