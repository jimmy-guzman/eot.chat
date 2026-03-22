"use client";

import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { css } from "styled-system/css";

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
          className={css({
            color: "ink",
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "700",
            marginBottom: "2",
          })}
          htmlFor="roomName"
        >
          Room name
        </label>
        <input
          className={css({
            _focus: { borderColor: "cobalt" },
            backgroundColor: "bg",
            border: "2px solid token(colors.soft-pink)",
            borderRadius: "sm",
            color: "ink",
            fontSize: "1rem",
            outline: "none",
            padding: "3",
            width: "100%",
          })}
          id="roomName"
          name="roomName"
          placeholder="e.g. Friday Standup"
          required
          type="text"
        />
      </div>

      <div className={css({ marginBottom: "6" })}>
        <label
          className={css({
            color: "ink",
            display: "block",
            fontSize: "0.875rem",
            fontWeight: "700",
            marginBottom: "2",
          })}
          htmlFor="displayName"
        >
          Your name
        </label>
        <input
          className={css({
            _focus: { borderColor: "cobalt" },
            backgroundColor: "bg",
            border: "2px solid token(colors.soft-pink)",
            borderRadius: "sm",
            color: "ink",
            fontSize: "1rem",
            outline: "none",
            padding: "3",
            width: "100%",
          })}
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
            fontSize: "0.875rem",
            marginBottom: "4",
          })}
        >
          {error}
        </p>
      ) : null}

      <button
        className={css({
          _disabled: { cursor: "not-allowed", opacity: 0.5 },
          _hover: { backgroundColor: "cobalt", boxShadow: "md" },
          backgroundColor: "cobalt",
          border: "none",
          borderRadius: "full",
          color: "white",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: "700",
          padding: "3 6",
          width: "100%",
        })}
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating…" : "Create a Room"}
      </button>
    </form>
  );
};
