import { css } from "styled-system/css";

interface Props {
  alt?: string;
  caption?: string;
  url: string;
}

export const ImageCard = ({ alt, caption, url }: Props) => {
  return (
    <figure
      className={css({
        borderRadius: "md",
        boxShadow: "sm",
        margin: "0",
        overflow: "hidden",
      })}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external image URLs are user-provided, next/image requires known domains */}
      <img
        alt={alt ?? ""}
        className={css({ display: "block", maxWidth: "100%", width: "100%" })}
        src={url}
      />
      {caption ? (
        <figcaption
          className={css({
            fontSize: "0.75rem",
            opacity: 0.7,
            padding: "2",
            textAlign: "center",
          })}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
};
