"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuraStore } from "@/lib/store";
import type { AuraShape, AuraPersonality } from "@/lib/types";

interface AuraCompanionProps {
  size?: number;
  listening?: boolean;
  speaking?: boolean;
  className?: string;
  interactive?: boolean;
  overrideColor?: string;
  overrideSecondary?: string;
  overrideShape?: AuraShape;
  overridePersonality?: AuraPersonality;
}

function shapeClass(shape: AuraShape) {
  switch (shape) {
    case "orb":
      return "rounded-full";
    case "diamond":
      return "rounded-3xl";
    case "wave":
      return "animate-blob rounded-full";
    case "blob":
    default:
      return "animate-blob";
  }
}

/** Random natural blink cycle — two quick blinks occasionally, like a real gaze */
function useBlink() {
  const [closed, setClosed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;

    function scheduleNext() {
      const delay = 2600 + Math.random() * 3400;
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        setClosed(true);
        setTimeout(() => {
          if (cancelled) return;
          setClosed(false);
          if (Math.random() < 0.25) {
            setTimeout(() => {
              if (cancelled) return;
              setClosed(true);
              setTimeout(() => !cancelled && setClosed(false), 90);
            }, 130);
          }
        }, 110);
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return closed;
}

/** Subtle occasional gaze drift — eyes softly glance sideways like a curious creature */
function useGaze() {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;

    function scheduleNext() {
      const delay = 2200 + Math.random() * 2600;
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.35 + Math.random() * 0.65;
        setGaze({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.6 });
        setTimeout(() => {
          if (!cancelled) setGaze({ x: 0, y: 0 });
        }, 900 + Math.random() * 600);
        scheduleNext();
      }, delay);
    }

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return gaze;
}

export default function AuraCompanion({
  size = 180,
  listening = false,
  speaking = false,
  className = "",
  interactive = true,
  overrideColor,
  overrideSecondary,
  overrideShape,
  overridePersonality,
}: AuraCompanionProps) {
  const storeAura = useAuraStore((s) => s.aura);
  const color = overrideColor ?? storeAura.color;
  const secondaryColor = overrideSecondary ?? storeAura.secondaryColor;
  const shape = overrideShape ?? storeAura.shape;
  const personality = overridePersonality ?? storeAura.personality;
  const blinking = useBlink();
  const gaze = useGaze();

  const gradient = useMemo(
    () => `linear-gradient(140deg, ${color} 0%, ${secondaryColor} 100%)`,
    [color, secondaryColor]
  );

  const floatSpeed = personality === "energetic" ? 4 : personality === "direct" ? 7 : 6;
  const wobbleRange = personality === "energetic" ? 6 : personality === "direct" ? 2 : 4;

  const eyeW = Math.max(4, size * 0.05);
  const eyeH = Math.max(5, size * 0.068);
  const eyeGap = size * 0.15;
  const gazeRangeX = size * 0.02;
  const gazeRangeY = size * 0.014;
  const eyeScale = listening ? 1.18 : speaking ? 1.04 : 1;
  const eyeLift = listening ? -size * 0.01 : 0;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* ambient contact shadow */}
      <div
        className="absolute rounded-full bg-black/25 dark:bg-black/40 blur-xl animate-pulseGlow"
        style={{
          width: size * 0.45,
          height: size * 0.12,
          bottom: size * 0.02,
          animationDuration: "4.2s",
        }}
      />

      {/* layered outer glow */}
      <div
        className="absolute rounded-full blur-3xl animate-pulseGlow"
        style={{ inset: -size * 0.08, background: gradient, opacity: 0.35 }}
      />
      <div
        className="absolute inset-0 rounded-full blur-xl animate-pulseGlow"
        style={{ background: gradient, opacity: 0.55, animationDelay: "0.4s" }}
      />

      {/* listening rings */}
      {listening && (
        <>
          <div
            className="absolute inset-[-14px] rounded-full animate-listenPulse"
            style={{ border: `2px solid ${color}` }}
          />
          <div
            className="absolute inset-[-14px] rounded-full animate-listenPulse"
            style={{ border: `2px solid ${color}`, animationDelay: "0.5s" }}
          />
        </>
      )}

      {/* float + breathe wrapper (not rotated, so face stays upright) */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: size * 0.72, height: size * 0.72 }}
        animate={{
          y: [0, -10, 0],
          rotate: [-wobbleRange / 2, wobbleRange / 2, -wobbleRange / 2],
        }}
        transition={{ duration: floatSpeed, repeat: Infinity, ease: "easeInOut" }}
        whileHover={interactive ? { scale: 1.04 } : undefined}
      >
        {/* breathing shape body with soft squash & stretch */}
        <motion.div
          className={`absolute inset-0 shadow-2xl ${shapeClass(shape)}`}
          style={{ background: gradient }}
          animate={{
            scaleY: speaking ? [1, 1.045, 1] : [1, 1.05, 0.985, 1],
            scaleX: speaking ? [1, 0.985, 1] : [1, 0.975, 1.015, 1],
            rotate: shape === "diamond" ? 45 : 0,
          }}
          transition={{
            scaleY: { duration: speaking ? 0.5 : 4.4, repeat: Infinity, ease: "easeInOut" },
            scaleX: { duration: speaking ? 0.5 : 4.4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 0.5, ease: "easeOut" },
          }}
        >
          {/* specular highlight */}
          <div
            className="absolute inset-3 rounded-[inherit] opacity-40"
            style={{
              background: "radial-gradient(circle at 28% 24%, rgba(255,255,255,0.95), transparent 55%)",
            }}
          />
          {/* rim light */}
          <div
            className="absolute inset-0 rounded-[inherit] opacity-50"
            style={{
              boxShadow: "inset -6px -8px 16px rgba(0,0,0,0.18), inset 3px 4px 10px rgba(255,255,255,0.35)",
            }}
          />
          {/* grounded ambient occlusion */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 rounded-[inherit] opacity-30"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }}
          />
        </motion.div>

        {/* face: eyes stay upright regardless of shape rotation, with subtle gaze drift */}
        <motion.div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{ gap: eyeGap, top: "37%" }}
          animate={{
            x: gaze.x * gazeRangeX,
            y: gaze.y * gazeRangeY + eyeLift,
            scale: eyeScale,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
        >
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="relative block rounded-full bg-white"
              style={{ width: eyeW, height: eyeH }}
              animate={{ scaleY: blinking ? 0.08 : 1 }}
              transition={{ duration: 0.09, ease: "easeInOut" }}
            >
              <span
                className="absolute rounded-full bg-white/95"
                style={{
                  width: eyeW * 0.45,
                  height: eyeW * 0.45,
                  top: eyeH * 0.08,
                  left: eyeW * 0.15,
                  opacity: 0.9,
                }}
              />
            </motion.span>
          ))}
        </motion.div>

        {/* soft mouth line while speaking, layered beneath the eyes */}
        {speaking && (
          <div
            className="absolute flex items-center justify-center gap-1 pointer-events-none"
            style={{ top: "58%" }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-white/85"
                animate={{ height: [3, 11, 3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.13, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
