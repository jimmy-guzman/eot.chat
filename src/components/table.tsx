import { css } from "styled-system/css";

interface Props {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export const Table = ({ caption, headers, rows }: Props) => {
  return (
    <div
      className={css({
        borderRadius: "md",
        boxShadow: "sm",
        overflowX: "auto",
      })}
    >
      <table className={css({ borderCollapse: "collapse", width: "100%" })}>
        <thead>
          <tr className={css({ backgroundColor: "sage" })}>
            {headers.map((header) => {
              return (
                <th
                  className={css({
                    color: "surface",
                    fontSize: "xs",
                    fontWeight: "bold",
                    padding: "3",
                    textAlign: "left",
                  })}
                  key={header}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            return (
              <tr key={row.join("|")}>
                {row.map((cell) => {
                  return (
                    <td
                      className={css({
                        fontSize: "sm",
                        padding: "3",
                      })}
                      key={cell}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {caption ? (
        <p
          className={css({
            fontSize: "xs",
            opacity: 0.7,
            padding: "2",
            textAlign: "center",
          })}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
};
