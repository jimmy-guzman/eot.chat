"use server";

import { cookies } from "next/headers";

import { actionClient } from "@/lib/safe-action";
import { leaveRoomSchema } from "@/lib/schemas";

export const leaveRoom = actionClient
  .inputSchema(leaveRoomSchema)
  .action(async ({ parsedInput: { roomId } }) => {
    const cookieStore = await cookies();

    cookieStore.delete({
      name: `display-name-${roomId}`,
      path: `/r/${roomId}`,
    });
  });
