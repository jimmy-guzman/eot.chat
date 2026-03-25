import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { css, cx } from "styled-system/css";
import { card, link } from "styled-system/recipes";

import { env } from "@/env";
import { fetchRoomMetadata, fetchRoomName } from "@/server/room-queries";
import { verifyRoomSessionToken } from "@/server/room-token";

interface Props {
  params: Promise<{ id: string }>;
  room: React.ReactNode;
}

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

  const joinHref = `/join?code=${encodeURIComponent(meta.joinCode)}`;

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
