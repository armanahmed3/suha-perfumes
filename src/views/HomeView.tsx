"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Droplets, Gem, Sparkles, Star, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/layout/ProductCard";
import { HeroGallery } from "@/components/layout/HeroGallery";
import { Reveal } from "@/components/layout/ViewTransition";
import { useNav } from "@/lib/store";
import type { Product, Settings } from "@/lib/types";

const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-gold/5 to-transparent" />,
});
const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
};

export function HomeView({ products, settings }: { products: Product[]; settings: Settings | null }) {
  const nav = useNav();
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const bestRated = [...products].filter((p) => p.reviewCount > 0).sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <div>
      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* ambient glows */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] max-w-[720px] max-h-[720px] rounded-full bg-gold/10 blur-[120px] animate-glow" />
          <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] rounded-full bg-gold/5 blur-[100px]" />
        </div>

        {/* 3D scene — ambient gold dust only; the real photography takes the stage */}
        <div className="absolute inset-0">
          <HeroScene liquidColor="#D4AF37" ambient />
        </div>

        {/* legibility gradient (stronger on small screens) */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/80 via-background/55 to-background/85 lg:bg-gradient-to-r lg:from-background/85 lg:via-background/45 lg:to-transparent"
          aria-hidden="true"
        />

        {/* copy + real-photo cinematic gallery */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-8 items-center">
            <div className="max-w-2xl">
              <motion.p
                {...fadeUp}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="text-xs sm:text-sm tracking-[0.5em] uppercase text-gold mb-6"
              >
                ✦ SUHA Perfumes · Karachi ✦
              </motion.p>

              <motion.h1
                {...fadeUp}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium leading-[0.95] tracking-tight"
              >
                Wear the
                <span className="block gold-text italic font-semibold">Extraordinary</span>
              </motion.h1>

              <motion.p
                {...fadeUp}
                transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed"
              >
                23 luxury impression fragrances for him &amp; her — meticulously blended, beautifully bottled.
                Every icon, reimagined in <span className="text-gold">Petite 35ml</span> and{" "}
                <span className="text-gold">Grand 100ml</span>.
              </motion.p>

              <motion.div
                {...fadeUp}
                transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-9 flex flex-wrap gap-4"
              >
                <Button
                  size="lg"
                  onClick={() => nav.navigate({ name: "shop" })}
                  className="bg-gold text-noir hover:bg-gold/90 h-13 px-8 text-sm tracking-[0.18em] uppercase rounded-full group"
                >
                  Explore Collection
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => nav.navigate({ name: "about" })}
                  className="border-gold/40 text-gold hover:bg-gold/10 h-13 px-8 text-sm tracking-[0.18em] uppercase rounded-full"
                >
                  Our Story
                </Button>
              </motion.div>

              {/* stats */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.9, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="mt-12 flex gap-8 sm:gap-12"
              >
                {[
                  { n: "23+", l: "Fragrances" },
                  { n: "2", l: "Sizes each" },
                  { n: "4.8★", l: "Loved rating" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-display text-3xl sm:text-4xl font-semibold gold-text">{s.n}</p>
                    <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mt-1">{s.l}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* real product photography — cinematic rotating gallery */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative mt-10 lg:mt-0 mb-8 lg:mb-0"
            >
              <HeroGallery />
            </motion.div>
          </div>
        </div>

        {/* scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-gold/70"
          aria-hidden="true"
        >
          <span className="text-[10px] tracking-[0.4em] uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ==================== MARQUEE ==================== */}
      <div className="border-y border-gold/15 py-4 overflow-hidden bg-noir/60" aria-hidden="true">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0">
              {products.slice(0, 12).map((p) => (
                <span key={`${i}-${p.id}`} className="mx-6 font-display text-2xl italic text-gold/50">
                  {p.name} <span className="not-italic text-gold/30 text-sm align-middle">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ==================== FEATURED ==================== */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-14">
          <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">The Icons</p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold">Featured <span className="gold-text italic">Masterpieces</span></h2>
          <div className="gold-line w-40 mx-auto mt-5" />
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <Reveal className="text-center mt-12" delay={0.1}>
          <Button
            variant="outline"
            onClick={() => nav.navigate({ name: "shop" })}
            className="border-gold/40 text-gold hover:bg-gold/10 rounded-full px-8 h-12 tracking-[0.15em] uppercase text-sm"
          >
            View all 23 fragrances <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Reveal>
      </section>

      {/* ==================== THE DUO ==================== */}
      <section className="relative py-20 lg:py-28 border-y border-gold/15 bg-noir/40 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute left-1/3 top-0 w-[40vw] h-[40vw] rounded-full bg-gold/8 blur-[110px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-gold/15 via-transparent to-gold/5 blur-2xl" aria-hidden="true" />
              <div className="relative grid grid-cols-2 gap-5">
                <div className="luxury-card gold-border rounded-3xl overflow-hidden">
                  <div className="relative aspect-[3/4]">
                    <Image src="/images/products/zara-small.jpg" alt="Petite 35ml travel spray" fill className="object-cover" sizes="(max-width:1024px) 45vw, 300px" />
                  </div>
                  <div className="p-4 text-center">
                    <p className="font-display text-lg font-semibold">Petite</p>
                    <p className="text-xs text-muted-foreground tracking-[0.2em]">35ML SPRAY</p>
                  </div>
                </div>
                <div className="luxury-card gold-border rounded-3xl overflow-hidden">
                  <div className="relative aspect-[3/4]">
                    <Image src="/images/products/zara-large.jpg" alt="Grand 100ml flacon" fill className="object-cover" sizes="(max-width:1024px) 45vw, 300px" />
                  </div>
                  <div className="p-4 text-center">
                    <p className="font-display text-lg font-semibold">Grand</p>
                    <p className="text-xs text-muted-foreground tracking-[0.2em]">100ML FLACON</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">Two Sizes · One Obsession</p>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">
              Every scent in <span className="gold-text italic">two volumes</span>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Carry the <strong className="text-gold">Petite 35ml</strong> in your bag for touch-ups on the go, and let the{" "}
              <strong className="text-gold">Grand 100ml</strong> reign on your vanity. Same meticulous oil, same lasting trail —
              every fragrance in the SUHA repertoire comes in both volumes.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: Droplets, t: "High oil concentration", d: "Long-lasting impressions that bloom through the day." },
                { icon: Truck, t: "Free delivery over PKR 4,000", d: "Cash on Delivery across Pakistan, 2–4 working days." },
                { icon: ShieldCheck, t: "Quality sealed", d: "Every flacon checked, sealed and batch-stamped by hand." },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <span className="w-11 h-11 shrink-0 rounded-full border border-gold/40 bg-gold/10 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-gold" />
                  </span>
                  <div>
                    <p className="font-medium">{f.t}</p>
                    <p className="text-sm text-muted-foreground">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button onClick={() => nav.navigate({ name: "shop" })} className="mt-9 bg-gold text-noir hover:bg-gold/90 rounded-full px-8 h-12 tracking-[0.15em] uppercase text-sm">
              Build your duo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ==================== CATEGORIES ==================== */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-14">
          <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">Curated For You</p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold">Find Your <span className="gold-text italic">Signature</span></h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { title: "For Him", sub: "Bold woods & fresh aquatics", gender: "Men", img: "hugo-boss" },
            { title: "For Her", sub: "Blooms, amber & allure", gender: "Women", img: "guchi-bloom" },
            { title: "Unisex", sub: "Shared secrets in a bottle", gender: "Unisex", img: "zara" },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.12}>
              <button
                onClick={() => nav.navigate({ name: "shop", gender: c.gender })}
                className="luxury-card gold-border group relative rounded-3xl overflow-hidden w-full text-left aspect-[4/5]"
              >
                <Image
                  src={`/images/products/${c.img}-large.jpg`}
                  alt={c.title}
                  fill
                  sizes="(max-width:640px) 90vw, 30vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/30 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <p className="font-display text-3xl font-semibold text-white">{c.title}</p>
                  <p className="text-sm text-gold-light/80 mt-1">{c.sub}</p>
                  <span className="inline-flex items-center gap-2 mt-4 text-xs tracking-[0.25em] uppercase text-gold">
                    Discover <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5" />
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      {bestRated.length > 0 && (
        <section className="py-20 lg:py-28 border-t border-gold/15 bg-noir/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-14">
              <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">Word of Mouth</p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold">Loved Across <span className="gold-text italic">Pakistan</span></h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {bestRated.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.12}>
                  <blockquote className="luxury-card gold-border rounded-3xl p-7 h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className={`w-4 h-4 ${s < Math.round(p.rating) ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
                      ))}
                    </div>
                    <p className="text-muted-foreground leading-relaxed flex-1">&ldquo;{p.shortDesc || p.description}&rdquo;</p>
                    <footer className="mt-5 pt-4 border-t border-gold/15">
                      <p className="font-display text-lg font-semibold text-gold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Rated {p.rating.toFixed(1)} / 5 by our customers</p>
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== CTA ==================== */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[50vh] bg-gold/10 blur-[130px] rounded-full animate-glow" />
        </div>
        <Reveal className="relative max-w-3xl mx-auto text-center px-4">
          <Sparkles className="w-8 h-8 text-gold mx-auto mb-6" />
          <h2 className="font-display text-4xl sm:text-6xl font-semibold leading-tight">
            Your signature scent is <span className="gold-text italic">waiting</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg">
            {settings?.announcement || "Free delivery on orders over PKR 4,000 — Cash on Delivery across Pakistan."}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => nav.navigate({ name: "shop" })} className="bg-gold text-noir hover:bg-gold/90 rounded-full px-10 h-14 text-sm tracking-[0.2em] uppercase">
              <Gem className="w-4 h-4 mr-2" /> Shop the Boutique
            </Button>
            <Button size="lg" variant="outline" onClick={() => nav.navigate({ name: "contact" })} className="border-gold/40 text-gold hover:bg-gold/10 rounded-full px-10 h-14 text-sm tracking-[0.2em] uppercase">
              Talk to a concierge
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
