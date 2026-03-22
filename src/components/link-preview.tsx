import { css, cx } from "styled-system/css";
import { card } from "styled-system/recipes";

interface Props {
  description?: string;
  domain: string;
  title: string;
  url: string;
}

export const LinkPreview = ({ description, domain, title, url }: Props) => {
  return (
    <a
      className={cx(
        card({ variant: "default" }),
        css({
          _hover: { boxShadow: "md" },
          color: "ink",
          display: "block",
          padding: "4",
          textDecoration: "none",
        }),
      )}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <p
        className={css({
          color: "cobalt",
          fontSize: "xs",
          fontWeight: "bold",
          marginBottom: "1",
        })}
      >
        {domain}
      </p>
      <p
        className={css({
          fontSize: "base",
          fontWeight: "bold",
          marginBottom: "1",
        })}
      >
        {title}
      </p>
      {description ? (
        <p
          className={css({
            color: "ink",
            fontSize: "sm",
            lineHeight: "body",
            opacity: 0.8,
          })}
        >
          {description}
        </p>
      ) : null}
    </a>
  );
};
