import "./globals.css";

import type { Metadata } from "next";

import { IBM_Plex_Mono } from "next/font/google";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600", "700"],
});

export const metadata = {
  description: "Rooms that feel like home",
  title: "EOT",
} satisfies Metadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={ibmPlexMono.variable} lang="en">
      <head>
        <meta content="dark light" name="color-scheme" />
      </head>
      <body>{children}</body>
    </html>
  );
}
