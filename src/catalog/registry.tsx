import { defineRegistry } from "@json-render/react";

import { CodeBlock } from "@/components/code-block";
import { ImageCard } from "@/components/image-card";
import { LinkPreview } from "@/components/link-preview";
import { Poll } from "@/components/poll";
import { RepoCard } from "@/components/repo-card";
import { Table } from "@/components/table";
import { TextMessage } from "@/components/text-message";

import { catalog } from "./index";

export const { registry } = defineRegistry(catalog, {
  components: {
    CodeBlock: ({ props }) => {
      return <CodeBlock {...props} />;
    },
    ImageCard: ({ props }) => {
      return <ImageCard {...props} />;
    },
    LinkPreview: ({ props }) => {
      return <LinkPreview {...props} />;
    },
    Poll: ({ props }) => {
      return <Poll {...props} />;
    },
    RepoCard: ({ props }) => {
      return <RepoCard {...props} />;
    },
    Table: ({ props }) => {
      return <Table {...props} />;
    },
    TextMessage: ({ props }) => {
      return <TextMessage {...props} />;
    },
  },
});
