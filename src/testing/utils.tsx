import type { RenderOptions } from "@testing-library/react";
import type * as React from "react";
import type { ReactElement } from "react";

import { render } from "@testing-library/react";

interface AllProvidersProps {
  children: React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components -- this is okay
const AllTheProviders = ({ children }: AllProvidersProps) => {
  return <>{children}</>;
};

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  searchParams?: Record<string, string> | string | URLSearchParams;
}

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { searchParams, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => {
      return <AllTheProviders>{children}</AllTheProviders>;
    },
    ...renderOptions,
  });
};

// eslint-disable-next-line react-refresh/only-export-components, import-x/export -- this is okay
export * from "@testing-library/react";
// eslint-disable-next-line import-x/export -- this is okay
export { customRender as render };
