"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, User, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useNav } from "@/lib/store";

export function AuthView({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const { toast } = useToast();
  const nav = useNav();
  const auth = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email: form.email, password: form.password } : form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      auth.setUser(data.user);
      toast({ title: mode === "login" ? `Welcome back, ${data.user.name}` : `Welcome to SUHA, ${data.user.name}`, description: "You are signed in." });
      nav.navigate(data.user.role === "ADMIN" ? { name: "admin" } : { name: "home" });
    } catch (err) {
      toast({ title: "Sign in failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16 relative overflow-hidden">
      {/* ambient */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gold/8 blur-[120px] animate-glow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="luxury-card gold-border rounded-[2rem] p-8 sm:p-10">
          <div className="text-center mb-8">
            <Sparkles className="w-7 h-7 text-gold mx-auto mb-3" />
            <h1 className="font-display text-3xl font-semibold">
              {mode === "login" ? "Welcome back" : "Join the circle"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login" ? "Sign in to track orders & manage your collection." : "Create an account for faster checkout & order tracking."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="pl-9" placeholder="Ayesha Khan" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-9" placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pl-9" placeholder="+92 3XX XXXXXXX" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-9"
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-gold text-noir hover:bg-gold/90 text-sm tracking-[0.2em] uppercase font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              {mode === "login" ? "New to SUHA? Create an account" : "Already a member? Sign in"}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
