"use client";

import React, { useEffect, useState } from "react";
import { useAuraStore } from "@/lib/store";
import { I18nProvider } from "@/lib/i18n";

function AuraSplash() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-aura-400 to-aura-700 animate-pulseGlow" />
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useAuraStore((s) => s.settings.theme);
  const language = useAuraStore((s) => s.settings.language);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, mounted]);

  if (!mounted) return <AuraSplash />;

  return <I18nProvider>{children}</I18nProvider>;
}
