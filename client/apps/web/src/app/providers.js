"use client";

import { ApiQueryProvider } from "@repo/api";

export function Providers({ children }) {
  return <ApiQueryProvider>{children}</ApiQueryProvider>;
}
