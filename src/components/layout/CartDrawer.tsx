"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, useNav } from "@/lib/store";
import { formatPKR } from "@/lib/format";

export function CartDrawer() {
  const { lines, drawerOpen, setDrawer, setQty, remove, subtotal } = useCart();
  const nav = useNav();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawer}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-gold/20">
          <SheetTitle className="font-display tracking-[0.2em] uppercase text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" /> Your Selection
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-20 h-20 rounded-full border border-gold/30 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-gold/60" />
            </div>
            <p className="font-display text-xl">Your cart awaits its first treasure</p>
            <p className="text-sm text-muted-foreground">Discover our luxury impression fragrances.</p>
            <Button
              onClick={() => {
                setDrawer(false);
                nav.navigate({ name: "shop" });
              }}
              className="bg-gold text-noir hover:bg-gold/90 mt-2"
            >
              Explore the Boutique
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {lines.map((l) => (
                <div key={l.variantId} className="flex gap-3 rounded-xl border border-border/60 p-3 bg-card/60">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                    {l.image && <Image src={l.image} alt={l.name} fill className="object-cover" sizes="64px" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-semibold truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.label}</p>
                    <p className="text-sm text-gold font-medium mt-0.5">{formatPKR(l.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(l.variantId, l.quantity - 1)} aria-label="Decrease quantity">
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm w-6 text-center">{l.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(l.variantId, l.quantity + 1)} aria-label="Increase quantity">
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive" onClick={() => remove(l.variantId)} aria-label="Remove item">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gold/20 p-5 space-y-3 bg-card/80">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-gold">{formatPKR(subtotal())}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout · Free over PKR 4,000</p>
              <Button
                className="w-full bg-gold text-noir hover:bg-gold/90 h-11 text-sm tracking-wider"
                onClick={() => {
                  setDrawer(false);
                  nav.navigate({ name: "checkout" });
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
        <button onClick={() => setDrawer(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-gold" aria-label="Close cart">
          <X className="w-5 h-5" />
        </button>
      </SheetContent>
    </Sheet>
  );
}
