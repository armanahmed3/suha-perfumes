"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { View } from "@/lib/types";

/**
 * Cinematic view transition: a gold light-sweep + soft depth fade
 * between every "page" of the SPA.
 */
export function ViewTransition({ viewKey, children }: { viewKey: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* sweeping gold curtain */}
      <AnimatePresence>
        <motion.div
          key={`sweep-${viewKey}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: [0, 1, 0] }}
          transition={{ duration: 0.9, times: [0, 0.45, 1], ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-y-0 left-0 right-0 z-[70] pointer-events-none origin-left"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--gold) 14%, transparent) 35%, color-mix(in srgb, var(--gold-light) 22%, transparent) 50%, color-mix(in srgb, var(--gold) 14%, transparent) 65%, transparent 100%)",
          }}
          aria-hidden="true"
        />
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewKey}
          initial={{ opacity: 0, y: 28, scale: 0.99, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -22, scale: 1.005, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1200 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Section reveal on scroll */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export type { View };
