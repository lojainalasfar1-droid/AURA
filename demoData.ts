import type { AuraItem, BrainDumpEntry } from "./types";
import { toISODate, addDays } from "./nlp";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function getDemoData(): { items: AuraItem[]; dumps: BrainDumpEntry[] } {
  const now = new Date();
  const today = toISODate(now);
  const tomorrow = toISODate(addDays(now, 1));
  const createdAt = now.toISOString();

  const items: AuraItem[] = [
    {
      id: uid(),
      kind: "event",
      title: "Client meeting to review capstone milestone",
      raw: "Client meeting to review capstone milestone at 3pm urgent",
      priority: "high",
      dueDate: today,
      dueTime: "15:00",
      done: false,
      createdAt,
      durationMinutes: 60,
      tags: ["work"],
    },
    {
      id: uid(),
      kind: "task",
      title: "Finish literature review section",
      raw: "Finish literature review section deadline tonight important",
      priority: "high",
      dueDate: today,
      dueTime: "20:00",
      done: false,
      createdAt,
      durationMinutes: 45,
      tags: ["study"],
    },
    {
      id: uid(),
      kind: "reminder",
      title: "Call mom",
      raw: "Remind me to call mom tonight",
      priority: "medium",
      dueDate: today,
      dueTime: "19:00",
      done: false,
      createdAt,
      durationMinutes: 5,
      tags: ["home"],
    },
    {
      id: uid(),
      kind: "task",
      title: "Buy groceries",
      raw: "buy groceries",
      priority: "low",
      dueDate: tomorrow,
      dueTime: null,
      done: false,
      createdAt,
      durationMinutes: 20,
      tags: ["home"],
    },
    {
      id: uid(),
      kind: "task",
      title: "Gym session",
      raw: "gym session tomorrow morning",
      priority: "medium",
      dueDate: tomorrow,
      dueTime: "09:00",
      done: false,
      createdAt,
      durationMinutes: 30,
      tags: ["health"],
    },
    {
      id: uid(),
      kind: "task",
      title: "Prepare presentation slides",
      raw: "prepare presentation slides for capstone demo asap",
      priority: "high",
      dueDate: today,
      dueTime: "11:00",
      done: true,
      createdAt,
      durationMinutes: 45,
      tags: ["work", "study"],
    },
    {
      id: uid(),
      kind: "note",
      title: "Idea: add dark mode animation to Aura orb",
      raw: "idea add dark mode animation to aura orb",
      priority: "low",
      dueDate: null,
      dueTime: null,
      done: false,
      createdAt,
      durationMinutes: 20,
      tags: [],
    },
  ];

  const dumps: BrainDumpEntry[] = [
    {
      id: uid(),
      text: "Client meeting to review capstone milestone at 3pm urgent, finish literature review section deadline tonight important, remind me to call mom tonight, buy groceries, gym session tomorrow morning",
      createdAt,
      itemIds: items.slice(0, 5).map((i) => i.id),
    },
  ];

  return { items, dumps };
}
