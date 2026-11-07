"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Moon,
  Sun,
  User,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNav, useAuth, useCart } from "@/lib/store";

const NAV = [
  { label: "Home", view: { name: "home" } as const },
  { label: "Boutique", view: { name: "shop" } as const },
  { label: "Our Story", view: { name: "about" } as const },
  { label: "Contact", view: { name: "contact" } as const },
];

const emptySubscribe = () => () => {};
const getMounted = () => true;
const getServerSnapshot = () => false;

export function Header() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getMounted, getServerSnapshot);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNav();
  const { user, logout } = useAuth();
  const cartCount = useCart((s) => s.lines.reduce((a, l) => a + l.quantity, 0));
  const setDrawer = useCart((s) => s.setDrawer);
  const view = nav.view;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (v: { name: string }) => view.name === v.name;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-panel shadow-lg shadow-black/10" : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* announcement strip */}
      <div className="hidden md:block overflow-hidden border-b border-gold/15 bg-noir/80">
        <div className="flex whitespace-nowrap animate-marquee text-[11px] tracking-[0.22em] uppercase text-gold/80 py-1.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex shrink-0">
              {Array.from({ length: 6 }).map((_, j) => (
                <span key={j} className="mx-8 inline-flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Free delivery over PKR 4,000 <span className="text-gold/50">✦</span> Cash on Delivery across Pakistan <span className="text-gold/50">✦</span> Luxury impressions by SUHA
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* logo */}
          <button
            onClick={() => nav.navigate({ name: "home" })}
            className="flex items-center gap-3 group"
            aria-label="SUHA Perfumes home"
          >
            <span className="relative w-10 h-10 lg:w-12 lg:h-12 transition-transform duration-500 group-hover:scale-105">
              <Image
                src="/images/logo-icon.png"
                alt="SUHA Perfumes emblem"
                fill
                className="object-contain object-center drop-shadow-[0_2px_12px_rgba(212,175,55,0.4)]"
                sizes="48px"
                priority
              />
            </span>
            <span className="text-left leading-none">
              <span className="block font-display text-xl lg:text-2xl font-semibold tracking-[0.2em] gold-text">SUHA</span>
              <span className="block text-[9px] lg:text-[10px] tracking-[0.45em] uppercase text-muted-foreground mt-0.5">Perfumes</span>
            </span>
          </button>

          {/* desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => nav.navigate(item.view)}
                className={`relative px-4 py-2 text-sm tracking-[0.14em] uppercase transition-colors rounded-full ${
                  isActive(item.view) ? "text-gold" : "text-foreground/70 hover:text-gold"
                }`}
              >
                {item.label}
                {isActive(item.view) && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full border border-gold/40 bg-gold/10" transition={{ type: "spring", stiffness: 320, damping: 30 }} />
                )}
              </button>
            ))}
          </nav>

          {/* actions */}
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" className="hover:text-gold">
              {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* account menu (mount-gated: radix ids are client-only, avoids hydration diff) */}
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account" className="hover:text-gold">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {user ? (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {user.role === "ADMIN" && (
                        <DropdownMenuItem onClick={() => nav.navigate({ name: "admin" })}>
                          <LayoutDashboard className="w-4 h-4 mr-2" /> Admin Panel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => nav.navigate({ name: "user" })}>
                        <User className="w-4 h-4 mr-2" /> My Account
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()}>
                        <LogOut className="w-4 h-4 mr-2" /> Sign out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => nav.navigate({ name: "auth", mode: "login" })}>
                        <User className="w-4 h-4 mr-2" /> Sign in
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => nav.navigate({ name: "auth", mode: "register" })}>
                        <Sparkles className="w-4 h-4 mr-2" /> Create account
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Account" className="hover:text-gold" onClick={() => nav.navigate({ name: "auth", mode: "login" })}>
                <User className="w-5 h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawer(true)}
              aria-label={`Open cart, ${cartCount} items`}
              className="relative hover:text-gold"
            >
              <ShoppingBag className="w-5 h-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-gold text-noir text-[10px] font-bold flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden glass-panel border-t border-gold/15"
            aria-label="Mobile navigation"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    nav.navigate(item.view);
                    setMobileOpen(false);
                  }}
                  className={`text-left px-3 py-3 rounded-lg text-sm tracking-[0.14em] uppercase ${
                    isActive(item.view) ? "text-gold bg-gold/10" : "text-foreground/80"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {user?.role === "ADMIN" && (
                <button
                  onClick={() => {
                    nav.navigate({ name: "admin" });
                    setMobileOpen(false);
                  }}
                  className="text-left px-3 py-3 rounded-lg text-sm tracking-[0.14em] uppercase text-gold"
                >
                  Admin Panel
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
