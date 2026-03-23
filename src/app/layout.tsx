import "./globals.css";

import type { Metadata } from "next";

import { IBM_Plex_Mono } from "next/font/google";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600", "700"],
});

export const metadata = {
  description: "End of transmission.",
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
        <meta content="dark" name="color-scheme" />
      </head>
      <body>{children}</body>
    </html>
  );
}
