"use server";

import { Effect } from "effect";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";

import { env } from "@/env";
import { setRoomSessionCookies } from "@/lib/cookies";
import { actionClient } from "@/lib/safe-action";
import { joinRoomSchema } from "@/lib/schemas";
import { resolveJoinCode } from "@/server/partykit-client";
import { mintRoomSessionToken } from "@/server/room-token";

export const joinRoom = actionClient
  .inputSchema(joinRoomSchema)
  .action(async ({ parsedInput: { displayName, joinCode } }) => {
    const roomId = await Effect.runPromise(
      resolveJoinCode(joinCode.trim().toLowerCase()).pipe(
        Effect.orDieWith(
          (e) => new Error(`Failed to resolve join code: ${e._tag}`),
        ),
      ),
    );

    const [cookieStore, sessionToken] = await Promise.all([
      cookies(),
      mintRoomSessionToken(roomId, env.ROOM_CRYPTO_SECRET),
    ]);

    setRoomSessionCookies(cookieStore, {
      displayName: displayName.trim(),
      roomId,
      sessionId: nanoid(16),
      sessionToken,
    });

    return { displayName: displayName.trim(), roomId };
  });
