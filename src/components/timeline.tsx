import { css } from "styled-system/css";

interface TimelineItem {
  date?: string;
  description?: string;
  status?: "completed" | "current" | "upcoming";
  title: string;
}

interface Props {
  items: TimelineItem[];
}

const DOT_COLOR: Record<NonNullable<TimelineItem["status"]>, string> = {
  completed: "chartreuse",
  current: "cobalt",
  upcoming: "soft-pink",
};

export const Timeline = ({ items }: Props) => {
  return (
    <div
      className={css({
        borderRadius: "md",
        padding: "4",
      })}
    >
      <ul
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "0",
          listStyle: "none",
          padding: "0",
        })}
      >
        {items.map((item, i) => {
          const dotColor = DOT_COLOR[item.status ?? "upcoming"];
          const isLast = i === items.length - 1;

          return (
            <li
              className={css({
                display: "flex",
                gap: "3",
              })}
              key={item.title}
            >
              <div
                className={css({
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  flexShrink: 0,
                })}
              >
                <div
                  className={css({
                    borderRadius: "full",
                    flexShrink: 0,
                    height: "3",
                    marginTop: "1",
                    width: "3",
                  })}
                  style={{
                    backgroundColor: `var(--colors-${dotColor})`,
                  }}
                />
                {isLast ? null : (
                  <div
                    className={css({
                      backgroundColor: "soft-pink",
                      flex: "1",
                      marginY: "1",
                      width: "px",
                    })}
                  />
                )}
              </div>
              <div
                className={css({
                  paddingBottom: isLast ? "0" : "4",
                  paddingTop: "0",
                })}
              >
                <div
                  className={css({
                    alignItems: "baseline",
                    display: "flex",
                    gap: "2",
                  })}
                >
                  <p
                    className={css({
                      fontSize: "sm",
                      fontWeight: "bold",
                    })}
                  >
                    {item.title}
                  </p>
                  {item.date ? (
                    <span
                      className={css({
                        color: "ink",
                        fontSize: "xs",
                        opacity: 0.5,
                      })}
                    >
                      {item.date}
                    </span>
                  ) : null}
                </div>
                {item.description ? (
                  <p
                    className={css({
                      color: "ink",
                      fontSize: "xs",
                      lineHeight: "body",
                      marginTop: "1",
                      opacity: 0.7,
                    })}
                  >
                    {item.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
