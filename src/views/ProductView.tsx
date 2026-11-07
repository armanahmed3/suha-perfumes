"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Droplet, Flower, Leaf, Minus, Plus, Rotate3d, ShoppingBag, Sparkles, Star, Thermometer, Wind, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/layout/ProductCard";
import { BottleFallback } from "@/components/layout/BottleFallback";
import { useCart, useNav } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import type { Product, Variant } from "@/lib/types";

const BottleViewer = dynamic(() => import("@/components/3d/BottleViewer"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>,
});

export function ProductView({ product, allProducts }: { product: Product; allProducts: Product[] }) {
  const nav = useNav();
  const cart = useCart();
  const small = product.variants.find((v) => v.size === "15ml");
  const large = product.variants.find((v) => v.size === "50ml");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [mode3d, setMode3d] = useState(false);
  const [added, setAdded] = useState(false);
  // derive a valid selection without effects (falls back to Grand, then first variant)
  const selected = useMemo(
    () => (selectedId ? product.variants.find((v) => v.id === selectedId) ?? null : large || small || product.variants[0] || null),
    [selectedId, product.variants, large, small]
  );

  const related = useMemo(
    () => allProducts.filter((p) => p.id !== product.id && (p.gender === product.gender || p.gender === "Unisex")).slice(0, 4),
    [allProducts, product]
  );

  const handleAdd = () => {
    if (!selected) return;
    cart.add(product, selected, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const notes = [
    { label: "Top Notes", items: product.topNotes, icon: Sparkles },
    { label: "Heart Notes", items: product.heartNotes, icon: Flower },
    { label: "Base Notes", items: product.baseNotes, icon: Leaf },
  ].filter((n) => n.items && n.items.length > 0);

  const meta = [
    product.longevity && !/not specified/i.test(product.longevity) ? { icon: Droplet, label: "Longevity", value: product.longevity } : null,
    product.sillage && !/not specified/i.test(product.sillage) ? { icon: Wind, label: "Sillage", value: product.sillage } : null,
    product.season && product.season.length ? { icon: Thermometer, label: "Season", value: product.season.join(" · ") } : null,
    product.year ? { icon: Star, label: "Original year", value: String(product.year) } : null,
  ].filter(Boolean) as { icon: typeof Droplet; label: string; value: string }[];

  return (
    <div className="pt-24 lg:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* breadcrumb */}
        <button onClick={() => nav.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to boutique
        </button>

        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
          {/* ---------- visual: 3D / photo ---------- */}
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden glass-panel">
              {/* ambient glow tinted by liquid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30 blur-[80px]"
                style={{ background: `radial-gradient(circle at 50% 42%, ${product.liquidColor}, transparent 65%)` }}
                aria-hidden="true"
              />
              {mode3d || !selected?.image ? (
                <BottleViewer liquidColor={product.liquidColor} size={selected?.size === "15ml" ? "small" : "large"} photo={`/images/cutouts/${product.slug}-${selected?.size === "15ml" ? "15ml" : "50ml"}.png`} />
              ) : (
                selected?.image && (
                  <motion.div key={selected.id} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="absolute inset-0">
                    <Image src={selected.image} alt={`${product.name} ${selected.label}`} fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" priority />
                  </motion.div>
                )
              )}

              {/* toggle — photo option and 3d option */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex rounded-full glass-panel p-1 z-10 shadow-lg shadow-black/30">
                <button
                  onClick={() => setMode3d(false)}
                  className={`px-4 py-2 rounded-full text-xs tracking-[0.15em] uppercase flex items-center gap-1.5 transition-colors ${!mode3d ? "bg-gold text-noir font-semibold shadow" : "text-muted-foreground hover:text-gold"}`}
                >
                  <Image aria-hidden="true" src="/images/logo-icon.png" alt="" width={14} height={14} className="object-contain" /> Photo
                </button>
                <button
                  onClick={() => setMode3d(true)}
                  className={`px-4 py-2 rounded-full text-xs tracking-[0.15em] uppercase flex items-center gap-1.5 transition-colors ${mode3d ? "bg-gold text-noir font-semibold shadow" : "text-muted-foreground hover:text-gold"}`}
                >
                  <Rotate3d className="w-3.5 h-3.5" /> 3D View
                </button>
              </div>

              <p className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-gold z-10 bg-noir/60 backdrop-blur px-3 py-1 rounded-full border border-gold/20">
                {mode3d ? "Interactive 3D Flacon" : "Authentic Studio Photography"}
              </p>
            </div>

            {/* size thumbnails */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[small, large].filter(Boolean).map((v) => {
                const variant = v as Variant;
                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedId(variant.id)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 aspect-[16/10] ${
                      selected?.id === variant.id ? "border-gold shadow-[0_0_24px_-6px_var(--gold)]" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-pressed={selected?.id === variant.id}
                  >
                    {variant.image ? (
                      <Image src={variant.image} alt={`${product.name} ${variant.label}`} fill className="object-cover" sizes="25vw" />
                    ) : (
                      <BottleFallback
                        liquidColor={product.liquidColor}
                        size={variant.size === "15ml" ? "small" : "large"}
                        label={`${product.name} ${variant.label}`}
                        className="absolute inset-0"
                      />
                    )}
                    <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-noir/70 backdrop-blur text-[10px] tracking-[0.2em] uppercase text-gold">
                      {variant.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------- info ---------- */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-xs tracking-[0.4em] uppercase text-gold">{product.category} · Impression of {product.originalName || product.name}</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mt-3 leading-tight">{product.name}</h1>
            <p className="mt-2 text-muted-foreground">
              by {product.brand} {product.year ? `· ${product.year}` : ""} ·{" "}
              <span className="text-gold inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-gold" /> {product.reviewCount ? `${product.rating.toFixed(1)} (${product.reviewCount})` : "New"}
              </span>
            </p>

            <p className="mt-6 leading-relaxed text-foreground/85">{product.description || product.shortDesc}</p>

            {/* accords */}
            {product.accords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {product.accords.slice(0, 6).map((a) => (
                  <span key={a} className="px-3 py-1.5 rounded-full border border-gold/35 text-xs tracking-wider text-gold bg-gold/5">
                    {a}
                  </span>
                ))}
              </div>
            )}

            <Separator className="my-7 bg-gold/20" />

            {/* size picker */}
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Choose your volume</p>
            <div className="grid grid-cols-2 gap-4">
              {[small, large].filter(Boolean).map((v) => {
                const variant = v as Variant;
                const isSel = selected?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedId(variant.id)}
                    className={`luxury-card rounded-2xl p-4 text-left transition-all ${isSel ? "!border-gold shadow-[0_0_30px_-8px_var(--gold)]" : ""}`}
                    aria-pressed={isSel}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg font-semibold">{variant.label}</p>
                      {isSel && <Check className="w-4 h-4 text-gold" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground tracking-wider uppercase mt-0.5">{variant.sku}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-gold">{formatPKR(variant.price)}</span>
                      {variant.oldPrice && <span className="text-sm line-through text-muted-foreground/60">{formatPKR(variant.oldPrice)}</span>}
                    </div>
                    <p className={`text-xs mt-1 ${variant.stock > 10 ? "text-muted-foreground" : "text-amber-500"}`}>
                      {variant.stock > 10 ? "In stock" : `Only ${variant.stock} left`}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* qty + add */}
            <div className="flex gap-3 mt-7">
              <div className="flex items-center rounded-full border border-border bg-card/60">
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="rounded-full">
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(q + 1, selected?.stock || 9))} aria-label="Increase quantity" className="rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleAdd}
                disabled={!selected || selected.stock < 1}
                className="flex-1 h-12 rounded-full bg-gold text-noir hover:bg-gold/90 text-sm tracking-[0.18em] uppercase font-semibold"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Added to cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Add — {selected ? formatPKR(selected.price * qty) : ""}
                  </>
                )}
              </Button>
            </div>

            {/* meta facts */}
            {meta.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                {meta.map((m) => (
                  <div key={m.label} className="rounded-2xl border border-border/70 bg-card/50 p-3.5 text-center">
                    <m.icon className="w-4 h-4 text-gold mx-auto mb-2" />
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-medium mt-1 leading-snug">{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* notes pyramid */}
            {notes.length > 0 && (
              <div className="mt-9">
                <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">The olfactory pyramid</p>
                <div className="space-y-3">
                  {notes.map((n, i) => (
                    <motion.div
                      key={n.label}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="rounded-2xl border border-border/70 bg-card/50 p-4"
                      style={{ marginLeft: `${i * 14}px`, borderLeft: "3px solid var(--gold)" }}
                    >
                      <p className="text-xs tracking-[0.25em] uppercase text-gold flex items-center gap-2">
                        <n.icon className="w-3.5 h-3.5" /> {n.label}
                      </p>
                      <p className="mt-1.5 text-sm text-foreground/80">{n.items?.join(" · ")}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* related */}
        {related.length > 0 && (
          <section className="mt-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs tracking-[0.4em] uppercase text-gold mb-2">Continue exploring</p>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold">You may also <span className="gold-text italic">adore</span></h2>
              </div>
              <Button variant="outline" onClick={() => nav.navigate({ name: "shop" })} className="hidden sm:inline-flex border-gold/40 text-gold hover:bg-gold/10 rounded-full">
                View all
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
