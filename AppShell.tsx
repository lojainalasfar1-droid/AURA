"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  UserCircle2,
  Brain,
  CalendarClock,
  CalendarDays,
  BellRing,
  Sun,
  Moon,
  Languages,
  Newspaper,
  ListChecks,
  Settings,
} from "lucide-react";
import { useAuraStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";

const NAV_ITEMS: { href: string; icon: React.ElementType; key: DictKey }[] = [
  { href: "/", icon: Sparkles, key: "nav_presence" },
  { href: "/avatar", icon: UserCircle2, key: "nav_avatar" },
  { href: "/brain-dump", icon: Brain, key: "nav_braindump" },
  { href: "/planner", icon: ListChecks, key: "nav_planner" },
  { href: "/calendar", icon: CalendarDays, key: "nav_calendar" },
  { href: "/reminders", icon: BellRing, key: "nav_reminders" },
  { href: "/briefing", icon: Newspaper, key: "nav_briefing" },
  { href: "/review", icon: CalendarClock, key: "nav_review" },
  { href: "/settings", icon: Settings, key: "nav_settings" },
];

function TopControls() {
  const settings = useAuraStore((s) => s.settings);
  const setSettings = useAuraStore((s) => s.setSettings);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setSettings({ language: settings.language === "en" ? "ar" : "en" })}
        className="icon-btn"
        aria-label="toggle language"
        title="EN / AR"
      >
        <Languages size={16} />
      </button>
      <button
        onClick={() => setSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
        className="icon-btn"
        aria-label="toggle theme"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={settings.theme}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex"
          >
            {settings.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}

function NavLink({
  href,
  Icon,
  label,
  active,
  layoutId,
  compact = false,
}: {
  href: string;
  Icon: React.ElementType;
  label: string;
  active: boolean;
  layoutId: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href={href}
        className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-medium transition-colors duration-300 ${
          active ? "text-aura-600 dark:text-aura-300" : "opacity-55 hover:opacity-90"
        }`}
      >
        {active && (
          <motion.span
            layoutId={layoutId}
            className="absolute inset-0 rounded-2xl bg-aura-500/12"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        <span className="relative">
          <Icon size={19} />
        </span>
        <span className="relative">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`nav-link group relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium ${
        active ? "text-aura-600 dark:text-aura-300" : "opacity-75 hover:opacity-100"
      }`}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-2xl bg-aura-500/15"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <span className="relative transition-transform duration-300 group-hover:scale-110">
        <Icon size={18} />
      </span>
      <span className="relative">{label}</span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, dir } = useI18n();
  const auraName = useAuraStore((s) => s.aura.name);
  const auraColor = useAuraStore((s) => s.aura.color);

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 glass border-e border-black/5 dark:border-white/10 p-5 sticky top-0 h-screen z-40">
        <Link href="/" className="flex items-center gap-2 mb-8 px-2 group">
          <div
            className="h-8 w-8 rounded-full shrink-0 transition-transform duration-500 group-hover:rotate-[25deg] group-hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${auraColor}, #22d3ee)` }}
          />
          <span className="text-lg font-semibold tracking-tight">{auraName}</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
            <NavLink
              key={href}
              href={href}
              Icon={Icon}
              label={t(key)}
              active={pathname === href}
              layoutId="sidebar-active-pill"
            />
          ))}
        </nav>
        <div className="mt-auto pt-4">
          <TopControls />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-30">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full shrink-0"
              style={{ background: `linear-gradient(135deg, ${auraColor}, #22d3ee)` }}
            />
            <span className="font-semibold">{auraName}</span>
          </Link>
          <TopControls />
        </header>

        <main className="flex-1 pb-24 md:pb-8 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 glass-strong border-t border-black/5 dark:border-white/10 flex justify-around items-center py-2 z-30 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {NAV_ITEMS.slice(0, 5).map(({ href, icon: Icon, key }) => (
            <NavLink
              key={href}
              href={href}
              Icon={Icon}
              label={t(key)}
              active={pathname === href}
              layoutId="mobile-active-pill"
              compact
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
