"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { useNav } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import { BottleFallback } from "./BottleFallback";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const nav = useNav();
  const small = product.variants.find((v) => v.size === "35ml");
  const large = product.variants.find((v) => v.size === "100ml");
  const img = large?.image || small?.image || null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="luxury-card gold-border group relative rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => nav.navigate({ name: "product", slug: product.slug })}
      whileHover="hover"
    >
      {/* image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {img ? (
          <Image
            src={img}
            alt={`${product.name} by SUHA Perfumes`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover img-luxury transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <BottleFallback
            liquidColor={product.liquidColor}
            size={large ? "large" : "small"}
            label={product.name}
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-noir/10 to-transparent opacity-80" />

        {/* badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="px-2.5 py-1 rounded-full bg-gold text-noir text-[10px] font-semibold tracking-[0.14em] uppercase">
              Bestseller
            </span>
          )}
          {product.gender !== "Unisex" && (
            <span className="px-2.5 py-1 rounded-full glass-panel text-[10px] tracking-[0.14em] uppercase text-gold">
              For {product.gender === "Men" ? "Him" : "Her"}
            </span>
          )}
        </div>

        {/* rating */}
        {product.reviewCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full glass-panel text-xs text-gold">
            <Star className="w-3 h-3 fill-gold" /> {product.rating.toFixed(1)}
          </div>
        )}

        {/* duo pricing strip */}
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-white leading-tight">{product.name}</h3>
            <p className="text-[11px] text-white/60 uppercase tracking-[0.18em]">
              {product.brand} {product.year ? `· ${product.year}` : ""}
            </p>
          </div>
          <div className="text-right">
            {small && <p className="text-[11px] text-white/55 line-through leading-none">{formatPKR(small.price)}</p>}
            {large && <p className="text-sm font-semibold text-gold-light leading-tight">{formatPKR(large.price)}</p>}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
