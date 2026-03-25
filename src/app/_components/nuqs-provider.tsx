"use client";

import type { ReactNode } from "react";

import { NuqsAdapter } from "nuqs/adapters/next/app";

interface Props {
  children: ReactNode;
}

export const NuqsProvider = ({ children }: Props) => {
  return <NuqsAdapter>{children}</NuqsAdapter>;
};
