import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default async function Image() {
  const font = await readFile(
    join(process.cwd(), "public/fonts/IBMPlexMono-Bold.ttf"),
  );

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#0D0E10",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <span
        style={{
          color: "#D44E1A",
          fontFamily: "IBM Plex Mono",
          fontSize: 120,
          fontWeight: 700,
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}
      >
        EOT
      </span>
      <span
        style={{
          color: "#E0D8C0",
          fontFamily: "IBM Plex Mono",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "0.04em",
          marginTop: 24,
          opacity: 0.5,
        }}
      >
        End of transmission.
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
