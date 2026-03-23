import type { Metadata } from "next";

import { redirect } from "next/navigation";
import { css, cx } from "styled-system/css";
import { card } from "styled-system/recipes";

import { env } from "@/env";

import { DisplayNameForm } from "./_components/display-name-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  void id;

  return {
    title: "Join the room",
  };
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

  return (
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
          Join the room
        </h1>
        <p
          className={css({
            color: "base-content-muted",
            fontSize: "sm",
            lineHeight: "body",
            marginBottom: "6",
          })}
        >
          What should we call you?
        </p>
        <DisplayNameForm roomId={id} />
      </div>
    </main>
  );
}
