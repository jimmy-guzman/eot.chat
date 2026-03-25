import { css } from "styled-system/css";
import { link } from "styled-system/recipes";

export const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={css({
        borderTop: "1px solid token(colors.base-300)",
        color: "base-content",
        fontFamily: "var(--font-mono)",
        fontSize: "xs",
        letterSpacing: "tight",
        opacity: 0.5,
        padding: "4 6",
      })}
    >
      <p
        className={css({
          marginBottom: "1",
        })}
      >
        End of transmission.
      </p>
      <p>
        {`© ${year.toString()} `}
        <a
          className={link({ tone: "muted" })}
          href="https://www.jimmy.codes/"
          rel="noopener noreferrer"
          target="_blank"
        >
          jimmy guzman moreno
        </a>
      </p>
    </footer>
  );
};
