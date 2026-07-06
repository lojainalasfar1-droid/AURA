import type { Language } from "./types";

export function formatDateHuman(iso: string | null, lang: Language, now: Date = new Date()): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return lang === "ar" ? "اليوم" : "Today";
  if (diffDays === 1) return lang === "ar" ? "غدًا" : "Tomorrow";
  if (diffDays === -1) return lang === "ar" ? "أمس" : "Yesterday";

  return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeHuman(hhmm: string | null, lang: Language): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function greetingForNow(now: Date = new Date()): "morning" | "afternoon" | "evening" {
  const h = now.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export function classNames(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(" ");
}
