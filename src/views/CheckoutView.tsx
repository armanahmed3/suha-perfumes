"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Banknote, CheckCircle2, Loader2, Lock, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useCart, useNav } from "@/lib/store";
import { formatPKR } from "@/lib/format";
import type { Settings } from "@/lib/types";

export function CheckoutView({ settings }: { settings: Settings | null }) {
  const nav = useNav();
  const auth = useAuth();
  const { lines, subtotal, clear } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: auth.user?.name || "",
    email: auth.user?.email || "",
    phone: auth.user?.phone || "",
    address: auth.user?.address || "",
    city: auth.user?.city || "",
    notes: "",
  });

  const shippingFee = settings?.shippingFee ?? 199;
  const freeOver = settings?.freeShippingOver ?? 4000;
  const shipping = subtotal() >= freeOver ? 0 : shippingFee;
  const total = subtotal() + shipping;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lines.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place order");
      clear();
      nav.navigate({ name: "order-success", orderNumber: data.order.orderNumber, total: data.order.total });
    } catch (err) {
      toast({ title: "Order failed", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!lines.length) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 pt-24 text-center px-4">
        <div className="w-20 h-20 rounded-full border border-gold/30 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-gold/60" />
        </div>
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="text-muted-foreground">Add a treasure before checking out.</p>
        <Button onClick={() => nav.navigate({ name: "shop" })} className="bg-gold text-noir hover:bg-gold/90 rounded-full px-8">
          Explore the Boutique
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 lg:pt-36 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => nav.navigate({ name: "shop" })} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Continue shopping
        </button>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl sm:text-5xl font-semibold mb-10">
          Secure <span className="gold-text italic">Checkout</span>
        </motion.h1>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* form */}
          <form onSubmit={submit} className="lg:col-span-3 space-y-5">
            <div className="glass-panel rounded-3xl p-6 space-y-5">
              <p className="text-xs tracking-[0.3em] uppercase text-gold flex items-center gap-2">
                <Truck className="w-4 h-4" /> Delivery details
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name *</Label>
                  <Input id="name" required value={form.customerName} onChange={set("customerName")} placeholder="Ayesha Khan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" required value={form.phone} onChange={set("phone")} placeholder="+92 3XX XXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" required value={form.city} onChange={set("city")} placeholder="Karachi" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Complete address *</Label>
                <Input id="address" required value={form.address} onChange={set("address")} placeholder="House / Street / Area" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Order notes (optional)</Label>
                <Textarea id="notes" value={form.notes} onChange={set("notes")} placeholder="Gift wrap, delivery timing…" rows={2} />
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <p className="text-xs tracking-[0.3em] uppercase text-gold flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Payment
              </p>
              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-gold/40 bg-gold/5 p-4">
                <Banknote className="w-8 h-8 text-gold" />
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Pay in cash when your parcel arrives. No advance payment.</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-gold ml-auto" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gold text-noir hover:bg-gold/90 text-sm tracking-[0.2em] uppercase font-semibold"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              {loading ? "Placing order…" : `Place order · ${formatPKR(total)}`}
            </Button>
          </form>

          {/* summary */}
          <aside className="lg:col-span-2">
            <div className="luxury-card gold-border rounded-3xl p-6 lg:sticky lg:top-28">
              <p className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Order summary</p>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {lines.map((l) => (
                  <div key={l.variantId} className="flex gap-3 items-center">
                    <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {l.image && <Image src={l.image} alt={l.name} fill className="object-cover" sizes="56px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.label} × {l.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gold">{formatPKR(l.price * l.quantity)}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-5 bg-gold/20" />
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPKR(subtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={shipping === 0 ? "text-gold" : ""}>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">Add {formatPKR(freeOver - subtotal())} more for free delivery</p>
                )}
                <Separator className="bg-gold/20" />
                <div className="flex justify-between items-baseline">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-2xl font-semibold text-gold">{formatPKR(total)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function OrderSuccessView({ orderNumber, total }: { orderNumber: string; total: number }) {
  const nav = useNav();
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 14 }}
          className="w-24 h-24 mx-auto rounded-full bg-gold/15 border border-gold/50 flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-gold" />
        </motion.div>
        <p className="text-xs tracking-[0.45em] uppercase text-gold mb-4">Order Confirmed</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">
          Thank you — it&rsquo;s <span className="gold-text italic">on its way</span>
        </h1>
        <p className="mt-5 text-muted-foreground leading-relaxed">
          Your order <span className="text-gold font-semibold">{orderNumber}</span> totalling{" "}
          <span className="text-gold font-semibold">{formatPKR(total)}</span> has been placed.
          Our concierge will call you shortly to confirm delivery.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button onClick={() => nav.navigate({ name: "user" })} className="bg-gold text-noir hover:bg-gold/90 rounded-full px-8">
            Track my orders
          </Button>
          <Button variant="outline" onClick={() => nav.navigate({ name: "shop" })} className="border-gold/40 text-gold hover:bg-gold/10 rounded-full px-8">
            Keep exploring
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
