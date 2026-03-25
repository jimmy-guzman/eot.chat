"use server";

import { Effect, Schedule } from "effect";
import { cookies } from "next/headers";

import { generateJoinCode } from "@/lib/join-code";
import { actionClient } from "@/lib/safe-action";
import { rotateJoinCodeSchema } from "@/lib/schemas";
import {
  registerJoinCode,
  rotateJoinCodeOnRoom,
  unregisterJoinCode,
} from "@/server/partykit-client";

const conflictRetry = Schedule.recurs(7).pipe(
  Schedule.whileInput((e: { _tag: string; status?: number }) => {
    return e._tag === "PartyKitError" && e.status === 409;
  }),
);

const reserveNewCode = (roomId: string) => {
  return Effect.gen(function* () {
    const newJoinCode = generateJoinCode();

    yield* registerJoinCode({ joinCode: newJoinCode, roomId });

    return newJoinCode;
  });
};

const rotateCode = (roomId: string, hostSecret: string) => {
  return Effect.gen(function* () {
    const newJoinCode = yield* reserveNewCode(roomId).pipe(
      Effect.retry(conflictRetry),
    );

    const { previousJoinCode } = yield* rotateJoinCodeOnRoom({
      hostSecret,
      newJoinCode,
      roomId,
    });

    yield* unregisterJoinCode(previousJoinCode);

    return newJoinCode;
  });
};

export const rotateJoinCode = actionClient
  .inputSchema(rotateJoinCodeSchema)
  .action(async ({ parsedInput: { roomId } }) => {
    const cookieStore = await cookies();
    const hostSecret = cookieStore.get(`room-host-${roomId}`)?.value;

    if (!hostSecret) {
      throw new Error("Not authorized");
    }

    const joinCode = await Effect.runPromise(rotateCode(roomId, hostSecret));

    return { joinCode };
  });
