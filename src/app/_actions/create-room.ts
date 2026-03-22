"use server";

import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as v from "valibot";

import { actionClient } from "@/lib/safe-action";

const schema = v.object({
  displayName: v.pipe(v.string(), v.trim(), v.minLength(1, "Name is required")),
  roomName: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Room name is required"),
  ),
});

export const createRoom = actionClient
  .inputSchema(schema)
  .action(async ({ parsedInput: { displayName, roomName } }) => {
    const id = nanoid();
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

    const res = await fetch(`http://${host}/parties/main/${id}`, {
      body: JSON.stringify({ name: roomName }),
      headers: {
        "Content-Type": "application/json",
        "X-Action": "create",
      },
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Failed to create room (${res.status})`);
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
