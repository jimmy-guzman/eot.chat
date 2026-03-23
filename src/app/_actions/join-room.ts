"use server";

import { cookies } from "next/headers";

import { actionClient } from "@/lib/safe-action";
import { joinRoomSchema } from "@/lib/schemas";

export const joinRoom = actionClient
  .inputSchema(joinRoomSchema)
  .action(async ({ parsedInput: { displayName, roomId } }) => {
    const cookieStore = await cookies();

    cookieStore.set(`display-name-${roomId}`, displayName, {
      httpOnly: true,
      maxAge: 86_400,
      path: `/r/${roomId}`,
      sameSite: "lax",
    });

    return { displayName };
  });
