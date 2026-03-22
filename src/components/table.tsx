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
          <tr>
            {headers.map((header) => {
              return (
                <th
                  className={css({
                    fontSize: "0.75rem",
                    fontWeight: "700",
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
                        fontSize: "0.875rem",
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
            fontSize: "0.75rem",
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
