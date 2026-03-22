import { css } from "styled-system/css";

interface Props {
  code: string;
  filename?: string;
  language?: string;
}

export const CodeBlock = ({ code, filename, language }: Props) => {
  return (
    <div
      className={css({
        borderRadius: "md",
        overflow: "hidden",
      })}
    >
      {(filename ?? language) ? (
        <div
          className={css({
            display: "flex",
            fontSize: "0.75rem",
            fontWeight: "700",
            gap: "2",
            padding: "2",
          })}
        >
          {filename ? <span>{filename}</span> : null}
          {language ? (
            <span className={css({ opacity: 0.6 })}>{language}</span>
          ) : null}
        </div>
      ) : null}
      <pre
        className={css({
          fontSize: "0.875rem",
          lineHeight: "1.6",
          overflowX: "auto",
          padding: "4",
          whiteSpace: "pre",
        })}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};
