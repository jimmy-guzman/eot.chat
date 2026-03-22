import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";

import { schemas } from "./schema";

export const catalog = defineCatalog(schema, {
  actions: {},
  components: {
    BarChart: {
      description: "Bar chart for comparing categorical values",
      props: schemas.BarChart,
    },
    Callout: {
      description: "Highlighted info, tip, or warning block",
      props: schemas.Callout,
    },
    CodeBlock: {
      description: "Syntax-highlighted code block",
      props: schemas.CodeBlock,
    },
    ImageCard: {
      description: "Image with optional caption",
      props: schemas.ImageCard,
    },
    LineChart: {
      description: "Line chart for showing trends over time",
      props: schemas.LineChart,
    },
    LinkPreview: {
      description: "URL unfurled into a title, description, and domain card",
      props: schemas.LinkPreview,
    },
    Metric: {
      description: "Single KPI display with value, label, and optional trend",
      props: schemas.Metric,
    },
    Poll: {
      description: "Interactive poll with a question and answer options",
      props: schemas.Poll,
    },
    RepoCard: {
      description: "GitHub repository card",
      props: schemas.RepoCard,
    },
    Stack: {
      description: "Flex layout container for composing multiple components",
      props: schemas.Stack,
    },
    Table: {
      description: "Data table with headers and rows",
      props: schemas.Table,
    },
    TextMessage: {
      description: "Plain chat message",
      props: schemas.TextMessage,
    },
    Timeline: {
      description: "Vertical list of events or steps with status indicators",
      props: schemas.Timeline,
    },
  },
});
