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
          fontSize: "base",
          fontWeight: "bold",
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
                backgroundColor: "orange",
                borderRadius: "sm",
                cursor: "pointer",
                fontSize: "sm",
                fontWeight: "bold",
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
