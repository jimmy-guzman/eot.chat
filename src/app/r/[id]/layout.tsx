import { Effect, Either } from "effect";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cache } from "react";
import { css, cx } from "styled-system/css";
import { card, link } from "styled-system/recipes";

import { env } from "@/env";
import { getRoomMetadata, getRoomName } from "@/server/partykit-client";
import { verifyRoomSessionToken } from "@/server/room-token";

interface Props {
  params: Promise<{ id: string }>;
  room: React.ReactNode;
}

const fetchRoomName = cache(async (id: string): Promise<null | string> => {
  const result = await Effect.runPromise(Effect.either(getRoomName(id)));

  if (Either.isLeft(result)) {
    if (result.left._tag === "RoomNotFoundError") return null;

    throw result.left;
  }

  return result.right;
});

const fetchRoomMetadata = cache(async (id: string) => {
  const result = await Effect.runPromise(Effect.either(getRoomMetadata(id)));

  if (Either.isLeft(result)) {
    if (result.left._tag === "RoomNotFoundError") return null;

    throw result.left;
  }

  return result.right;
});

const getIncomingCode = async (): Promise<null | string> => {
  const headerStore = await headers();
  const referer = headerStore.get("referer");
  const nextUrl = headerStore.get("x-url") ?? headerStore.get("next-url");

  for (const raw of [nextUrl, referer]) {
    if (!raw) continue;

    try {
      const code = new URL(raw).searchParams.get("code");

      if (code) return code;
    } catch {
      continue;
    }
  }

  return null;
};

export default async function RoomLayout({ params, room }: Props) {
  const { id } = await params;

  const name = await fetchRoomName(id);

  if (!name) redirect("/");

  const meta = await fetchRoomMetadata(id);

  if (!meta?.joinCode) redirect("/");

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`room-session-${id}`)?.value;
  const sessionId = cookieStore.get(`room-session-id-${id}`)?.value;

  let isAuthenticated = false;

  if (sessionCookie && sessionId) {
    const verified = await verifyRoomSessionToken(
      sessionCookie,
      env.ROOM_CRYPTO_SECRET,
    );

    isAuthenticated = verified?.roomId === id;
  }

  if (isAuthenticated) {
    return <>{room}</>;
  }

  const incomingCode = await getIncomingCode();
  const joinHref = incomingCode
    ? `/join?code=${encodeURIComponent(incomingCode)}`
    : "/join";

  return (
    <main
      className={css({
        alignItems: "center",
        backgroundColor: "base-100",
        display: "flex",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "6",
      })}
    >
      <div
        className={cx(
          card(),
          css({ maxWidth: "card", padding: "8", width: "100%" }),
        )}
      >
        <h1
          className={css({
            color: "accent",
            fontSize: "2xl",
            fontWeight: "extrabold",
            letterSpacing: "display",
            marginBottom: "2",
          })}
        >
          {name}
        </h1>
        <p
          className={css({
            color: "base-content-muted",
            fontSize: "sm",
            lineHeight: "body",
            marginBottom: "6",
          })}
        >
          You need a join code to enter this room.
        </p>
        <Link className={link()} href={joinHref}>
          Join room
        </Link>
      </div>
    </main>
  );
}
