"use client";

import Image from "next/image";
import { Facebook, Instagram, Phone, MapPin, Mail } from "lucide-react";
import { useNav } from "@/lib/store";

export function Footer() {
  const nav = useNav();
  const year = new Date().getFullYear();

  const shopLinks = [
    { label: "For Him", view: { name: "shop", gender: "Men" } as const },
    { label: "For Her", view: { name: "shop", gender: "Women" } as const },
    { label: "All Fragrances", view: { name: "shop" } as const },
  ];

  return (
    <footer className="mt-auto border-t border-gold/15 bg-noir/95 text-[#f3ecdd] dark:bg-noir light:bg-noir">
      {/* gold top line */}
      <div className="gold-line" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          {/* brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="relative w-12 h-12">
                <Image src="/images/logo-gold.png" alt="SUHA Perfumes" fill className="object-contain" sizes="48px" />
              </span>
              <div className="leading-none">
                <p className="font-display text-2xl font-semibold tracking-[0.18em] gold-text">SUHA</p>
                <p className="text-[9px] tracking-[0.5em] uppercase text-[#f3ecdd]/50">Perfumes</p>
              </div>
            </div>
            <p className="text-sm text-[#f3ecdd]/60 leading-relaxed">
              Luxury impression fragrances, hand-blended in Karachi. Iconic scents, honest prices — in Petite 35ml &amp; Grand 100ml.
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="https://www.instagram.com/suhaperfumes/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SUHA Perfumes on Instagram"
                className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-noir transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/Suhaperfumes/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SUHA Perfumes on Facebook"
                className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-noir transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* shop */}
          <nav aria-label="Shop">
            <h3 className="font-display text-lg tracking-[0.2em] uppercase text-gold mb-4">Boutique</h3>
            <ul className="space-y-2.5 text-sm text-[#f3ecdd]/60">
              {shopLinks.map((l) => (
                <li key={l.label}>
                  <button onClick={() => nav.navigate(l.view)} className="hover:text-gold transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => nav.navigate({ name: "about" })} className="hover:text-gold transition-colors">
                  Our Story
                </button>
              </li>
              <li>
                <button onClick={() => nav.navigate({ name: "contact" })} className="hover:text-gold transition-colors">
                  Contact
                </button>
              </li>
            </ul>
          </nav>

          {/* service */}
          <div>
            <h3 className="font-display text-lg tracking-[0.2em] uppercase text-gold mb-4">Service</h3>
            <ul className="space-y-2.5 text-sm text-[#f3ecdd]/60">
              <li>Cash on Delivery — nationwide</li>
              <li>Free shipping over PKR 4,000</li>
              <li>Authenticity guaranteed</li>
              <li>Exchange within 7 days</li>
              <li>
                <button onClick={() => nav.navigate({ name: "auth", mode: "register" })} className="hover:text-gold transition-colors">
                  Create an account
                </button>
              </li>
            </ul>
          </div>

          {/* contact */}
          <address className="not-italic">
            <h3 className="font-display text-lg tracking-[0.2em] uppercase text-gold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-[#f3ecdd]/60">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a href="tel:+923232556620" className="hover:text-gold transition-colors">+92 323 2556620</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a href="mailto:hello@suhaperfumes.com" className="hover:text-gold transition-colors">hello@suhaperfumes.com</a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-gold shrink-0" />
                Karachi, Pakistan
              </li>
            </ul>
          </address>
        </div>

        <div className="mt-12 pt-6 border-t border-gold/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#f3ecdd]/40">
          <p>© {year} SUHA Perfumes · Karachi, Pakistan. All rights reserved.</p>
          <p className="tracking-[0.25em] uppercase">Crafted with passion · Impressions of icons</p>
        </div>
      </div>
    </footer>
  );
}
