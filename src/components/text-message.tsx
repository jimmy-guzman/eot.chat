import { css } from "styled-system/css";

interface Props {
  body: string;
}

export const TextMessage = ({ body }: Props) => {
  return (
    <p
      className={css({
        color: "ink",
        fontFamily: "body",
        fontSize: "1rem",
        lineHeight: "1.65",
      })}
    >
      {body}
    </p>
  );
};
