import { redirect } from "next/navigation";

import { env } from "@/env";

import { JoinRoomClient } from "./_components/join-room-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { id } = await params;

  try {
    const res = await fetch(`${env.PARTYKIT_URL}/parties/main/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      redirect("/");
    }
  } catch {
    redirect("/");
  }

  return <JoinRoomClient roomId={id} />;
}
