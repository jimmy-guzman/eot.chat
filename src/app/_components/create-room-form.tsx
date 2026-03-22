"use client";

import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { css, cx } from "styled-system/css";
import { button, input, label } from "styled-system/recipes";

export const CreateRoomForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<null | string>(null);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const roomName = (form.elements.namedItem("roomName") as HTMLInputElement)
      .value;
    const displayName = (
      form.elements.namedItem("displayName") as HTMLInputElement
    ).value;

    startTransition(async () => {
      const id = nanoid();
      const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;

      try {
        const res = await fetch(`http://${host}/parties/main/${id}`, {
          body: JSON.stringify({ name: roomName }),
          headers: {
            "Content-Type": "application/json",
            "X-Action": "create",
          },
          method: "POST",
        });

        if (!res.ok) {
          throw new Error(`Failed to create room (${res.status})`);
        }

        sessionStorage.setItem(`room:${id}:displayName`, displayName);
        router.push(`/r/${id}`);
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : "Something went wrong",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={css({ marginBottom: "4" })}>
        <label
          className={cx(label(), css({ marginBottom: "2" }))}
          htmlFor="roomName"
        >
          Room name
        </label>
        <input
          className={input()}
          id="roomName"
          name="roomName"
          placeholder="e.g. Friday Standup"
          required
          type="text"
        />
      </div>

      <div className={css({ marginBottom: "6" })}>
        <label
          className={cx(label(), css({ marginBottom: "2" }))}
          htmlFor="displayName"
        >
          Your name
        </label>
        <input
          className={input()}
          id="displayName"
          name="displayName"
          placeholder="e.g. Ada"
          required
          type="text"
        />
      </div>

      {error ? (
        <p
          className={css({
            color: "red",
            fontSize: "sm",
            marginBottom: "4",
          })}
        >
          {error}
        </p>
      ) : null}

      <button
        className={cx(button({ variant: "primary" }), css({ width: "100%" }))}
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating…" : "Create a Room"}
      </button>
    </form>
  );
};
