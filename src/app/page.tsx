import { css } from "styled-system/css";

import { CreateRoomForm } from "./_components/create-room-form";

export default function HomePage() {
  return (
    <main
      className={css({
        alignItems: "center",
        backgroundColor: "bg",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "6",
      })}
    >
      <div
        className={css({
          backgroundColor: "white",
          borderRadius: "lg",
          boxShadow: "lg",
          maxWidth: "400px",
          padding: "8",
          width: "100%",
        })}
      >
        <h1
          className={css({
            color: "ink",
            fontSize: "2rem",
            fontWeight: "800",
            letterSpacing: "-0.02em",
            marginBottom: "2",
          })}
        >
          Salita
        </h1>
        <p
          className={css({
            color: "ink",
            fontSize: "0.9rem",
            marginBottom: "6",
            opacity: 0.6,
          })}
        >
          Rooms that feel like home
        </p>

        <CreateRoomForm />
      </div>
    </main>
  );
}
