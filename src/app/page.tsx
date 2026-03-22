import { css } from "styled-system/css";

import { PlantMotif } from "@/components/illustrations";

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
          backgroundColor: "surface",
          borderRadius: "lg",
          boxShadow: "lg",
          maxWidth: "card",
          overflow: "visible",
          padding: "8",
          position: "relative",
          width: "100%",
        })}
      >
        <PlantMotif
          className={css({
            pointerEvents: "none",
            position: "absolute",
            right: "-16px",
            top: "-32px",
          })}
        />
        <h1
          className={css({
            color: "cobalt",
            fontSize: "2xl",
            fontWeight: "extrabold",
            letterSpacing: "display",
            marginBottom: "2",
          })}
        >
          Salita
        </h1>
        <p
          className={css({
            color: "ink",
            fontSize: "sm",
            lineHeight: "body",
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
