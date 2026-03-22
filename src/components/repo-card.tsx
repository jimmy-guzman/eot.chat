import { css } from "styled-system/css";

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
          fontSize: "0.875rem",
          fontWeight: "700",
          marginBottom: "1",
        })}
      >
        {owner}/{repo}
      </p>
      {description ? (
        <p
          className={css({
            fontSize: "0.875rem",
            marginBottom: "2",
            opacity: 0.8,
          })}
        >
          {description}
        </p>
      ) : null}
      <div className={css({ display: "flex", gap: "3" })}>
        {language ? (
          <span className={css({ fontSize: "0.75rem" })}>{language}</span>
        ) : null}
        {stars === undefined ? null : (
          <span className={css({ fontSize: "0.75rem" })}>★ {stars}</span>
        )}
      </div>
    </a>
  );
};
