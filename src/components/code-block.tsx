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
            backgroundColor: "chartreuse",
            display: "flex",
            fontSize: "xs",
            fontWeight: "bold",
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
          fontSize: "sm",
          lineHeight: "code",
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
