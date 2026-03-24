import type { Metadata } from "next";

import { Effect, Either } from "effect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { css, cx } from "styled-system/css";
import { card } from "styled-system/recipes";

import { env } from "@/env";
import { getRoomName } from "@/server/partykit-client";
import { verifyRoomSessionToken } from "@/server/room-token";

import { DisplayNameForm } from "./_components/display-name-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  void id;

  return {
    title: "Join the room",
  };
}

export default async function JoinPage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const displayNameCookie = cookieStore.get(`display-name-${id}`)?.value;
  const sessionCookie = cookieStore.get(`room-session-${id}`)?.value;

  if (displayNameCookie && sessionCookie) {
    const verified = await verifyRoomSessionToken(
      sessionCookie,
      env.ROOM_CRYPTO_SECRET,
    );

    if (verified?.roomId === id) {
      redirect(`/r/${id}`);
    }
  }

  const result = await Effect.runPromise(Effect.either(getRoomName(id)));

  if (Either.isLeft(result)) {
    if (result.left._tag === "RoomNotFoundError") {
      redirect("/");
    }

    throw result.left;
  }

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
          Join the room
        </h1>
        <p
          className={css({
            color: "base-content-muted",
            fontSize: "sm",
            lineHeight: "body",
            marginBottom: "6",
          })}
        >
          What should we call you?
        </p>
        <DisplayNameForm roomId={id} />
      </div>
    </main>
  );
}
