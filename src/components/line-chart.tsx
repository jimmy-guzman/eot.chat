import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { css } from "styled-system/css";

const COLOR_MAP: Record<string, string> = {
  chartreuse: "#C9EB8A",
  cobalt: "#2563EB",
  mint: "#B6EDE6",
  orange: "#F97316",
  sage: "#5A8A6A",
};

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  color?: string;
  data: DataPoint[];
  title?: string;
}

export const LineChart = ({ color = "cobalt", data, title }: Props) => {
  const stroke = COLOR_MAP[color] ?? COLOR_MAP.cobalt;

  return (
    <div
      className={css({
        borderRadius: "md",
        padding: "4",
      })}
    >
      {title ? (
        <p
          className={css({
            fontSize: "sm",
            fontWeight: "bold",
            marginBottom: "3",
          })}
        >
          {title}
        </p>
      ) : null}
      <ResponsiveContainer height={200} width="100%">
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            style={{ fontSize: "0.75rem" }}
            tick={{ fill: "#1A1A1A" }}
            tickLine={false}
          />
          <YAxis
            style={{ fontSize: "0.75rem" }}
            tick={{ fill: "#1A1A1A" }}
            tickLine={false}
            width={40}
          />
          <Tooltip />
          <Line
            dataKey="value"
            dot={false}
            stroke={stroke}
            strokeWidth={2}
            type="monotone"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
