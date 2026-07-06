"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal ambient typings for the Web Speech API (not in default TS lib)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): { 0: { transcript: string }; isFinal: boolean; length: number };
    [index: number]: { 0: { transcript: string }; isFinal: boolean; length: number };
  };
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: any) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

export function useVoiceInput(lang: "en" | "ar" = "en") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = lang === "ar" ? "ar-SA" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setTranscript("");
    setListening(true);
    recognition.start();
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, transcript, start, stop, supported, setTranscript };
}

export function speak(
  text: string,
  opts: {
    lang?: "en" | "ar";
    pitch?: number;
    rate?: number;
    voiceHint?: string;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
) {
  if (!isSpeechSynthesisSupported() || !text) {
    opts.onEnd?.();
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = opts.lang === "ar" ? "ar-SA" : "en-US";
  utter.pitch = opts.pitch ?? 1;
  utter.rate = opts.rate ?? 1;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    const match = voices.find((v) => v.lang.startsWith(utter.lang));
    if (match) utter.voice = match;
  }

  if (opts.onStart) utter.onstart = () => opts.onStart?.();
  if (opts.onEnd) {
    utter.onend = () => opts.onEnd?.();
    utter.onerror = () => opts.onEnd?.();
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

export function voiceStyleParams(style: "soft" | "confident" | "bright") {
  if (style === "confident") return { pitch: 0.9, rate: 1.05 };
  if (style === "bright") return { pitch: 1.25, rate: 1.1 };
  return { pitch: 1, rate: 0.95 };
}
