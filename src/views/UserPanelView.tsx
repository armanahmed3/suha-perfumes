"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, Phone, Mail, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useNav } from "@/lib/store";
import { formatPKR, formatDate } from "@/lib/format";
import type { OrderT } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500 border-amber-500/40",
  CONFIRMED: "bg-sky-500/15 text-sky-500 border-sky-500/40",
  SHIPPED: "bg-violet-500/15 text-violet-500 border-violet-500/40",
  DELIVERED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
  CANCELLED: "bg-red-500/15 text-red-500 border-red-500/40",
};

export function UserPanelView() {
  const { user, logout } = useAuth();
  const nav = useNav();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderT[] | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    } else setOrders([]);
  }, []);

  useEffect(() => {
    if (user) loadOrders();
  }, [user, loadOrders]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // profile updates ride on orders endpoint contract? no — dedicated light endpoint
      const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: user.name, phone: user.phone, address: user.address, city: user.city }) });
      if (!res.ok) throw new Error("failed");
      toast({ title: "Profile saved" });
    } catch {
      toast({ title: "Could not save profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    nav.navigate({ name: "auth", mode: "login" });
    return null;
  }

  const spent = (orders || []).filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen pt-28 lg:pt-36 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs tracking-[0.45em] uppercase text-gold mb-2">Member Lounge</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold">
            Salam, <span className="gold-text italic">{user.name.split(" ")[0]}</span>
          </h1>
        </motion.div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Orders", value: String(orders?.length ?? "—") },
            { label: "Lifetime spend", value: orders ? formatPKR(spent) : "—" },
            { label: "Member since", value: "2024" },
          ].map((s) => (
            <div key={s.label} className="luxury-card gold-border rounded-2xl p-5 text-center">
              <p className="font-display text-2xl sm:text-3xl font-semibold text-gold truncate">{s.value}</p>
              <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* profile card */}
          <motion.aside initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="luxury-card gold-border rounded-3xl p-6 h-fit">
            <p className="text-xs tracking-[0.3em] uppercase text-gold mb-5">Profile</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="p-name">Name</label>
                <Input id="p-name" value={user.name} onChange={(e) => useAuth.setState({ user: { ...user, name: e.target.value } })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="p-phone">Phone</label>
                <Input id="p-phone" value={user.phone || ""} onChange={(e) => useAuth.setState({ user: { ...user, phone: e.target.value } })} placeholder="+92 …" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="p-addr">Default address</label>
                <Input id="p-addr" value={user.address || ""} onChange={(e) => useAuth.setState({ user: { ...user, address: e.target.value } })} placeholder="House / Street" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="p-city">City</label>
                <Input id="p-city" value={user.city || ""} onChange={(e) => useAuth.setState({ user: { ...user, city: e.target.value } })} placeholder="Karachi" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                <Mail className="w-4 h-4 text-gold" /> {user.email}
              </div>
              <Button onClick={saveProfile} disabled={saving} className="w-full bg-gold text-noir hover:bg-gold/90 rounded-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save profile"}
              </Button>
              <Button variant="outline" onClick={async () => { await logout(); nav.navigate({ name: "home" }); }} className="w-full rounded-full border-border">
                Sign out
              </Button>
            </div>
          </motion.aside>

          {/* orders */}
          <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
            <p className="text-xs tracking-[0.3em] uppercase text-gold mb-5 flex items-center gap-2">
              <Package className="w-4 h-4" /> Order history
            </p>
            {orders === null ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="luxury-card rounded-3xl p-10 text-center">
                <Package className="w-10 h-10 text-gold/50 mx-auto mb-4" />
                <p className="font-display text-xl mb-2">No orders yet</p>
                <p className="text-sm text-muted-foreground mb-6">Your fragrance journey starts with the first bottle.</p>
                <Button onClick={() => nav.navigate({ name: "shop" })} className="bg-gold text-noir hover:bg-gold/90 rounded-full px-8">
                  Explore the Boutique
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="luxury-card rounded-3xl overflow-hidden">
                    <button
                      className="w-full p-5 flex items-center gap-4 text-left"
                      onClick={() => setOpenOrder(openOrder === o.id ? null : o.id)}
                      aria-expanded={openOrder === o.id}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <p className="font-semibold text-gold">{o.orderNumber}</p>
                          <Badge variant="outline" className={`${STATUS_COLORS[o.status] || ""} text-[10px] tracking-wider`}>
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""} · {formatPKR(o.total)}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${openOrder === o.id ? "rotate-90" : ""}`} />
                    </button>
                    {openOrder === o.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-gold/15">
                        <div className="p-5 space-y-4">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                                {it.image && <Image src={it.image} alt={it.name} fill className="object-cover" sizes="48px" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{it.name}</p>
                                <p className="text-xs text-muted-foreground">{it.size} × {it.quantity}</p>
                              </div>
                              <p className="text-sm text-gold">{formatPKR(it.price * it.quantity)}</p>
                            </div>
                          ))}
                          <Separator className="bg-gold/15" />
                          <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                            <p className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" /> {o.address}, {o.city}</p>
                            <p className="flex items-start gap-2"><Phone className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" /> {o.phone} · {o.paymentMethod}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
