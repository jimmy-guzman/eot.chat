import type { HttpClientError } from "@effect/platform";

import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { JOIN_REGISTRY_ROOM_ID } from "@party/constants";
import { Config, Data, Effect, Schedule, Schema } from "effect";

export class PartyKitError extends Data.TaggedError("PartyKitError")<{
  cause: unknown;
  status?: number;
}> {}

export class RoomNotFoundError extends Data.TaggedError("RoomNotFoundError")<
  Record<never, never>
> {}

export class JoinCodeNotFoundError extends Data.TaggedError(
  "JoinCodeNotFoundError",
)<Record<never, never>> {}

const RawRoomResponseSchema = Schema.Struct({
  id: Schema.String,
  joinCode: Schema.optional(Schema.String),
  joinCodeVersion: Schema.optional(Schema.Number),
  name: Schema.String,
});

export interface RoomMetadata {
  id: string;
  joinCode: string | undefined;
  joinCodeVersion: number;
  name: string;
}

const normalizeRoomMetadata = (
  raw: Schema.Schema.Type<typeof RawRoomResponseSchema>,
): RoomMetadata => {
  return {
    id: raw.id,
    joinCode: raw.joinCode,
    joinCodeVersion: raw.joinCodeVersion ?? 1,
    name: raw.name,
  };
};

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

const mapResolveError = (
  e: HttpClientError.HttpClientError,
): JoinCodeNotFoundError | PartyKitError => {
  if (e._tag === "ResponseError" && e.response.status === 404) {
    return new JoinCodeNotFoundError();
  }

  return new PartyKitError({
    cause: e,
    status: e._tag === "ResponseError" ? e.response.status : undefined,
  });
};

const shouldRetryPartyKitError = (e: PartyKitError): boolean => {
  const s = e.status;

  return s === undefined || s >= 500;
};

const shouldRetryPartyKitHttpFailure = (
  e: PartyKitError | RoomNotFoundError,
): boolean => {
  if (e._tag !== "PartyKitError") {
    return false;
  }

  return shouldRetryPartyKitError(e);
};

export const getRoomMetadata = (
  id: string,
): Effect.Effect<RoomMetadata, PartyKitError | RoomNotFoundError> => {
  return Config.string("PARTYKIT_URL").pipe(
    Effect.orDie,
    Effect.flatMap((base) => {
      return HttpClient.get(roomUrl(base, id)).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.mapError(mapHttpError),
        Effect.flatMap((res) => {
          return HttpClientResponse.schemaBodyJson(RawRoomResponseSchema)(
            res,
          ).pipe(Effect.orDie);
        }),
        Effect.map(normalizeRoomMetadata),
        Effect.retry({
          schedule: retryPolicy,
          while: shouldRetryPartyKitHttpFailure,
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};

export const getRoomName = (
  id: string,
): Effect.Effect<string, PartyKitError | RoomNotFoundError> => {
  return getRoomMetadata(id).pipe(Effect.map((m) => m.name));
};

export const createPartyKitRoom = (
  id: string,
  body: { hostSecret: string; joinCode: string; name: string },
): Effect.Effect<void, PartyKitError | RoomNotFoundError> => {
  return Config.string("PARTYKIT_URL").pipe(
    Effect.orDie,
    Effect.flatMap((base) => {
      return HttpClient.execute(
        HttpClientRequest.post(roomUrl(base, id)).pipe(
          HttpClientRequest.setHeader("Content-Type", "application/json"),
          HttpClientRequest.setHeader("X-Action", "create"),
          HttpClientRequest.bodyUnsafeJson({
            ...body,
            joinCode: body.joinCode.toLowerCase(),
          }),
        ),
      ).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.asVoid,
        Effect.mapError(mapHttpError),
        Effect.retry({
          schedule: retryPolicy,
          while: shouldRetryPartyKitHttpFailure,
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};

const registryUrl = (base: string): string => {
  return roomUrl(base, JOIN_REGISTRY_ROOM_ID);
};

export const registerJoinCode = (input: {
  joinCode: string;
  roomId: string;
}): Effect.Effect<void, PartyKitError> => {
  return Config.all({
    base: Config.string("PARTYKIT_URL"),
    secret: Config.string("ROOM_CRYPTO_SECRET"),
  }).pipe(
    Effect.orDie,
    Effect.flatMap(({ base, secret }) => {
      return HttpClient.execute(
        HttpClientRequest.post(registryUrl(base)).pipe(
          HttpClientRequest.setHeader("Authorization", `Bearer ${secret}`),
          HttpClientRequest.setHeader("Content-Type", "application/json"),
          HttpClientRequest.setHeader("X-Action", "register"),
          HttpClientRequest.bodyUnsafeJson({
            joinCode: input.joinCode.toLowerCase(),
            roomId: input.roomId,
          }),
        ),
      ).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.asVoid,
        Effect.mapError((e) => {
          if (e._tag === "ResponseError") {
            return new PartyKitError({
              cause: e,
              status: e.response.status,
            });
          }

          return new PartyKitError({ cause: e });
        }),
        Effect.retry({
          schedule: retryPolicy,
          while: shouldRetryPartyKitError,
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};

export const unregisterJoinCode = (
  joinCode: string,
): Effect.Effect<void, PartyKitError> => {
  return Config.all({
    base: Config.string("PARTYKIT_URL"),
    secret: Config.string("ROOM_CRYPTO_SECRET"),
  }).pipe(
    Effect.orDie,
    Effect.flatMap(({ base, secret }) => {
      return HttpClient.execute(
        HttpClientRequest.post(registryUrl(base)).pipe(
          HttpClientRequest.setHeader("Authorization", `Bearer ${secret}`),
          HttpClientRequest.setHeader("Content-Type", "application/json"),
          HttpClientRequest.setHeader("X-Action", "unregister"),
          HttpClientRequest.bodyUnsafeJson({
            joinCode: joinCode.toLowerCase(),
          }),
        ),
      ).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.asVoid,
        Effect.mapError((e) => {
          if (e._tag === "ResponseError") {
            return new PartyKitError({
              cause: e,
              status: e.response.status,
            });
          }

          return new PartyKitError({ cause: e });
        }),
        Effect.retry({
          schedule: retryPolicy,
          while: shouldRetryPartyKitError,
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};

const ResolveSchema = Schema.Struct({ roomId: Schema.String });

export const resolveJoinCode = (
  joinCode: string,
): Effect.Effect<string, JoinCodeNotFoundError | PartyKitError> => {
  return Config.string("PARTYKIT_URL").pipe(
    Effect.orDie,
    Effect.flatMap((base) => {
      return HttpClient.execute(
        HttpClientRequest.post(registryUrl(base)).pipe(
          HttpClientRequest.setHeader("Content-Type", "application/json"),
          HttpClientRequest.setHeader("X-Action", "resolve"),
          HttpClientRequest.bodyUnsafeJson({
            joinCode: joinCode.toLowerCase(),
          }),
        ),
      ).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.mapError(mapResolveError),
        Effect.flatMap((res) => {
          return HttpClientResponse.schemaBodyJson(ResolveSchema)(res).pipe(
            Effect.orDie,
          );
        }),
        Effect.map((b) => b.roomId),
        Effect.retry({
          schedule: retryPolicy,
          while: (e) => {
            return e._tag === "PartyKitError" && shouldRetryPartyKitError(e);
          },
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};

const RotateSchema = Schema.Struct({
  joinCode: Schema.String,
  joinCodeVersion: Schema.Number,
  previousJoinCode: Schema.String,
});

export const rotateJoinCodeOnRoom = (input: {
  hostSecret: string;
  newJoinCode: string;
  roomId: string;
}): Effect.Effect<
  Schema.Schema.Type<typeof RotateSchema>,
  PartyKitError | RoomNotFoundError
> => {
  return Config.string("PARTYKIT_URL").pipe(
    Effect.orDie,
    Effect.flatMap((base) => {
      return HttpClient.execute(
        HttpClientRequest.post(roomUrl(base, input.roomId)).pipe(
          HttpClientRequest.setHeader("Content-Type", "application/json"),
          HttpClientRequest.setHeader("X-Action", "rotate-join-code"),
          HttpClientRequest.bodyUnsafeJson({
            hostSecret: input.hostSecret,
            newJoinCode: input.newJoinCode.toLowerCase(),
          }),
        ),
      ).pipe(
        Effect.flatMap(HttpClientResponse.filterStatusOk),
        Effect.mapError(mapHttpError),
        Effect.flatMap((res) => {
          return HttpClientResponse.schemaBodyJson(RotateSchema)(res).pipe(
            Effect.orDie,
          );
        }),
        Effect.retry({
          schedule: retryPolicy,
          while: shouldRetryPartyKitHttpFailure,
        }),
        Effect.scoped,
      );
    }),
    Effect.provide(FetchHttpClient.layer),
  );
};
