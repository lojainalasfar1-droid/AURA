"use client";

import React, { useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/lib/speech";
import { useAuraStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export default function VoiceButton({
  onResult,
  compact = false,
}: {
  onResult: (text: string) => void;
  compact?: boolean;
}) {
  const language = useAuraStore((s) => s.settings.language);
  const { listening, transcript, start, stop, supported } = useVoiceInput(language);
  const { t } = useI18n();
  const lastTranscript = useRef("");

  useEffect(() => {
    lastTranscript.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (!listening && lastTranscript.current) {
      onResult(lastTranscript.current);
      lastTranscript.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  if (!supported) return null;

  return (
    <button
      onClick={() => (listening ? stop() : start())}
      aria-label={compact ? (listening ? t("presence_listening") : t("presence_talk")) : undefined}
      aria-pressed={listening}
      className={
        compact
          ? `relative flex items-center justify-center h-11 w-11 rounded-full transition-all ${
              listening
                ? "bg-red-500 text-white animate-listenPulse"
                : "btn-secondary !px-0 !py-0 h-11 w-11"
            }`
          : `relative btn-primary ${listening ? "!from-red-500 !to-red-600" : ""}`
      }
    >
      {listening ? <MicOff size={compact ? 18 : 20} /> : <Mic size={compact ? 18 : 20} />}
      {!compact && <span>{listening ? t("presence_listening") : t("presence_talk")}</span>}
    </button>
  );
}
