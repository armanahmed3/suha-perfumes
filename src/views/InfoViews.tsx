"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, MapPin, Phone, Droplets, Gem, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Reveal } from "@/components/layout/ViewTransition";
import { useNav } from "@/lib/store";

const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), { ssr: false });

export function AboutView() {
  const nav = useNav();
  return (
    <div className="pb-24">
      {/* hero */}
      <section className="relative min-h-[62vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-50"><HeroScene liquidColor="#C9A227" /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-xs tracking-[0.5em] uppercase text-gold mb-5">Est. Karachi, Pakistan</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="font-display text-5xl sm:text-7xl font-semibold leading-tight">
            The House of <span className="gold-text italic">SUHA</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            سحا — an impression of beauty. We bottle the world&rsquo;s most coveted fragrances for the people of Pakistan.
          </motion.p>
        </div>
      </section>

      {/* story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-gold/20 to-transparent blur-2xl rounded-full" aria-hidden="true" />
            <div className="relative luxury-card gold-border rounded-[2rem] overflow-hidden">
              <Image src="/images/products/office-4-men-large.jpg" alt="SUHA flacon on silk" width={864} height={1152} className="w-full h-auto object-cover" />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">Our Story</p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold leading-tight">Luxury, <span className="gold-text italic">democratised</span></h2>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              SUHA Perfumes was born from a simple belief — the joy of an iconic fragrance shouldn&rsquo;t cost a fortune.
              From our atelier in Karachi, we craft <strong className="text-gold">impressions</strong> of the world&rsquo;s
              most celebrated scents: Sauvage, Bleu de Chanel, Gucci Bloom, 212 Men and twenty more icons.
            </p>
            <p>
              Each composition is blended with high oil concentration, matured, and bottled by hand — in a{" "}
              <strong className="text-gold">Petite 35ml</strong> travel spray or a <strong className="text-gold">Grand 100ml</strong> frosted
              flacon. Same scent, same performance, honest pricing.
            </p>
            <p>
              Follow our journey of <strong className="text-gold">Mushk e Suha</strong>, new editions and behind-the-scenes
              blending on Instagram and Facebook.
            </p>
          </div>
          <div className="mt-8 flex gap-3">
            <a href="https://www.instagram.com/suhaperfumes/" target="_blank" rel="noopener noreferrer" className="luxury-card rounded-full px-5 py-3 flex items-center gap-2.5 text-sm hover:!border-gold">
              <Instagram className="w-4 h-4 text-gold" /> @suhaperfumes
            </a>
            <a href="https://www.facebook.com/Suhaperfumes/" target="_blank" rel="noopener noreferrer" className="luxury-card rounded-full px-5 py-3 flex items-center gap-2.5 text-sm hover:!border-gold">
              <Facebook className="w-4 h-4 text-gold" /> Suhaperfumes
            </a>
          </div>
        </Reveal>
      </section>

      {/* values */}
      <section className="border-y border-gold/15 bg-noir/40 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">Why SUHA</p>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold">Crafted on <span className="gold-text italic">principles</span></h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Droplets, t: "High oil concentration", d: "Rich, matured blends that project and last through Pakistani summers." },
              { icon: Gem, t: "Honest luxury", d: "Icon-level scents from PKR 1,099 — no import markups, no pretence." },
              { icon: HeartHandshake, t: "Concierge care", d: "Real humans on WhatsApp and phone, from order to doorstep." },
            ].map((v, i) => (
              <Reveal key={v.t} delay={i * 0.12}>
                <div className="luxury-card gold-border rounded-3xl p-8 text-center h-full">
                  <span className="w-14 h-14 mx-auto rounded-full bg-gold/12 border border-gold/40 flex items-center justify-center mb-5">
                    <v.icon className="w-6 h-6 text-gold" />
                  </span>
                  <p className="font-display text-2xl font-semibold mb-3">{v.t}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* visit */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-semibold mb-8">Visit or <span className="gold-text italic">call us</span></h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: MapPin, label: "Atelier", value: "Karachi, Pakistan" },
              { icon: Phone, label: "Phone / WhatsApp", value: "+92 323 2556620" },
              { icon: Instagram, label: "Social", value: "@suhaperfumes" },
            ].map((c) => (
              <div key={c.label} className="luxury-card rounded-2xl p-6">
                <c.icon className="w-5 h-5 text-gold mx-auto mb-3" />
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{c.label}</p>
                <p className="mt-1.5 font-medium">{c.value}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => nav.navigate({ name: "shop" })} className="mt-10 bg-gold text-noir hover:bg-gold/90 rounded-full px-10 h-12 tracking-[0.18em] uppercase">
            Discover the collection
          </Button>
        </Reveal>
      </section>
    </div>
  );
}

export function ContactView() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
    } catch {
      toast({ title: "Could not send", description: "Please WhatsApp us instead.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 lg:pt-36 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.45em] uppercase text-gold mb-3">We&rsquo;re listening</p>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold">Concierge <span className="gold-text italic">Desk</span></h1>
          <div className="gold-line w-40 mx-auto mt-6" />
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {[
              { icon: Phone, t: "Call or WhatsApp", v: "+92 323 2556620", href: "tel:+923232556620" },
              { icon: Instagram, t: "Instagram", v: "@suhaperfumes", href: "https://www.instagram.com/suhaperfumes/" },
              { icon: Facebook, t: "Facebook", v: "Suhaperfumes", href: "https://www.facebook.com/Suhaperfumes/" },
              { icon: MapPin, t: "Atelier", v: "Karachi, Pakistan", href: undefined },
            ].map((c) => (
              <a key={c.t} href={c.href} target={c.href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`luxury-card gold-border rounded-2xl p-5 flex items-center gap-4 ${c.href ? "cursor-pointer" : "cursor-default"}`}>
                <span className="w-11 h-11 rounded-full bg-gold/12 border border-gold/40 flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-gold" />
                </span>
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{c.t}</p>
                  <p className="font-medium mt-0.5">{c.v}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="lg:col-span-3">
            {sent ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="luxury-card gold-border rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center">
                <HeartHandshake className="w-10 h-10 text-gold mb-5" />
                <p className="font-display text-2xl font-semibold mb-2">Message received</p>
                <p className="text-muted-foreground text-sm">Our concierge will reply within one working day.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="luxury-card gold-border rounded-3xl p-7 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="c-name" className="text-xs uppercase tracking-wider text-muted-foreground">Name *</label>
                    <Input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="c-email" className="text-xs uppercase tracking-wider text-muted-foreground">Email *</label>
                    <Input id="c-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="c-subject" className="text-xs uppercase tracking-wider text-muted-foreground">Subject</label>
                  <Input id="c-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Wholesale, order help…" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="c-msg" className="text-xs uppercase tracking-wider text-muted-foreground">Message *</label>
                  <textarea
                    id="c-msg"
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="flex w-full rounded-xl border border-input bg-card/60 px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                    placeholder="Salam! I'd like to know about…"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-gold text-noir hover:bg-gold/90 tracking-[0.18em] uppercase text-sm">
                  {loading ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
