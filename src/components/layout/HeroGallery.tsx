"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Cinematic hero gallery built from the real SUHA product photography (zip photos,
 * shown with their own satin-studio backgrounds). Auto-rotates with a crossfade,
 * floats with a gentle drift and reacts to the pointer with a soft parallax tilt.
 */

// curated rotation of the real photos → display name
const SHOTS: { src: string; name: string; tag: string }[] = [
  { src: "/images/products/gucchi-guilty-large.jpg", name: "Gucchi Guilty", tag: "Grand 50ml · For Him" },
  { src: "/images/products/office-4-men-large.jpg", name: "Office For Man", tag: "Grand 50ml · For Him" },
  { src: "/images/products/sweet-lavendar-small.jpg", name: "Sweet Lavender", tag: "Petite 15ml · For Her" },
  { src: "/images/products/guchi-bloom-large.jpg", name: "Guchi Bloom", tag: "Grand 50ml · For Her" },
  { src: "/images/products/212-men-small.jpg", name: "212 Men", tag: "Petite 15ml · For Him" },
  { src: "/images/products/gucchi-flora-large.jpg", name: "Gucchi Flora", tag: "Grand 50ml · For Her" },
  { src: "/images/products/zara-large.jpg", name: "Zara For Him", tag: "Grand 50ml · For Him" },
  { src: "/images/products/tommy-hilfiger-large.jpg", name: "Tommy Hilfiger", tag: "Grand 50ml · For Him" },
  { src: "/images/products/aqva-bulgari-large.jpg", name: "Aqva Bulgari", tag: "Grand 50ml · For Him" },
  { src: "/images/products/hugo-boss-small.jpg", name: "Hugo Boss", tag: "Petite 15ml · For Him" },
];

const DWELL_MS = 4200;

export function HeroGallery() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // pointer parallax (springy)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 18 });
  const sy = useSpring(my, { stiffness: 55, damping: 18 });
  const tiltX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const tiltY = useTransform(sx, [-0.5, 0.5], [-8, 8]);
  const shiftX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const shiftY = useTransform(sy, [-0.5, 0.5], [-9, 9]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SHOTS.length), DWELL_MS);
    return () => clearInterval(t);
  }, [paused]);

  const current = SHOTS[index];
  const prev = SHOTS[(index - 1 + SHOTS.length) % SHOTS.length];
  const next = SHOTS[(index + 1) % SHOTS.length];

  return (
    <div
      ref={wrapRef}
      className="relative h-[400px] sm:h-[480px] lg:h-[560px] w-full max-w-[560px] mx-auto select-none"
      style={{ perspective: 1200 }}
      onMouseMove={(e) => {
        const r = wrapRef.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        mx.set(0);
        my.set(0);
      }}
    >
      {/* floating side cards — previous / next shot */}
      <motion.div style={{ x: shiftX, y: shiftY }} className="absolute inset-0" aria-hidden="true">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-[15%] w-[34%] sm:w-[38%] aspect-[3/4] rounded-2xl overflow-hidden gold-border luxury-card -rotate-[9deg]"
        >
          <Image src={prev.src} alt="" fill sizes="200px" className="object-cover scale-110 blur-[1.5px] brightness-[0.7]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-[7%] w-[34%] sm:w-[38%] aspect-[3/4] rounded-2xl overflow-hidden gold-border luxury-card rotate-[9deg]"
        >
          <Image src={next.src} alt="" fill sizes="200px" className="object-cover scale-110 blur-[1.5px] brightness-[0.7]" />
        </motion.div>
      </motion.div>

      {/* main stage — outer div handles centering, inner motion handles parallax + float */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[54%] sm:w-[58%]" style={{ transformStyle: "preserve-3d" }}>
        <motion.div style={{ x: shiftX, y: shiftY, rotateY: tiltY, rotateX: tiltX, transformStyle: "preserve-3d" }}>
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative aspect-[3/4] rounded-3xl overflow-hidden gold-border luxury-card shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)]"
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={current.src}
                initial={{ opacity: 0, scale: 1.09 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={current.src}
                  alt={`SUHA Perfumes — Impression of ${current.name}`}
                  fill
                  priority
                  sizes="(max-width:1024px) 60vw, 340px"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* bottom caption */}
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-noir/85 via-noir/35 to-transparent">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="font-display text-lg sm:text-2xl font-semibold text-white leading-tight">
                    Impression of <span className="gold-text italic">{current.name}</span>
                  </p>
                  <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-gold-light/80 mt-1">{current.tag}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* progress dots */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" role="tablist" aria-label="Hero gallery navigation">
        {SHOTS.map((s, i) => (
          <button
            key={s.src}
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${s.name}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-gold" : "w-1.5 bg-gold/30 hover:bg-gold/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
