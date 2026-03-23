"use server";

import { Effect, Either } from "effect";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { actionClient } from "@/lib/safe-action";
import { createRoomSchema } from "@/lib/schemas";
import { createPartyKitRoom } from "@/server/partykit-client";

export const createRoom = actionClient
  .inputSchema(createRoomSchema)
  .action(async ({ parsedInput: { displayName, roomName } }) => {
    const id = nanoid();

    const result = await Effect.runPromise(
      Effect.either(createPartyKitRoom(id, roomName)),
    );

    if (Either.isLeft(result)) {
      throw new Error(`Failed to create room: ${result.left._tag}`);
    }

    const cookieStore = await cookies();

    cookieStore.set(`display-name-${id}`, displayName, {
      httpOnly: true,
      maxAge: 86_400,
      path: `/r/${id}`,
      sameSite: "lax",
    });

    redirect(`/r/${id}`);
  });
