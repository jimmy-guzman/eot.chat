import { css } from "styled-system/css";

interface Props {
  description?: string;
  domain: string;
  title: string;
  url: string;
}

export const LinkPreview = ({ description, domain, title, url }: Props) => {
  return (
    <a
      className={css({
        _hover: { boxShadow: "md" },
        borderRadius: "md",
        boxShadow: "sm",
        color: "ink",
        display: "block",
        padding: "4",
        textDecoration: "none",
      })}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <p
        className={css({
          color: "cobalt",
          fontSize: "0.75rem",
          fontWeight: "700",
          marginBottom: "1",
        })}
      >
        {domain}
      </p>
      <p
        className={css({
          fontSize: "1rem",
          fontWeight: "700",
          marginBottom: "1",
        })}
      >
        {title}
      </p>
      {description ? (
        <p
          className={css({ color: "ink", fontSize: "0.875rem", opacity: 0.8 })}
        >
          {description}
        </p>
      ) : null}
    </a>
  );
};
