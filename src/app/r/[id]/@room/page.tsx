import type { Metadata } from "next";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { getAppUrl } from "@/lib/app-url";
import { fetchRoomMetadata, fetchRoomName } from "@/server/room-queries";
import { verifyRoomSessionToken } from "@/server/room-token";

import { RoomClient } from "../_components/room-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const name = await fetchRoomName(id);

  if (!name) return {};

  const imageUrl = `${getAppUrl()}/r/${id}/opengraph-image`;

  return {
    description: `Join the room and start chatting.`,
    openGraph: {
      description: `Join the room and start chatting.`,
      images: [imageUrl],
      title: name,
      type: "website",
    },
    title: name,
    twitter: {
      card: "summary_large_image",
      description: `Join the room and start chatting.`,
      images: [imageUrl],
      title: name,
    },
  };
}

export default async function RoomPage({ params }: Props) {
  const { id } = await params;
  const name = await fetchRoomName(id);

  if (!name) redirect("/");

  const cookieStore = await cookies();
  const displayName = cookieStore.get(`display-name-${id}`)?.value;
  const hostSecret = cookieStore.get(`room-host-${id}`)?.value;
  const sessionCookie = cookieStore.get(`room-session-${id}`)?.value;
  const sessionId = cookieStore.get(`room-session-id-${id}`)?.value;

  const meta = await fetchRoomMetadata(id);

  if (!meta?.joinCode) redirect("/");

  if (!sessionCookie || !sessionId) {
    redirect("/");
  }

  const verified = await verifyRoomSessionToken(
    sessionCookie,
    env.ROOM_CRYPTO_SECRET,
  );

  if (verified?.roomId !== id) {
    redirect("/");
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
