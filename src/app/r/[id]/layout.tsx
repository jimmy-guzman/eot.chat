import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  if (sessionCookie && sessionId) {
    const verified = await verifyRoomSessionToken(
      sessionCookie,
      env.ROOM_CRYPTO_SECRET,
    );

    if (verified?.roomId === id) {
      return <>{room}</>;
    }
  }

  redirect(`/join?code=${encodeURIComponent(meta.joinCode)}`);
}
