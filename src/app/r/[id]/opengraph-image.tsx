import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Effect, Either } from "effect";
import { ImageResponse } from "next/og";

import { getRoomName } from "@/lib/partykit-client";

export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;

  const font = await readFile(
    join(process.cwd(), "public/fonts/IBMPlexMono-Bold.ttf"),
  );

  const result = await Effect.runPromise(Effect.either(getRoomName(id)));
  const roomName = Either.isRight(result) ? result.right : null;

  return new ImageResponse(
    <div
      style={{
        backgroundColor: "#0D0E10",
        borderBottom: "4px solid #2C1E14",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "64px 80px",
        width: "100%",
      }}
    >
      <span
        style={{
          color: "#D44E1A",
          fontFamily: "IBM Plex Mono",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.04em",
        }}
      >
        EOT
      </span>
      <span
        style={{
          color: "#E0D8C0",
          fontFamily: "IBM Plex Mono",
          fontSize: roomName && roomName.length > 24 ? 56 : 80,
          fontWeight: 700,
          letterSpacing: "0.04em",
          lineHeight: 1.1,
          overflow: "hidden",
        }}
      >
        {roomName ?? "EOT"}
      </span>
    </div>,
    {
      ...size,
      fonts: [
        {
          data: font,
          name: "IBM Plex Mono",
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
