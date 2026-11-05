"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, SessionUser, Variant, View } from "./types";

/* ---------------- Navigation / view store ---------------- */
type NavState = {
  view: View;
  history: View[];
  navigate: (v: View) => void;
  back: () => void;
};

export const useNav = create<NavState>((set, get) => ({
  view: { name: "home" },
  history: [],
  navigate: (v) => {
    const cur = get().view;
    if (JSON.stringify(cur) === JSON.stringify(v)) return;
    set({ view: v, history: [...get().history.slice(-20), cur] });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  },
  back: () => {
    const h = [...get().history];
    const prev = h.pop() || { name: "home" as const };
    set({ view: prev, history: h });
  },
}));

/* ---------------- Auth store ---------------- */
type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  setUser: (u: SessionUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({ user: data.user ?? null, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));

/* ---------------- Cart store (persisted) ---------------- */
export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  label: string;
  price: number;
  image: string | null;
  quantity: number;
  maxStock: number;
};

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  setDrawer: (open: boolean) => void;
  add: (product: Product, variant: Variant, qty?: number) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      drawerOpen: false,
      setDrawer: (open) => set({ drawerOpen: open }),
      add: (product, variant, qty = 1) => {
        const lines = [...get().lines];
        const idx = lines.findIndex((l) => l.variantId === variant.id);
        if (idx >= 0) {
          lines[idx] = {
            ...lines[idx],
            quantity: Math.min(lines[idx].quantity + qty, Math.max(variant.stock, 1)),
          };
        } else {
          lines.push({
            variantId: variant.id,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            size: variant.size,
            label: variant.label,
            price: variant.price,
            image: variant.image,
            quantity: qty,
            maxStock: variant.stock,
          });
        }
        set({ lines, drawerOpen: true });
      },
      remove: (variantId) => set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),
      setQty: (variantId, qty) => {
        if (qty < 1) return set({ lines: get().lines.filter((l) => l.variantId !== variantId) });
        set({
          lines: get().lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: Math.min(qty, Math.max(l.maxStock, 1)) } : l
          ),
        });
      },
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: () => get().lines.reduce((s, l) => s + l.price * l.quantity, 0),
    }),
    {
      name: "suha-cart",
      // rehydrate after React hydration to avoid SSR mismatch (see Providers)
      skipHydration: true,
    }
  )
);
