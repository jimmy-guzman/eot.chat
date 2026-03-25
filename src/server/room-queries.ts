import { Effect, Either } from "effect";
import { cache } from "react";

import type { RoomMetadata } from "@/server/partykit-client";

import { getRoomMetadata, getRoomName } from "@/server/partykit-client";

export type { RoomMetadata } from "@/server/partykit-client";

export const fetchRoomMetadata = cache(
  async (id: string): Promise<null | RoomMetadata> => {
    const result = await Effect.runPromise(Effect.either(getRoomMetadata(id)));

    if (Either.isLeft(result)) {
      if (result.left._tag === "RoomNotFoundError") return null;

      throw result.left;
    }

    return result.right;
  },
);

export const fetchRoomName = cache(
  async (id: string): Promise<null | string> => {
    const result = await Effect.runPromise(Effect.either(getRoomName(id)));

    if (Either.isLeft(result)) {
      if (result.left._tag === "RoomNotFoundError") return null;

      throw result.left;
    }

    return result.right;
  },
);
