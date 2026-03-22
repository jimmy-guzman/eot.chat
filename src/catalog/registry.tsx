import { defineRegistry } from "@json-render/react";

import { BarChart } from "@/components/bar-chart";
import { Callout } from "@/components/callout";
import { CodeBlock } from "@/components/code-block";
import { ImageCard } from "@/components/image-card";
import { LineChart } from "@/components/line-chart";
import { LinkPreview } from "@/components/link-preview";
import { Metric } from "@/components/metric";
import { Poll } from "@/components/poll";
import { RepoCard } from "@/components/repo-card";
import { Stack } from "@/components/stack";
import { Table } from "@/components/table";
import { TextMessage } from "@/components/text-message";
import { Timeline } from "@/components/timeline";

import { catalog } from "./index";

export const { registry } = defineRegistry(catalog, {
  components: {
    BarChart: ({ props }) => {
      return <BarChart {...props} />;
    },
    Callout: ({ props }) => {
      return <Callout {...props} />;
    },
    CodeBlock: ({ props }) => {
      return <CodeBlock {...props} />;
    },
    ImageCard: ({ props }) => {
      return <ImageCard {...props} />;
    },
    LineChart: ({ props }) => {
      return <LineChart {...props} />;
    },
    LinkPreview: ({ props }) => {
      return <LinkPreview {...props} />;
    },
    Metric: ({ props }) => {
      return <Metric {...props} />;
    },
    Poll: ({ props }) => {
      return <Poll {...props} />;
    },
    RepoCard: ({ props }) => {
      return <RepoCard {...props} />;
    },
    Stack: ({ children, props }) => {
      return <Stack {...props}>{children}</Stack>;
    },
    Table: ({ props }) => {
      return <Table {...props} />;
    },
    TextMessage: ({ props }) => {
      return <TextMessage {...props} />;
    },
    Timeline: ({ props }) => {
      return <Timeline {...props} />;
    },
  },
});
