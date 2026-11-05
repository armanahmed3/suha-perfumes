"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, BadgeDollarSign, Boxes, Loader2, Mail, Package, Pencil,
  Plus, Settings as SettingsIcon, ShoppingBag, Trash2, TrendingUp, Users, X, Star,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useNav } from "@/lib/store";
import { formatPKR, formatDate } from "@/lib/format";
import type { OrderT, Product, Settings } from "@/lib/types";

type Stats = {
  revenue: number; orderCount: number; productCount: number; userCount: number; pendingOrders: number;
  recentOrders: OrderT[];
  topProducts: { name: string; qty: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
};

type AdminProduct = Product & { variants: { id: string; size: string; label: string; price: number; oldPrice: number | null; stock: number; image: string | null; active: boolean }[] };

type AdminUser = { id: string; name: string; email: string; role: string; phone: string | null; city: string | null; createdAt: string; orderCount: number; totalSpent: number };
type Message = { id: string; name: string; email: string; subject: string | null; message: string; read: boolean; createdAt: string };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500 border-amber-500/40",
  CONFIRMED: "bg-sky-500/15 text-sky-500 border-sky-500/40",
  SHIPPED: "bg-violet-500/15 text-violet-500 border-violet-500/40",
  DELIVERED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
  CANCELLED: "bg-red-500/15 text-red-500 border-red-500/40",
};
const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export function AdminPanelView() {
  const { user } = useAuth();
  const nav = useNav();
  const { toast } = useToast();

  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [orders, setOrders] = useState<OrderT[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [orderFilter, setOrderFilter] = useState("ALL");

  // product edit dialog
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  const loadAll = useCallback(async () => {
    const [s, p, o, u, m, st] = await Promise.all([
      fetch("/api/admin/stats", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/products", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/orders", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/users", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/messages", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/settings", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]);
    setStats(s ? s : null);
    setProducts(p ? p.products : []);
    setOrders(o ? o.orders : []);
    setUsers(u ? u.users : []);
    setMessages(m ? m.messages : []);
    setSettings(st ? st.settings : null);
  }, []);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    // defer the fetch out of the effect body (avoids cascading setState warnings)
    const t = setTimeout(() => {
      loadAll();
    }, 0);
    return () => clearTimeout(t);
  }, [user, loadAll]);

  if (!user || user.role !== "ADMIN") {
    nav.navigate({ name: "auth", mode: "login" });
    return null;
  }

  const updateOrderStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setOrders((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) || null);
      toast({ title: `Order marked ${status.toLowerCase()}` });
      loadAll();
    } else toast({ title: "Update failed", variant: "destructive" });
  };

  const toggleProductActive = async (p: AdminProduct) => {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
    if (res.ok) {
      setProducts((prev) => prev?.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)) || null);
      toast({ title: p.active ? "Product hidden from boutique" : "Product published" });
    }
  };

  const deleteProduct = async (p: AdminProduct) => {
    if (!confirm(`Delete "${p.name}" permanently?`)) return;
    const res = await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev?.filter((x) => x.id !== p.id) || null);
      toast({ title: "Product deleted" });
    } else toast({ title: "Delete failed", variant: "destructive" });
  };

  const markRead = async (m: Message) => {
    const res = await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, read: true }),
    });
    if (res.ok) setMessages((prev) => prev?.map((x) => (x.id === m.id ? { ...x, read: true } : x)) || null);
  };

  const saveSettings = async () => {
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    toast(res.ok ? { title: "Settings saved" } : { title: "Save failed", variant: "destructive" });
  };

  const filteredOrders = (orders || []).filter((o) => orderFilter === "ALL" || o.status === orderFilter);

  return (
    <div className="min-h-screen pt-28 lg:pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.45em] uppercase text-gold mb-2">Command Center</p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold">SUHA <span className="gold-text italic">Admin</span></h1>
          </div>
          <Button onClick={() => { setEditing(null); setCreating(true); }} className="bg-gold text-noir hover:bg-gold/90 rounded-full">
            <Plus className="w-4 h-4 mr-2" /> New product
          </Button>
        </motion.div>

        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="glass-panel rounded-full p-1 h-auto flex-wrap justify-start w-full">
            {[
              { v: "dashboard", icon: BarChart3, label: "Dashboard" },
              { v: "orders", icon: ShoppingBag, label: "Orders" },
              { v: "products", icon: Boxes, label: "Products" },
              { v: "users", icon: Users, label: "Users" },
              { v: "messages", icon: Mail, label: "Messages" },
              { v: "settings", icon: SettingsIcon, label: "Settings" },
            ].map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="rounded-full px-4 py-2 data-[state=active]:bg-gold data-[state=active]:text-noir text-xs sm:text-sm">
                <t.icon className="w-4 h-4 mr-1.5 inline" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ============ DASHBOARD ============ */}
          <TabsContent value="dashboard" className="space-y-8">
            {!stats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Revenue", value: formatPKR(stats.revenue), icon: BadgeDollarSign },
                    { label: "Orders", value: String(stats.orderCount), icon: ShoppingBag },
                    { label: "Pending", value: String(stats.pendingOrders), icon: Package },
                    { label: "Customers", value: String(stats.userCount), icon: Users },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="luxury-card gold-border rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{s.label}</p>
                        <s.icon className="w-4 h-4 text-gold" />
                      </div>
                      <p className="font-display text-2xl xl:text-3xl font-semibold text-gold mt-2 truncate">{s.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                  {/* revenue chart */}
                  <div className="lg:col-span-3 luxury-card gold-border rounded-3xl p-6">
                    <p className="text-xs tracking-[0.3em] uppercase text-gold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Revenue · last 6 months</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.monthlyRevenue}>
                          <defs>
                            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                          <ChartTooltip formatter={(v) => formatPKR(Number(v))} contentStyle={{ background: "var(--card)", border: "1px solid var(--gold)", borderRadius: 12, color: "var(--foreground)" }} />
                          <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2} fill="url(#goldFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* top products */}
                  <div className="lg:col-span-2 luxury-card gold-border rounded-3xl p-6">
                    <p className="text-xs tracking-[0.3em] uppercase text-gold mb-4 flex items-center gap-2"><Star className="w-4 h-4" /> Top sellers</p>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                      {stats.topProducts.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
                      {stats.topProducts.map((p, i) => (
                        <div key={p.name} className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.qty} sold</p>
                          </div>
                          <p className="text-sm text-gold font-semibold">{formatPKR(p.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* recent orders */}
                <div className="luxury-card gold-border rounded-3xl p-6">
                  <p className="text-xs tracking-[0.3em] uppercase text-gold mb-4">Latest orders</p>
                  {stats.recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet — they will appear here in real time.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentOrders.map((o) => (
                        <div key={o.id} className="flex flex-wrap items-center gap-3 py-2 border-b border-border/50 last:border-0">
                          <p className="font-semibold text-gold text-sm w-32">{o.orderNumber}</p>
                          <p className="text-sm flex-1 min-w-32">{o.customerName} <span className="text-muted-foreground">· {o.city}</span></p>
                          <Badge variant="outline" className={`${STATUS_COLORS[o.status]} text-[10px]`}>{o.status}</Badge>
                          <p className="text-sm font-semibold w-28 text-right">{formatPKR(o.total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ============ ORDERS ============ */}
          <TabsContent value="orders">
            <div className="flex flex-wrap gap-2 mb-6">
              {["ALL", ...STATUSES].map((s) => (
                <button key={s} onClick={() => setOrderFilter(s)} className={`px-4 py-2 rounded-full text-xs tracking-wider uppercase border transition-colors ${orderFilter === s ? "bg-gold text-noir border-gold font-semibold" : "border-border text-muted-foreground hover:text-gold"}`}>
                  {s}
                </button>
              ))}
            </div>
            {!orders ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-16">No orders in this state.</p>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((o) => (
                  <div key={o.id} className="luxury-card rounded-2xl p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-44">
                        <div className="flex items-center gap-2.5">
                          <p className="font-semibold text-gold">{o.orderNumber}</p>
                          <Badge variant="outline" className={`${STATUS_COLORS[o.status]} text-[10px]`}>{o.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(o.createdAt)} · {o.customerName} · {o.phone} · {o.city}</p>
                        <p className="text-xs text-muted-foreground">{o.items.map((it) => `${it.name} (${it.size})×${it.quantity}`).join(", ")}</p>
                      </div>
                      <p className="font-display text-xl font-semibold text-gold">{formatPKR(o.total)}</p>
                      <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                        <SelectTrigger className="w-40" aria-label="Order status"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ PRODUCTS ============ */}
          <TabsContent value="products">
            {!products ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : (
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {products.map((p) => (
                  <div key={p.id} className="luxury-card rounded-2xl p-4 flex flex-wrap items-center gap-4">
                    <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {(p.variants[1]?.image || p.variants[0]?.image) && (
                        <Image src={p.variants[1]?.image || p.variants[0]?.image || ""} alt={p.name} fill className="object-cover" sizes="56px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-40">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{p.name}</p>
                        {p.featured && <Badge className="bg-gold/20 text-gold border-gold/40 text-[10px]">Featured</Badge>}
                        {!p.active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Hidden</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.brand} · {p.gender} · {p.variants.map((v) => `${v.label} ${formatPKR(v.price)} (${v.stock})`).join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={p.active} onCheckedChange={() => toggleProductActive(p)} aria-label="Toggle visible" />
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => { setEditing(p); setCreating(false); }} aria-label="Edit product">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteProduct(p)} aria-label="Delete product">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ USERS ============ */}
          <TabsContent value="users">
            {!users ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            ) : (
              <div className="luxury-card gold-border rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gold/20 text-left text-xs tracking-[0.2em] uppercase text-muted-foreground">
                        <th className="p-4">Customer</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Orders</th>
                        <th className="p-4">Spent</th>
                        <th className="p-4">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-gold/5 transition-colors">
                          <td className="p-4 font-medium">{u.name}</td>
                          <td className="p-4 text-muted-foreground">{u.email}{u.phone ? ` · ${u.phone}` : ""}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={u.role === "ADMIN" ? "border-gold/50 text-gold" : "text-muted-foreground"}>{u.role}</Badge>
                          </td>
                          <td className="p-4">{u.orderCount}</td>
                          <td className="p-4 text-gold font-semibold">{formatPKR(u.totalSpent)}</td>
                          <td className="p-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ============ MESSAGES ============ */}
          <TabsContent value="messages">
            {!messages ? (
              <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-center py-16">No messages yet.</p>
            ) : (
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div key={m.id} className={`luxury-card rounded-2xl p-5 ${!m.read ? "border-gold/50" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{m.name} <span className="text-muted-foreground font-normal text-sm">· {m.email}</span></p>
                        {m.subject && <p className="text-sm text-gold mt-0.5">{m.subject}</p>}
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{m.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">{formatDate(m.createdAt)}</p>
                      </div>
                      {!m.read && <Button size="sm" variant="outline" onClick={() => markRead(m)} className="rounded-full shrink-0">Mark read</Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============ SETTINGS ============ */}
          <TabsContent value="settings">
            {settings && (
              <div className="luxury-card gold-border rounded-3xl p-6 max-w-2xl space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instagram URL</Label>
                    <Input value={settings.instagram} onChange={(e) => setSettings({ ...settings, instagram: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Facebook URL</Label>
                    <Input value={settings.facebook} onChange={(e) => setSettings({ ...settings, facebook: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Shipping fee (PKR)</Label>
                    <Input type="number" value={settings.shippingFee} onChange={(e) => setSettings({ ...settings, shippingFee: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Free shipping over (PKR)</Label>
                    <Input type="number" value={settings.freeShippingOver} onChange={(e) => setSettings({ ...settings, freeShippingOver: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Announcement marquee</Label>
                  <Textarea value={settings.announcement} onChange={(e) => setSettings({ ...settings, announcement: e.target.value })} rows={2} />
                </div>
                <Button onClick={saveSettings} className="bg-gold text-noir hover:bg-gold/90 rounded-full px-8">Save settings</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== Product create/edit dialog ===== */}
      <ProductDialog
        open={creating || !!editing}
        product={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        saving={savingProduct}
        setSaving={setSavingProduct}
        onSaved={() => { setCreating(false); setEditing(null); loadAll(); }}
      />
    </div>
  );
}

/* ---------------- product create/edit dialog ---------------- */
function ProductDialog({
  open, product, onClose, onSaved, saving, setSaving,
}: {
  open: boolean; product: AdminProduct | null; onClose: () => void; onSaved: () => void;
  saving: boolean; setSaving: (b: boolean) => void;
}) {
  const { toast } = useToast();
  const isNew = !product;
  const [form, setForm] = useState(() => emptyForm(product));

  useEffect(() => {
    if (open) setForm(emptyForm(product));
  }, [open, product]);

  const submit = async () => {
    setSaving(true);
    try {
      const payload = isNew
        ? {
            name: form.name, gender: form.gender, brand: form.brand, description: form.description,
            liquidColor: form.liquidColor, featured: form.featured, active: form.active,
            variants: [
              { size: "35ml", label: "Petite 35ml", price: form.priceSmall, stock: form.stockSmall, image: form.imageSmall },
              { size: "100ml", label: "Grand 100ml", price: form.priceLarge, stock: form.stockLarge, image: form.imageLarge },
            ],
          }
        : {
            id: product.id,
            name: form.name, gender: form.gender, brand: form.brand, description: form.description,
            liquidColor: form.liquidColor, featured: form.featured, active: form.active,
            variants: product.variants.map((v, i) => ({
              id: v.id,
              price: i === 0 ? form.priceSmall : form.priceLarge,
              stock: i === 0 ? form.stockSmall : form.stockLarge,
              image: i === 0 ? form.imageSmall : form.imageLarge,
            })),
          };
      const res = await fetch("/api/admin/products", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Save failed");
      }
      toast({ title: isNew ? "Product created" : "Product updated" });
      onSaved();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{isNew ? "New fragrance" : `Edit — ${product?.name}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Savauge" />
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="SUHA Impressions" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Men">For Him</SelectItem>
                  <SelectItem value="Women">For Her</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>3D liquid color</Label>
              <div className="flex gap-2">
                <input type="color" value={form.liquidColor} onChange={(e) => setForm({ ...form, liquidColor: e.target.value })} className="w-12 h-10 rounded-lg border border-border bg-card cursor-pointer" aria-label="Liquid color" />
                <Input value={form.liquidColor} onChange={(e) => setForm({ ...form, liquidColor: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs tracking-[0.25em] uppercase text-gold">Petite 35ml</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={form.priceSmall} onChange={(e) => setForm({ ...form, priceSmall: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label className="text-xs">Stock</Label><Input type="number" value={form.stockSmall} onChange={(e) => setForm({ ...form, stockSmall: Number(e.target.value) })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={form.imageSmall} onChange={(e) => setForm({ ...form, imageSmall: e.target.value })} placeholder="/images/products/…-small.jpg" /></div>
            </div>
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <p className="text-xs tracking-[0.25em] uppercase text-gold">Grand 100ml</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" value={form.priceLarge} onChange={(e) => setForm({ ...form, priceLarge: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label className="text-xs">Stock</Label><Input type="number" value={form.stockLarge} onChange={(e) => setForm({ ...form, stockLarge: Number(e.target.value) })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={form.imageLarge} onChange={(e) => setForm({ ...form, imageLarge: e.target.value })} placeholder="/images/products/…-large.jpg" /></div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /> Featured</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Visible in boutique</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-full"><X className="w-4 h-4 mr-1" /> Cancel</Button>
            <Button onClick={submit} disabled={saving || !form.name} className="bg-gold text-noir hover:bg-gold/90 rounded-full px-6">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} {isNew ? "Create product" : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function emptyForm(p: AdminProduct | null) {
  const small = p?.variants.find((v) => v.size === "35ml");
  const large = p?.variants.find((v) => v.size === "100ml") || p?.variants[0];
  return {
    name: p?.name || "",
    brand: p?.brand || "SUHA Impressions",
    gender: p?.gender || "Unisex",
    description: p?.description || "",
    liquidColor: p?.liquidColor || "#D4AF37",
    featured: p?.featured ?? false,
    active: p?.active ?? true,
    priceSmall: small?.price ?? 1099,
    stockSmall: small?.stock ?? 50,
    imageSmall: small?.image || "",
    priceLarge: large?.price ?? 2999,
    stockLarge: large?.stock ?? 40,
    imageLarge: large?.image || "",
  };
}
