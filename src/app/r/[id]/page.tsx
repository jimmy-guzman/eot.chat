import type { Metadata } from "next";

import { Effect, Either } from "effect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getAppUrl } from "@/lib/app-url";
import { getRoomName } from "@/server/partykit-client";

import { RoomClient } from "./_components/room-client";

interface Props {
  params: Promise<{ id: string }>;
}

const fetchRoomName = cache(async (id: string): Promise<null | string> => {
  const result = await Effect.runPromise(Effect.either(getRoomName(id)));

  if (Either.isLeft(result)) {
    if (result.left._tag === "RoomNotFoundError") return null;

    throw result.left;
  }

  return result.right;
});

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

export default async function RoomPage({ params }: Props) {
  const { id } = await params;
  const name = await fetchRoomName(id);

  if (!name) redirect("/");

  const cookieStore = await cookies();
  const displayName = cookieStore.get(`display-name-${id}`)?.value;

  if (!displayName) {
    redirect(`/r/${id}/join`);
  }

  return (
    <RoomClient
      displayName={displayName}
      id={id}
      name={name}
      roomUrl={`${getAppUrl()}/r/${id}`}
    />
  );
}
