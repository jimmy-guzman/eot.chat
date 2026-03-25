import type { Metadata } from "next";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { userAgentFromString } from "next/server";

import { env } from "@/env";
import { getAppUrl } from "@/lib/app-url";
import { fetchRoomMetadata, fetchRoomName } from "@/server/room-queries";
import { verifyRoomSessionToken } from "@/server/room-token";

interface Props {
  params: Promise<{ id: string }>;
  room: React.ReactNode;
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

export default async function RoomLayout({ params, room }: Props) {
  const { id } = await params;

  const name = await fetchRoomName(id);

  if (!name) redirect("/");

  const meta = await fetchRoomMetadata(id);

  if (!meta?.joinCode) redirect("/");

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`room-session-${id}`)?.value;
  const sessionId = cookieStore.get(`room-session-id-${id}`)?.value;

  if (sessionCookie && sessionId) {
    const verified = await verifyRoomSessionToken(
      sessionCookie,
      env.ROOM_CRYPTO_SECRET,
    );

    if (verified?.roomId === id) {
      return <>{room}</>;
    }
  }

  const headerStore = await headers();
  const { isBot } = userAgentFromString(headerStore.get("user-agent") ?? "");

  if (isBot) {
    return null;
  }

  redirect(`/join?code=${encodeURIComponent(meta.joinCode)}`);
}
