"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Volume2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import AuraCompanion from "@/components/AuraCompanion";
import { useAuraStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { AuraPersonality, AuraShape, AuraVoiceStyle } from "@/lib/types";
import { speak, voiceStyleParams } from "@/lib/speech";

const COLORS = ["#7048ff", "#22d3ee", "#f472b6", "#f59e0b", "#22c55e", "#ef4444", "#818cf8", "#14b8a6"];
const SHAPES: AuraShape[] = ["blob", "orb", "wave", "diamond"];
const PERSONALITIES: AuraPersonality[] = ["calm", "energetic", "direct", "warm"];
const VOICES: AuraVoiceStyle[] = ["soft", "confident", "bright"];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

function PillGroup<T extends string>({
  options,
  value,
  onChange,
  labelFor,
  layoutId,
  cols = "grid-cols-4",
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelFor: (v: T) => string;
  layoutId: string;
  cols?: string;
}) {
  return (
    <div className={`grid ${cols} gap-3`}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`relative rounded-2xl py-3 text-xs font-medium overflow-hidden transition-all duration-300 active:scale-95 ${
            value === opt ? "text-aura-600 dark:text-aura-300" : "bg-black/5 dark:bg-white/5 opacity-70 hover:opacity-100"
          }`}
        >
          {value === opt && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-2xl bg-aura-500/15 ring-2 ring-aura-400"
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            />
          )}
          <span className="relative">{labelFor(opt)}</span>
        </button>
      ))}
    </div>
  );
}

function ColorSwatchRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {COLORS.map((c) => (
        <motion.button
          key={c}
          onClick={() => onChange(c)}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.12 }}
          className="relative h-9 w-9 rounded-full flex items-center justify-center"
          style={{ background: c, boxShadow: value === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
        >
          <AnimatePresence>
            {value === c && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <Check size={16} className="text-white drop-shadow" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      ))}
    </div>
  );
}

export default function AvatarPage() {
  const aura = useAuraStore((s) => s.aura);
  const setAuraProfile = useAuraStore((s) => s.setAuraProfile);
  const language = useAuraStore((s) => s.settings.language);
  const { t } = useI18n();

  const [draft, setDraft] = useState(aura);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  function save() {
    setAuraProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function previewVoice() {
    speak(language === "ar" ? `مرحبًا، أنا ${draft.name}` : `Hi, I'm ${draft.name}`, {
      lang: language,
      ...voiceStyleParams(draft.voiceStyle),
    });
  }

  return (
    <PageShell title={t("avatar_title")} subtitle={t("avatar_subtitle")}>
      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card card-hover p-6 flex flex-col items-center justify-center gap-4 h-fit md:sticky md:top-6"
        >
          <AuraCompanion
            size={180}
            overrideColor={draft.color}
            overrideSecondary={draft.secondaryColor}
            overrideShape={draft.shape}
            overridePersonality={draft.personality}
          />
          <p className="font-semibold text-lg">{draft.name || "Aura"}</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={previewVoice} className="btn-secondary text-sm !py-2">
            <Volume2 size={15} /> {t("avatar_voice_label")}
          </motion.button>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
          <motion.div variants={item} className="card card-hover p-5">
            <label className="text-sm font-medium opacity-70 block mb-2">{t("avatar_name_label")}</label>
            <input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-2xl px-4 py-3 bg-black/5 dark:bg-white/5 outline-none focus:ring-2 focus:ring-aura-400 transition-shadow"
              maxLength={20}
            />
          </motion.div>

          <motion.div variants={item} className="card card-hover p-5">
            <label className="text-sm font-medium opacity-70 block mb-3">{t("avatar_color_label")}</label>
            <div className="mb-4">
              <ColorSwatchRow value={draft.color} onChange={(c) => update("color", c)} />
            </div>
            <label className="text-sm font-medium opacity-70 block mb-3">{t("avatar_secondary_label")}</label>
            <ColorSwatchRow value={draft.secondaryColor} onChange={(c) => update("secondaryColor", c)} />
          </motion.div>

          <motion.div variants={item} className="card card-hover p-5">
            <label className="text-sm font-medium opacity-70 block mb-3">{t("avatar_shape_label")}</label>
            <PillGroup
              options={SHAPES}
              value={draft.shape}
              onChange={(v) => update("shape", v)}
              labelFor={(s) => t(`shape_${s}` as any)}
              layoutId="avatar-shape-pill"
            />
          </motion.div>

          <motion.div variants={item} className="card card-hover p-5">
            <label className="text-sm font-medium opacity-70 block mb-3">{t("avatar_personality_label")}</label>
            <PillGroup
              options={PERSONALITIES}
              value={draft.personality}
              onChange={(v) => update("personality", v)}
              labelFor={(p) => t(`personality_${p}` as any)}
              layoutId="avatar-personality-pill"
              cols="grid-cols-2 sm:grid-cols-4"
            />
          </motion.div>

          <motion.div variants={item} className="card card-hover p-5">
            <label className="text-sm font-medium opacity-70 block mb-3">{t("avatar_voice_label")}</label>
            <div className="mb-4">
              <PillGroup
                options={VOICES}
                value={draft.voiceStyle}
                onChange={(v) => update("voiceStyle", v)}
                labelFor={(v) => t(`voice_${v}` as any)}
                layoutId="avatar-voice-pill"
                cols="grid-cols-3"
              />
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">{t("avatar_voice_toggle")}</span>
              <button
                onClick={() => update("voiceEnabled", !draft.voiceEnabled)}
                role="switch"
                aria-checked={draft.voiceEnabled}
                aria-label={t("avatar_voice_toggle")}
                className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                  draft.voiceEnabled ? "bg-aura-500" : "bg-black/15 dark:bg-white/15"
                }`}
              >
                <motion.span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ x: draft.voiceEnabled ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </label>
          </motion.div>

          <motion.button
            variants={item}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={save}
            className="btn-primary self-start"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={saved ? "saved" : "save"}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                {saved && <Check size={18} />}
                {saved ? t("avatar_saved") : t("avatar_save")}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </div>
    </PageShell>
  );
}
