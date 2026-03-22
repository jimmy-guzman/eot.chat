import { css, cx } from "styled-system/css";
import { card } from "styled-system/recipes";

import { CreateRoomForm } from "./_components/create-room-form";

export default function HomePage() {
  return (
    <main
      className={css({
        alignItems: "center",
        backgroundColor: "base-100",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
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
          EOT
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
          End of transmission.
        </p>
        <CreateRoomForm />
      </div>
    </main>
  );
}
