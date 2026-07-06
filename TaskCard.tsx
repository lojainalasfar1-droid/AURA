"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Trash2, Bell, Users, StickyNote, ListTodo, Clock } from "lucide-react";
import type { AuraItem } from "@/lib/types";
import { useAuraStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { formatDateHuman, formatTimeHuman } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  high: "bg-red-500/15 text-red-500 dark:text-red-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

const priorityBorder: Record<string, string> = {
  high: "border-s-red-400/70",
  medium: "border-s-amber-400/70",
  low: "border-s-emerald-400/70",
};

const kindIcons: Record<string, React.ElementType> = {
  task: ListTodo,
  reminder: Bell,
  event: Users,
  note: StickyNote,
};

const TaskCard = React.forwardRef<HTMLDivElement, { item: AuraItem }>(function TaskCard(
  { item },
  ref
) {
  const toggleDone = useAuraStore((s) => s.toggleDone);
  const deleteItem = useAuraStore((s) => s.deleteItem);
  const { t, lang } = useI18n();
  const Icon = kindIcons[item.kind] ?? ListTodo;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`card card-hover flex items-start gap-3 p-4 border-s-2 ${priorityBorder[item.priority]} ${
        item.done ? "opacity-50" : ""
      }`}
    >
      <motion.button
        onClick={() => toggleDone(item.id)}
        whileTap={{ scale: 0.8 }}
        className="mt-0.5 shrink-0 text-aura-500"
        aria-label="toggle done"
      >
        <AnimatePresence mode="wait" initial={false}>
          {item.done ? (
            <motion.span
              key="done"
              initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="flex"
            >
              <CheckCircle2 size={22} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              className="flex hover:scale-110 transition-transform"
            >
              <Circle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon size={14} className="opacity-60 shrink-0" />
          <p className={`font-medium truncate transition-all ${item.done ? "line-through opacity-60" : ""}`}>
            {item.title}
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
          <span className={`chip ${priorityColors[item.priority]}`}>{t(`priority_${item.priority}` as any)}</span>
          {item.dueDate && (
            <span className="chip bg-black/5 dark:bg-white/10 gap-1">
              <Clock size={11} />
              {formatDateHuman(item.dueDate, lang)} {item.dueTime ? formatTimeHuman(item.dueTime, lang) : ""}
            </span>
          )}
          {item.tags.map((tag) => (
            <span key={tag} className="chip bg-aura-500/10 text-aura-600 dark:text-aura-300">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => deleteItem(item.id)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.85 }}
        className="shrink-0 opacity-40 hover:opacity-100 hover:text-red-500 transition-colors"
        aria-label="delete"
      >
        <Trash2 size={17} />
      </motion.button>
    </motion.div>
  );
});

export default TaskCard;
