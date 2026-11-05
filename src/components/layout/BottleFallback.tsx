"use client";

import { motion } from "framer-motion";

type Props = {
  liquidColor: string;
  size?: "small" | "large";
  label?: string;
  className?: string;
};

/**
 * Elegant vector bottle render for fragrances that don't have a studio photo yet.
 * Mirrors the real SUHA flacons: clear spray bottle (small) / frosted flacon (large),
 * tinted with the fragrance's own liquid colour.
 */
export function BottleFallback({ liquidColor, size = "large", label, className = "" }: Props) {
  const isSmall = size === "small";

  return (
    <div className={`relative flex items-end justify-center overflow-hidden ${className}`}>
      {/* ambient glow tinted by liquid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 72%, ${liquidColor}33, transparent 62%)` }}
        aria-hidden="true"
      />
      {/* silk-like background sheen (echoes the real photos' satin backdrop) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, transparent 38%, rgba(0,0,0,0.18) 100%)" }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
        style={{ width: isSmall ? "30%" : "44%" }}
      >
        <svg viewBox="0 0 120 220" className="w-full h-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]" role="img" aria-label={label ? `${label} bottle` : "Perfume bottle"}>
          <defs>
            <linearGradient id={`liquid-${isSmall ? "s" : "l"}-${liquidColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={liquidColor} stopOpacity="0.92" />
              <stop offset="55%" stopColor={liquidColor} />
              <stop offset="100%" stopColor={liquidColor} stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id={`glass-${isSmall ? "s" : "l"}-${liquidColor.replace("#", "")}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="28%" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="78%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.30" />
            </linearGradient>
            <linearGradient id={`cap-${isSmall ? "s" : "l"}`} x1="0" y1="0" x2="1" y2="0">
              {isSmall ? (
                <>
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#e9e9e4" />
                  <stop offset="100%" stopColor="#cfcfc8" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#e8e8ee" />
                  <stop offset="35%" stopColor="#b9b9c4" />
                  <stop offset="60%" stopColor="#9a9aa6" />
                  <stop offset="100%" stopColor="#d9d9e2" />
                </>
              )}
            </linearGradient>
          </defs>

          {isSmall ? (
            <>
              {/* pump cap */}
              <rect x="44" y="4" width="32" height="14" rx="4" fill="url(#cap-s)" />
              <rect x="38" y="20" width="44" height="30" rx="6" fill="url(#cap-s)" />
              {/* bottle body */}
              <path d="M30 62 C30 54 36 50 60 50 C84 50 90 54 90 62 L90 196 C90 208 82 214 60 214 C38 214 30 208 30 196 Z" fill={`url(#liquid-s-${liquidColor.replace("#", "")})`} />
              <path d="M30 62 C30 54 36 50 60 50 C84 50 90 54 90 62 L90 196 C90 208 82 214 60 214 C38 214 30 208 30 196 Z" fill={`url(#glass-s-${liquidColor.replace("#", "")})`} />
              {/* neck seam */}
              <rect x="36" y="50" width="48" height="5" rx="2.5" fill="#ffffff" opacity="0.35" />
              {/* SUHA label */}
              <text x="60" y="118" textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill="#2b2417" fontFamily="Georgia, serif">SUHA</text>
              <text x="60" y="133" textAnchor="middle" fontSize="6.5" letterSpacing="3.5" fill="#2b2417" opacity="0.75" fontFamily="Georgia, serif">PERFUMES</text>
              <line x1="42" y1="140" x2="78" y2="140" stroke="#2b2417" strokeWidth="0.6" opacity="0.4" />
            </>
          ) : (
            <>
              {/* silver cap */}
              <rect x="44" y="6" width="32" height="34" rx="5" fill="url(#cap-l)" />
              <rect x="44" y="6" width="32" height="34" rx="5" fill="#ffffff" opacity="0.12" />
              {/* frosted flacon */}
              <path d="M24 74 C24 58 38 46 60 46 C82 46 96 58 96 74 L96 194 C96 208 84 216 60 216 C36 216 24 208 24 194 Z" fill="#eef0ea" opacity="0.30" />
              <path d="M28 92 C28 84 36 78 60 78 C84 78 92 84 92 92 L92 192 C92 204 82 210 60 210 C38 210 28 204 28 192 Z" fill={`url(#liquid-l-${liquidColor.replace("#", "")})`} opacity="0.85" />
              <path d="M24 74 C24 58 38 46 60 46 C82 46 96 58 96 74 L96 194 C96 208 84 216 60 216 C36 216 24 208 24 194 Z" fill={`url(#glass-l-${liquidColor.replace("#", "")})`} />
              {/* SUHA label */}
              <text x="60" y="124" textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill="#8d1f24" fontFamily="Georgia, serif">SUHA</text>
              <text x="60" y="138" textAnchor="middle" fontSize="6.5" letterSpacing="3.5" fill="#8d1f24" opacity="0.8" fontFamily="Georgia, serif">PERFUMES</text>
            </>
          )}
        </svg>

        {/* soft reflection under the bottle */}
        <div
          className="mx-auto mt-1 h-3 w-3/4 rounded-[100%] blur-md"
          style={{ background: `${liquidColor}44` }}
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
}
