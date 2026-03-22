import { css } from "styled-system/css";

interface Props {
  options: string[];
  question: string;
}

export const Poll = ({ options, question }: Props) => {
  return (
    <div
      className={css({
        borderRadius: "md",
        boxShadow: "sm",
        padding: "4",
      })}
    >
      <p
        className={css({
          fontSize: "1rem",
          fontWeight: "700",
          marginBottom: "3",
        })}
      >
        {question}
      </p>
      <ul
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "2",
          listStyle: "none",
          padding: "0",
        })}
      >
        {options.map((option) => {
          return (
            <li
              className={css({
                _hover: { opacity: 0.85 },
                borderRadius: "sm",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "700",
                padding: "2",
              })}
              key={option}
            >
              {option}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
