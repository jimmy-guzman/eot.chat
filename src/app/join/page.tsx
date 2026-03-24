import type { Metadata } from "next";

import Link from "next/link";
import { css, cx } from "styled-system/css";
import { card, link } from "styled-system/recipes";

import { JoinRoomForm } from "@/app/_components/join-room-form";
import { SiteFooter } from "@/app/_components/site-footer";

import { loadJoinPageSearchParams } from "./search-params";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Join a room",
};

export default async function JoinRoomPage({ searchParams }: Props) {
  const params = await loadJoinPageSearchParams(searchParams);
  const { code } = params;

  return (
    <>
      <main
        className={css({
          alignItems: "center",
          backgroundColor: "base-100",
          display: "flex",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: "6",
        })}
      >
        <div
          className={cx(
            card(),
            css({ maxWidth: "card", padding: "8", width: "100%" }),
          )}
        >
          <h1
            className={css({
              color: "accent",
              fontSize: "2xl",
              fontWeight: "extrabold",
              letterSpacing: "display",
              marginBottom: "2",
            })}
          >
            Join Room
          </h1>
          <p
            className={css({
              color: "base-content",
              fontSize: "sm",
              lineHeight: "body",
              marginBottom: "6",
              opacity: 0.6,
            })}
          >
            Enter a room code to join.
          </p>
          <JoinRoomForm initialJoinCode={code} />
          <p
            className={css({
              color: "base-content-muted",
              fontSize: "sm",
              marginTop: "6",
              textAlign: "center",
            })}
          >
            Need a new room?{" "}
            <Link
              className={link()}
              href="/"
            >
              Create one
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
