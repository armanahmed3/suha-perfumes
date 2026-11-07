"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard } from "@/components/layout/ProductCard";
import type { Product } from "@/lib/types";

const GENDERS = ["All", "Men", "Women", "Unisex"] as const;
const LABELS: Record<string, string> = { All: "All Fragrances", Men: "For Him", Women: "For Her", Unisex: "Unisex" };

export function ShopView({ products, initialGender }: { products: Product[]; initialGender?: string }) {
  const [gender, setGender] = useState<string>(initialGender || "All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("curated");

  const filtered = useMemo(() => {
    let list = [...products];
    if (gender !== "All") list = list.filter((p) => p.gender === gender);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (p.originalName || "").toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price_asc": list.sort((a, b) => (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0)); break;
      case "price_desc": list.sort((a, b) => (b.variants[1]?.price ?? 0) - (a.variants[1]?.price ?? 0)); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      default: list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder);
    }
    return list;
  }, [products, gender, search, sort]);

  return (
    <div className="min-h-screen pt-28 lg:pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* heading */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-12">
          <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">The Collection</p>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold">
            The <span className="gold-text italic">Boutique</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {filtered.length} luxury impressions · each in Petite 15ml &amp; Grand 50ml
          </p>
          <div className="gold-line w-40 mx-auto mt-6" />
        </motion.div>

        {/* controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col lg:flex-row gap-4 lg:items-center mb-10 sticky top-20 z-30 glass-panel rounded-2xl p-4"
        >
          {/* gender pills */}
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter by gender">
            {GENDERS.map((g) => (
              <button
                key={g}
                role="tab"
                aria-selected={gender === g}
                onClick={() => setGender(g)}
                className={`px-4 py-2 rounded-full text-xs tracking-[0.15em] uppercase transition-all border ${
                  gender === g
                    ? "bg-gold text-noir border-gold font-semibold"
                    : "border-border text-muted-foreground hover:text-gold hover:border-gold/50"
                }`}
              >
                {LABELS[g]}
              </button>
            ))}
          </div>

          <div className="flex gap-3 lg:ml-auto flex-col sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fragrances…"
                className="pl-9 w-full sm:w-56 bg-card/60"
                aria-label="Search fragrances"
              />
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-48 bg-card/60" aria-label="Sort products">
                <SlidersHorizontal className="w-4 h-4 mr-1 text-gold" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curated">Curated order</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* grid */}
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="font-display text-2xl text-muted-foreground">No fragrances match your search.</p>
            <button onClick={() => { setSearch(""); setGender("All"); }} className="mt-4 text-gold underline underline-offset-4">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
