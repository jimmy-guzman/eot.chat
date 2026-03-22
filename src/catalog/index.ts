import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";

import { schemas } from "./schema";

export const catalog = defineCatalog(schema, {
  actions: {},
  components: {
    CodeBlock: {
      description: "Syntax-highlighted code block",
      props: schemas.CodeBlock,
    },
    ImageCard: {
      description: "Image with optional caption",
      props: schemas.ImageCard,
    },
    LinkPreview: {
      description: "URL unfurled into a title, description, and domain card",
      props: schemas.LinkPreview,
    },
    Poll: {
      description: "Interactive poll with a question and answer options",
      props: schemas.Poll,
    },
    RepoCard: {
      description: "GitHub repository card",
      props: schemas.RepoCard,
    },
    Table: {
      description: "Data table with headers and rows",
      props: schemas.Table,
    },
    TextMessage: {
      description: "Plain chat message",
      props: schemas.TextMessage,
    },
  },
});
