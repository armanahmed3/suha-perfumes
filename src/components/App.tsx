"use client";

import Image from "next/image";
import React, { Component, type ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ViewTransition } from "@/components/layout/ViewTransition";
import { HomeView } from "@/views/HomeView";
import { ShopView } from "@/views/ShopView";
import { ProductView } from "@/views/ProductView";
import { CheckoutView, OrderSuccessView } from "@/views/CheckoutView";
import { AuthView } from "@/views/AuthView";
import { UserPanelView } from "@/views/UserPanelView";
import { AdminPanelView } from "@/views/AdminPanelView";
import { AboutView, ContactView } from "@/views/InfoViews";
import { useNav } from "@/lib/store";
import type { Product, Settings } from "@/lib/types";

class SafeBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || "Unknown error" };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Caught boundary error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-noir flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-card/60 backdrop-blur-md p-8 rounded-2xl border border-gold/20 shadow-2xl">
            <h2 className="font-display text-2xl gold-text mb-3">Suha Perfumes</h2>
            <p className="text-sm text-[#f3ecdd]/80 mb-6">Experience refinement. Let us reconnect to our fragrance collection.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="px-6 py-2.5 rounded-full bg-gold hover:bg-gold-light text-noir font-semibold text-xs tracking-wider uppercase transition-all shadow-lg"
            >
              Explore Collection
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Full-screen cinematic intro curtain (first visit) */
function IntroCurtain() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1900);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="intro"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[90] bg-noir flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, scale: 1, letterSpacing: "0.55em" }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4"
            >
              <Image src="/images/logo-icon.png" alt="SUHA" fill className="object-contain drop-shadow-[0_4px_24px_rgba(212,175,55,0.5)]" priority />
            </motion.div>
            <p className="font-display text-5xl sm:text-7xl font-semibold gold-text">SUHA</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-3 text-[10px] tracking-[0.7em] uppercase text-[#f3ecdd]/60"
            >
              Perfumes
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              className="gold-line w-48 mx-auto mt-6"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const nav = useNav();
  const [products, setProducts] = useState<Product[] | null>(() => {
    if (typeof window !== "undefined" && Array.isArray((window as any).__INITIAL_PRODUCTS__) && (window as any).__INITIAL_PRODUCTS__.length > 0) {
      return (window as any).__INITIAL_PRODUCTS__;
    }
    return null;
  });
  const [settings, setSettings] = useState<Settings | null>(() => {
    if (typeof window !== "undefined" && (window as any).__INITIAL_SETTINGS__) {
      return (window as any).__INITIAL_SETTINGS__;
    }
    return null;
  });
  const view = nav.view;

  useEffect(() => {
    Promise.all([
      fetch("/api/products/?sort=curated").then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/settings/").then((r) => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([p, s]) => {
        if (p?.products && Array.isArray(p.products) && p.products.length > 0) {
          setProducts(p.products);
        } else {
          setProducts((curr) => curr || []);
        }
        if (s?.settings) {
          setSettings(s.settings);
        }
      })
      .catch(() => {
        setProducts((curr) => curr || []);
      });
  }, []);

  const viewKey = useMemo(() => JSON.stringify(view), [view]);

  const content = (() => {
    if (products === null) {
      // cinematic loading skeleton
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="mt-6 text-xs tracking-[0.5em] uppercase text-gold/70">Opening the vault…</p>
          </div>
        </div>
      );
    }
    switch (view.name) {
      case "shop":
        return <ShopView products={products} initialGender={view.gender} />;
      case "product": {
        const product = products.find((p) => p.slug === view.slug);
        if (!product) return <ShopView products={products} />;
        return <ProductView product={product} allProducts={products} />;
      }
      case "cart":
      case "checkout":
        return <CheckoutView settings={settings} />;
      case "order-success":
        return <OrderSuccessView orderNumber={view.orderNumber} total={view.total} />;
      case "auth":
        return <AuthView initialMode={view.mode || "login"} />;
      case "user":
        return <UserPanelView />;
      case "admin":
        return <AdminPanelView />;
      case "about":
        return <AboutView />;
      case "contact":
        return <ContactView />;
      default:
        return <HomeView products={products} settings={settings} />;
    }
  })();

  return (
    <SafeBoundary>
      <div className="min-h-screen flex flex-col grain">
        <IntroCurtain />
        <Header />
        <CartDrawer />
        <main className="flex-1 flex flex-col">
          <ViewTransition viewKey={viewKey}>{content}</ViewTransition>
        </main>
        <Footer />
      </div>
    </SafeBoundary>
  );
}
