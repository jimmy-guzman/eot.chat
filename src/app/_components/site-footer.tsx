import { css } from "styled-system/css";

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
          className={css({
            _hover: { opacity: 1 },
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            transition: "opacity 80ms ease-out",
          })}
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
