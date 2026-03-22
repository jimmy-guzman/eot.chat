"use server";

import { cookies } from "next/headers";
import * as v from "valibot";

import { actionClient } from "@/lib/safe-action";

const schema = v.object({
  displayName: v.pipe(v.string(), v.trim(), v.minLength(1, "Name is required")),
  roomId: v.pipe(v.string(), v.minLength(1)),
});

export const joinRoom = actionClient
  .inputSchema(schema)
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
