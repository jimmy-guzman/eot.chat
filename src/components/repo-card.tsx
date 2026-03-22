import { css, cx } from "styled-system/css";
import { card } from "styled-system/recipes";

interface Props {
  description?: string;
  language?: string;
  owner: string;
  repo: string;
  stars?: number;
  url: string;
}

export const RepoCard = ({
  description,
  language,
  owner,
  repo,
  stars,
  url,
}: Props) => {
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
          fontSize: "sm",
          fontWeight: "bold",
          marginBottom: "1",
        })}
      >
        {owner}/{repo}
      </p>
      {description ? (
        <p
          className={css({
            fontSize: "sm",
            marginBottom: "2",
            opacity: 0.8,
          })}
        >
          {description}
        </p>
      ) : null}
      <div className={css({ display: "flex", gap: "3" })}>
        {language ? (
          <span className={css({ fontSize: "xs" })}>{language}</span>
        ) : null}
        {stars === undefined ? null : (
          <span className={css({ fontSize: "xs" })}>★ {stars}</span>
        )}
      </div>
    </a>
  );
};
