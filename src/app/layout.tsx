import "./globals.css";

import type { Metadata } from "next";

import { M_PLUS_Rounded_1c } from "next/font/google";

const mplus = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  variable: "--font-mplus",
  weight: ["400", "700", "800"],
});

export const metadata = {
  description: "Rooms that feel like home",
  title: "Salita",
} satisfies Metadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={mplus.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
