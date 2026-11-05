"use client";

import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { useAuth, useCart } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const refresh = useAuth((s) => s.refresh);

  useEffect(() => {
    refresh();
    // rehydrate persisted cart AFTER React hydration (avoids SSR mismatch)
    useCart.persist.rehydrate();
  }, [refresh]);

  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>{children}</ThemeProvider>;
}
