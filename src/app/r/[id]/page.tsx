import type { Metadata } from "next";

import { Effect, Either } from "effect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { RoomMetadata } from "@/server/partykit-client";

import { env } from "@/env";
import { getAppUrl } from "@/lib/app-url";
import { getRoomMetadata, getRoomName } from "@/server/partykit-client";
import { verifyRoomSessionToken } from "@/server/room-token";

import { RoomClient } from "./_components/room-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const pickCodeQuery = (
  sp: Record<string, string | string[] | undefined>,
): string | undefined => {
  const raw = sp.code;

  if (typeof raw === "string") {
    const trimmed = raw.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(raw) && typeof raw[0] === "string") {
    const trimmed = raw[0].trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
};

const fetchRoomName = cache(async (id: string): Promise<null | string> => {
  const result = await Effect.runPromise(Effect.either(getRoomName(id)));

  if (Either.isLeft(result)) {
    if (result.left._tag === "RoomNotFoundError") return null;

    throw result.left;
  }

  return result.right;
});

const fetchRoomMetadata = cache(
  async (id: string): Promise<null | RoomMetadata> => {
    const result = await Effect.runPromise(Effect.either(getRoomMetadata(id)));

    if (Either.isLeft(result)) {
      if (result.left._tag === "RoomNotFoundError") return null;

      throw result.left;
    }

    return result.right;
  },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const name = await fetchRoomName(id);

  if (!name) return {};

  return {
    description: `Join the room and start chatting.`,
    openGraph: {
      description: `Join the room and start chatting.`,
      title: name,
      type: "website",
    },
    title: name,
    twitter: {
      card: "summary_large_image",
      description: `Join the room and start chatting.`,
      title: name,
    },
  };
}

export default async function RoomPage({ params, searchParams }: Props) {
  const { id } = await params;
  const name = await fetchRoomName(id);

  if (!name) redirect("/");

  const query = pickCodeQuery(await searchParams);
  const joinRedirect = query
    ? `/join?code=${encodeURIComponent(query)}`
    : "/join";

  const cookieStore = await cookies();
  const displayName = cookieStore.get(`display-name-${id}`)?.value;
  const hostSecret = cookieStore.get(`room-host-${id}`)?.value;
  const sessionCookie = cookieStore.get(`room-session-${id}`)?.value;
  const sessionId = cookieStore.get(`room-session-id-${id}`)?.value;

  const meta = await fetchRoomMetadata(id);

  if (!meta) redirect("/");

  if (!sessionCookie || !sessionId) {
    redirect(joinRedirect);
  }

  const verified = await verifyRoomSessionToken(
    sessionCookie,
    env.ROOM_CRYPTO_SECRET,
  );

  if (verified?.roomId !== id) {
    redirect(joinRedirect);
  }

  if (!displayName) {
    redirect(`/r/${id}/join`);
  }

  const baseRoomUrl = `${getAppUrl()}/r/${id}`;
  const roomUrl = `${baseRoomUrl}?code=${encodeURIComponent(meta.joinCode)}`;

  return (
    <RoomClient
      displayName={displayName}
      id={id}
      isRoomHost={Boolean(hostSecret)}
      joinCode={meta.joinCode}
      name={name}
      roomUrl={roomUrl}
      sessionId={sessionId}
      sessionToken={sessionCookie}
    />
  );
}
