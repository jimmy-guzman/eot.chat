import { OpenRouter } from "@openrouter/sdk";
import { Effect, Schema } from "effect";

export interface Classification {
  props: Record<string, unknown>;
  type: string;
}

const ClassificationSchema = Schema.Struct({
  props: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  type: Schema.String,
});

const textMessageFallback = (body: string): Classification => {
  return { props: { body }, type: "TextMessage" };
};

export const classify = (
  body: string,
  apiKey: string,
  systemPrompt: string,
): Effect.Effect<Classification> => {
  const program = Effect.gen(function* () {
    const client = new OpenRouter({ apiKey });

    const raw = yield* Effect.tryPromise<string>(() => {
      return client
        .callModel({
          input: body,
          instructions: systemPrompt,
          model: "google/gemini-2.0-flash-001",
        })
        .getText();
    });

    const parsed = yield* Effect.try({
      catch: () => new Error("parse error"),
      try: (): unknown => JSON.parse(raw),
    });

    const classification =
      yield* Schema.decodeUnknown(ClassificationSchema)(parsed);

    return classification;
  });

  return Effect.timeout(program, "8 seconds").pipe(
    Effect.catchAll(() => Effect.succeed(textMessageFallback(body))),
  );
};
