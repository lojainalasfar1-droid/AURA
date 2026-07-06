"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";

function labelFor(score: number, lang: "en" | "ar") {
  const table = {
    en: { calm: "Calm", focused: "Focused", busy: "Busy", overloaded: "Overloaded" },
    ar: { calm: "هادئ", focused: "مركّز", busy: "مشغول", overloaded: "مثقل" },
  };
  const key = score < 30 ? "calm" : score < 60 ? "focused" : score < 80 ? "busy" : "overloaded";
  return table[lang][key];
}

function colorFor(score: number) {
  if (score < 30) return "#22c55e";
  if (score < 60) return "#7048ff";
  if (score < 80) return "#f59e0b";
  return "#ef4444";
}

export default function StressMeter({ score, size = 120 }: { score: number; size?: number }) {
  const { t, lang } = useI18n();
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = colorFor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={10}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">{score}</span>
          <span className="text-[10px] opacity-60">/100</span>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>
        {labelFor(score, lang)}
      </span>
      <span className="text-xs opacity-60">{t("presence_stress_label")}</span>
    </div>
  );
}
