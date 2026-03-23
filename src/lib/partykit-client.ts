import type { HttpClientError } from "@effect/platform";

import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Config, Data, Effect, Schedule, Schema } from "effect";

export class PartyKitError extends Data.TaggedError("PartyKitError")<{
  cause: unknown;
  status?: number;
}> {}

export class RoomNotFoundError extends Data.TaggedError("RoomNotFoundError")<
  Record<never, never>
> {}

const RoomSchema = Schema.Struct({ name: Schema.String });

const retryPolicy = Schedule.exponential("200 millis").pipe(
  Schedule.compose(Schedule.recurs(2)),
);

const roomUrl = (base: string, id: string): string => {
  return `${base}/parties/main/${id}`;
};

const mapHttpError = (
  e: HttpClientError.HttpClientError,
): PartyKitError | RoomNotFoundError => {
  if (e._tag === "ResponseError" && e.response.status === 404) {
    return new RoomNotFoundError();
  }

  return new PartyKitError({
    cause: e,
    status: e._tag === "ResponseError" ? e.response.status : undefined,
  });
};

export const getRoomName = (
  id: string,
): Effect.Effect<string, PartyKitError | RoomNotFoundError> => {
  return Config.string("PARTYKIT_URL").pipe(
    Effect.orDie,
    Effect.flatMap((base) => {
      return HttpClient.get(roomUrl(base, id)).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.flatMap(HttpClientResponse.schemaBodyJson(RoomSchema)),
        Effect.map((body) => body.name),
        Effect.mapError((e) => {
          if (e._tag === "ParseError") {
            return new PartyKitError({ cause: e });
          }

          return mapHttpError(e);
        }),
        Effect.retry({
          schedule: retryPolicy,
          while: (e) => e._tag === "PartyKitError",
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};

export const createPartyKitRoom = (
  id: string,
  name: string,
): Effect.Effect<void, PartyKitError | RoomNotFoundError> => {
  return Config.string("PARTYKIT_URL").pipe(
    Effect.orDie,
    Effect.flatMap((base) => {
      return HttpClient.execute(
        HttpClientRequest.post(roomUrl(base, id)).pipe(
          HttpClientRequest.setHeader("Content-Type", "application/json"),
          HttpClientRequest.setHeader("X-Action", "create"),
          HttpClientRequest.bodyUnsafeJson({ name }),
        ),
      ).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.asVoid,
        Effect.mapError(mapHttpError),
        Effect.retry({
          schedule: retryPolicy,
          while: (e) => e._tag === "PartyKitError",
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};
