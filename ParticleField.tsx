"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuraStore } from "@/lib/store";

interface Particle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
  hue: "primary" | "secondary";
}

export default function ParticleField({ count = 26 }: { count?: number }) {
  const color = useAuraStore((s) => s.aura.color);
  const secondaryColor = useAuraStore((s) => s.aura.secondaryColor);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 5,
        duration: 10 + Math.random() * 14,
        delay: Math.random() * -20,
        driftX: (Math.random() - 0.5) * 60,
        driftY: -(40 + Math.random() * 80),
        opacity: 0.15 + Math.random() * 0.35,
        hue: Math.random() > 0.5 ? "primary" : "secondary",
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.hue === "primary" ? color : secondaryColor,
            opacity: p.opacity,
          }}
          animate={{
            x: [0, p.driftX, 0],
            y: [0, p.driftY, 0],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
