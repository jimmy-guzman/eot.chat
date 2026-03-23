import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { getAppUrl } from "@/lib/app-url";

import { RoomClient } from "./_components/room-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: Props) {
  const { id } = await params;

  let name: string;

  try {
    const res = await fetch(`${env.PARTYKIT_URL}/parties/main/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      redirect("/");
    }

    const data = (await res.json()) as { name?: string };

    if (!data.name) {
      redirect("/");
    }

    name = data.name;
  } catch {
    redirect("/");
  }

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
