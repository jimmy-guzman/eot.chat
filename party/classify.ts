import { OpenRouter } from "@openrouter/sdk";
import { Effect, Schema } from "effect";

import { componentNames } from "../src/catalog/schema";

export interface Classification {
  props: Record<string, unknown>;
  type: string;
}

const ComponentTypeSchema = Schema.Literal(...componentNames);

const ClassificationSchema = Schema.Struct({
  props: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  type: ComponentTypeSchema,
});

const ClassificationFromJson = Schema.parseJson(ClassificationSchema);

const stripFences = (raw: string): string => {
  const trimmed = raw.trim();
  const withoutOpen = trimmed.startsWith("```json")
    ? trimmed.slice("```json".length)
    : trimmed.startsWith("```")
      ? trimmed.slice("```".length)
      : trimmed;
  const withoutClose = withoutOpen.trimStart().endsWith("```")
    ? withoutOpen.trimStart().slice(0, -"```".length)
    : withoutOpen.trimStart();

  return withoutClose.trim();
};

const textMessageFallback = (body: string): Classification => {
  return { props: { body }, type: "TextMessage" };
};

export const classify = (
  body: string,
  apiKey: string,
  systemPrompt: string,
): Effect.Effect<Classification> => {
  const program = Effect.gen(function* () {
    yield* Effect.logDebug("classify: start", { body: body.slice(0, 100) });

    const client = new OpenRouter({ apiKey });

    const raw = yield* Effect.tryPromise<string>(() => {
      return client
        .callModel({
          input: body,
          instructions: systemPrompt,
          model: "google/gemini-2.0-flash-001",
        })
        .getText();
    },
    );

    yield* Effect.logDebug("classify: raw response", {
      raw: raw.slice(0, 300),
    });

    const cleaned = stripFences(raw);

    const classification = yield* Schema.decodeUnknown(ClassificationFromJson)(
      cleaned,
    );

    yield* Effect.logInfo("classify: success", { type: classification.type });

    return classification;
  });

  return Effect.timeout(program, "8 seconds").pipe(
    Effect.tapError((e) => {
      return Effect.logWarning("classify: fallback to TextMessage", {
        reason: String(e),
      });
    },
    ),
    Effect.catchAll(() => Effect.succeed(textMessageFallback(body))),
  );
};
