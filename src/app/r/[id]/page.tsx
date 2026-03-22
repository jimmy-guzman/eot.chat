import { redirect } from "next/navigation";

import { RoomClient } from "./_components/room-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: Props) {
  const { id } = await params;
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

  let name: string;

  try {
    const res = await fetch(`http://${host}/parties/main/${id}`, {
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

  return <RoomClient id={id} name={name} />;
}
