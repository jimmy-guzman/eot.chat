import type { Metadata } from "next";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { env } from "@/env";
import { getAppUrl } from "@/lib/app-url";

import { RoomClient } from "./_components/room-client";

interface Props {
  params: Promise<{ id: string }>;
}

const getRoomName = cache(async (id: string): Promise<null | string> => {
  try {
    const res = await fetch(`${env.PARTYKIT_URL}/parties/main/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { name?: string };

    return data.name ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const name = await getRoomName(id);

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
  const name = await getRoomName(id);

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
