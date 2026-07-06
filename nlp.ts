import type { AuraItem, ItemKind, Priority } from "./types";

// ---------- helpers ----------

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

/** Parses a "yyyy-mm-dd" string as a local-midnight Date — `new Date(iso)`
 *  parses as UTC, which silently rolls back a day in negative-UTC-offset
 *  timezones (e.g. US timezones), corrupting day-rollover math. */
function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function minutesToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${pad(h)}:${pad(m)}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const WEEKDAYS_EN = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const WEEKDAYS_AR_INDEX: Record<string, number> = {
  "الأحد": 0,
  "الاثنين": 1,
  "الإثنين": 1,
  "الثلاثاء": 2,
  "الأربعاء": 3,
  "الخميس": 4,
  "الجمعة": 5,
  "السبت": 6,
};

// ==================================================================================
// INTELLIGENCE ENGINE
// The Brain Dump engine: classification, urgency/priority scoring, tagging,
// energy-aware smart scheduling, workload balancing, cognitive load, and
// contextual suggestions. Everything below runs automatically whenever the
// user submits a Brain Dump.
// ==================================================================================

// ---------- importance & urgency vocabulary ----------

const IMPORTANT_WORDS_EN = [
  "important",
  "high priority",
  "critical",
  "must",
  "deadline",
  "priority",
  "key",
  "crucial",
];
const IMPORTANT_WORDS_AR = ["مهم", "ضروري", "أولوية"];

const URGENT_WORDS_EN = ["urgent", "asap", "emergency", "immediately", "right away", "now", "critical"];
const URGENT_WORDS_AR = ["عاجل", "بسرعة", "طارئ", "حالا", "حالاً", "فورا", "فوراً"];

const LOW_WORDS_EN = [
  "someday",
  "maybe",
  "later",
  "whenever",
  "eventually",
  "low priority",
  "no rush",
  "no hurry",
];
const LOW_WORDS_AR = ["لاحقاً", "لاحقا", "يمكن", "مش مهم", "بدون استعجال", "وقت ما تحب"];

const REMINDER_WORDS = ["remind me", "reminder", "ذكرني", "تذكير", "فكرني"];
const MEETING_WORDS = ["meeting", "meet with", "sync", "standup", "appointment", "اجتماع", "موعد", "لقاء"];
const CALL_WORDS = ["call", "phone", "ring up", "dial", "اتصل", "مكالمة", "اتصال"];
const SHOPPING_WORDS = [
  "buy",
  "purchase",
  "shop for",
  "shopping",
  "grocery",
  "groceries",
  "pick up",
  "order",
  "اشتري",
  "شراء",
  "تسوق",
  "بقالة",
];
const NOTE_INDICATORS = ["idea", "thought", "note to self", "note", "فكرة", "ملاحظة"];

// ---------- date/time detection ----------

interface DateTimeMatch {
  dueDate: string | null;
  dueTime: string | null;
  matched: string[];
  explicitDate: boolean;
  explicitTime: boolean;
}

export function detectDateTime(text: string, now: Date = new Date()): DateTimeMatch {
  const matched: string[] = [];
  let dueDate: string | null = null;
  let dueTime: string | null = null;
  let explicitDate = false;
  let explicitTime = false;
  const lower = text.toLowerCase();

  // --- relative day words ---
  if (/\btoday\b/.test(lower) || /اليوم/.test(text)) {
    dueDate = toISODate(now);
    explicitDate = true;
    matched.push("today", "اليوم");
  } else if (/\btomorrow\b/.test(lower) || /بكرة|غدا|غداً/.test(text)) {
    dueDate = toISODate(addDays(now, 1));
    explicitDate = true;
    matched.push("tomorrow", "بكرة", "غدا", "غداً");
  } else if (/\btonight\b/.test(lower) || /الليلة/.test(text)) {
    dueDate = toISODate(now);
    dueTime = dueTime ?? "20:00";
    explicitDate = true;
    matched.push("tonight", "الليلة");
  } else if (/\bnext week\b/.test(lower) || /الأسبوع (الجاي|القادم)/.test(text)) {
    dueDate = toISODate(addDays(now, 7));
    explicitDate = true;
    matched.push("next week", "الأسبوع الجاي", "الأسبوع القادم");
  } else if (/\bin (\d+) days?\b/.test(lower)) {
    const m = lower.match(/\bin (\d+) days?\b/);
    if (m) {
      dueDate = toISODate(addDays(now, parseInt(m[1], 10)));
      explicitDate = true;
      matched.push(m[0]);
    }
  } else {
    const arInDays = text.match(/بعد (\d+) (يوم|أيام)/);
    if (arInDays) {
      dueDate = toISODate(addDays(now, parseInt(arInDays[1], 10)));
      explicitDate = true;
      matched.push(arInDays[0]);
    }
  }

  // --- weekday names ---
  if (!dueDate) {
    for (let i = 0; i < WEEKDAYS_EN.length; i++) {
      const wd = WEEKDAYS_EN[i];
      if (lower.includes(wd)) {
        const todayIdx = now.getDay();
        let diff = i - todayIdx;
        if (diff <= 0) diff += 7;
        dueDate = toISODate(addDays(now, diff));
        explicitDate = true;
        matched.push(wd);
        break;
      }
    }
  }
  if (!dueDate) {
    for (const wd of Object.keys(WEEKDAYS_AR_INDEX)) {
      if (text.includes(wd)) {
        const i = WEEKDAYS_AR_INDEX[wd];
        const todayIdx = now.getDay();
        let diff = i - todayIdx;
        if (diff <= 0) diff += 7;
        dueDate = toISODate(addDays(now, diff));
        explicitDate = true;
        matched.push(wd);
        break;
      }
    }
  }

  // --- explicit MM/DD or DD/MM ---
  if (!dueDate) {
    const slash = text.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
    if (slash) {
      const a = parseInt(slash[1], 10);
      const b = parseInt(slash[2], 10);
      const month = a > 12 ? b : a;
      const day = a > 12 ? a : b;
      const candidate = new Date(now.getFullYear(), month - 1, day);
      dueDate = toISODate(candidate);
      explicitDate = true;
      matched.push(slash[0]);
    }
  }

  // --- explicit clock time e.g. 5pm, 5:30 pm, 17:00, at 5 ---
  const timeMatch =
    lower.match(/\b(\d{1,2})(:(\d{2}))?\s?(am|pm)\b/) ||
    lower.match(/\b(\d{1,2}):(\d{2})\b/) ||
    text.match(/الساعة\s?(\d{1,2})(:(\d{2}))?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minuteRaw = timeMatch[3] ?? timeMatch[2];
    const minute = minuteRaw && !isNaN(parseInt(minuteRaw, 10)) ? parseInt(minuteRaw, 10) : 0;
    const isPM = /pm/.test(timeMatch[0]);
    const isAM = /am/.test(timeMatch[0]);
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    if (!isPM && !isAM && hour < 8) hour += 12; // heuristic: bare "5" likely means 5pm for daily tasks
    dueTime = `${pad(hour)}:${pad(minute)}`;
    explicitTime = true;
    matched.push(timeMatch[0]);
    if (!dueDate) dueDate = toISODate(now);
  }

  if (/\bmorning\b/.test(lower) || /الصباح/.test(text)) {
    dueTime = dueTime ?? "09:00";
    if (!dueDate) dueDate = toISODate(now);
  } else if (/\bafternoon\b/.test(lower) || /الظهر|بعد الظهر/.test(text)) {
    dueTime = dueTime ?? "14:00";
    if (!dueDate) dueDate = toISODate(now);
  } else if (/\bevening\b/.test(lower) || /المساء/.test(text)) {
    dueTime = dueTime ?? "18:00";
    if (!dueDate) dueDate = toISODate(now);
  }

  return { dueDate, dueTime, matched, explicitDate, explicitTime };
}

// ---------- urgency detection ----------

/**
 * Urgency measures time-pressure (how soon something matters), distinct from
 * priority which measures importance. The two are combined to reach a final
 * priority level so a plain-looking task due in an hour still surfaces as high.
 */
export function detectUrgency(
  text: string,
  dueDate: string | null,
  dueTime: string | null,
  now: Date = new Date()
): number {
  let score = 0;
  const lower = text.toLowerCase();

  for (const w of URGENT_WORDS_EN) if (lower.includes(w)) score += 35;
  for (const w of URGENT_WORDS_AR) if (text.includes(w)) score += 35;

  const bangs = (text.match(/!/g) || []).length;
  score += Math.min(bangs * 8, 20);

  if (dueDate) {
    const today = toISODate(now);
    const tomorrow = toISODate(addDays(now, 1));
    if (dueDate < today) score += 45; // overdue is maximally urgent
    else if (dueDate === today) score += 40;
    else if (dueDate === tomorrow) score += 22;
    else {
      const daysAway = Math.round((fromISODate(dueDate).getTime() - fromISODate(today).getTime()) / 86400000);
      if (daysAway <= 3) score += 12;
    }

    if (dueTime && dueDate === today) {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const dueMin = timeToMinutes(dueTime);
      const diff = dueMin - nowMin;
      if (diff <= 180 && diff >= -60) score += 25; // due within the next 3 hours
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Importance signal from vocabulary alone (independent of timing). */
function detectImportance(text: string): Priority {
  const lower = text.toLowerCase();
  for (const w of IMPORTANT_WORDS_EN) if (lower.includes(w)) return "high";
  for (const w of IMPORTANT_WORDS_AR) if (text.includes(w)) return "high";
  for (const w of LOW_WORDS_EN) if (lower.includes(w)) return "low";
  for (const w of LOW_WORDS_AR) if (text.includes(w)) return "low";
  return "medium";
}

/**
 * Intelligent priority = importance vocabulary blended with urgency (timing
 * pressure). A neutral task due within hours still gets bumped to high; an
 * "important"-sounding task with no real deadline settles to medium.
 */
export function detectPriority(text: string, urgency: number): Priority {
  const importance = detectImportance(text);
  if (importance === "high" || urgency >= 60) return "high";
  if (importance === "low" && urgency < 20) return "low";
  if (urgency >= 30) return "medium";
  return importance;
}

// ---------- kind + tag detection ----------

export function detectKind(text: string, hasTime: boolean): ItemKind {
  const lower = text.toLowerCase();
  for (const w of REMINDER_WORDS) if (lower.includes(w) || text.includes(w)) return "reminder";
  for (const w of NOTE_INDICATORS) if (lower.includes(w) || text.includes(w)) return "note";
  for (const w of MEETING_WORDS) if (lower.includes(w) || text.includes(w)) return "event";
  // a call becomes a calendar event only once it has a scheduled time; otherwise it's a task ("call mom")
  if (hasTime) {
    for (const w of CALL_WORDS) if (lower.includes(w) || text.includes(w)) return "event";
  }
  return "task";
}

export function detectTags(text: string): string[] {
  const tags: string[] = [];
  if (/work|meeting|project|عمل|اجتماع|مشروع/i.test(text)) tags.push("work");
  if (/home|family|بيت|عائلة|أهل/i.test(text)) tags.push("home");
  if (/health|gym|doctor|صحة|طبيب|رياضة/i.test(text)) tags.push("health");
  if (/study|exam|homework|دراسة|امتحان|واجب/i.test(text)) tags.push("study");
  for (const w of SHOPPING_WORDS) if (text.toLowerCase().includes(w) || text.includes(w)) {
    tags.push("shopping");
    break;
  }
  for (const w of CALL_WORDS) if (text.toLowerCase().includes(w) || text.includes(w)) {
    tags.push("call");
    break;
  }
  for (const w of MEETING_WORDS) if (text.toLowerCase().includes(w) || text.includes(w)) {
    tags.push("meeting");
    break;
  }
  return Array.from(new Set(tags));
}

// ---------- splitting ----------

export function splitIntoChunks(text: string): string[] {
  const normalized = text
    .replace(/\r/g, "")
    .split(/\n|،|;|،/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Za-z؀-ۿ])/))
    .flatMap((line) => line.split(/,\s(?=[a-z؀-ۿ])/i));

  return normalized
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

// ---------- cleaning title ----------

function cleanTitle(chunk: string, matched: string[]): string {
  let title = chunk;
  for (const m of matched) {
    if (!m) continue;
    const escaped = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(escaped, "gi"), "");
  }
  for (const w of [...URGENT_WORDS_EN, ...IMPORTANT_WORDS_EN, ...LOW_WORDS_EN, ...REMINDER_WORDS]) {
    title = title.replace(new RegExp(w, "gi"), "");
  }
  for (const w of [...URGENT_WORDS_AR, ...IMPORTANT_WORDS_AR, ...LOW_WORDS_AR, ...REMINDER_WORDS]) {
    title = title.split(w).join("");
  }
  title = title
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,،\-:]+|[\s,،\-:]+$/g, "")
    .trim();
  if (!title) title = chunk.trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// ---------- duration estimation ----------

function estimateDuration(kind: ItemKind, priority: Priority, tags: string[]): number {
  if (tags.includes("meeting") || kind === "event") return 60;
  if (tags.includes("call")) return 15;
  if (tags.includes("shopping")) return 30;
  if (kind === "reminder") return 5;
  if (priority === "high") return 45;
  if (priority === "low") return 20;
  return 30;
}

// ---------- main entry: the Brain Dump engine ----------

export function parseBrainDumpText(text: string, now: Date = new Date()): Omit<AuraItem, "id" | "createdAt">[] {
  const chunks = splitIntoChunks(text);
  const results: Omit<AuraItem, "id" | "createdAt">[] = [];

  for (const chunk of chunks) {
    const { dueDate, dueTime, matched } = detectDateTime(chunk, now);
    const urgency = detectUrgency(chunk, dueDate, dueTime, now);
    const priority = detectPriority(chunk, urgency);
    const kind = detectKind(chunk, !!dueTime);
    const tags = detectTags(chunk);
    const title = cleanTitle(chunk, matched);

    results.push({
      kind,
      title,
      raw: chunk,
      priority,
      dueDate,
      dueTime,
      done: false,
      durationMinutes: estimateDuration(kind, priority, tags),
      tags,
    });
  }

  return results;
}

// ---------- cognitive load ----------

export function computeStressScore(items: AuraItem[], now: Date = new Date()): number {
  const open = items.filter((i) => !i.done);
  if (open.length === 0) return 5;

  const today = toISODate(now);
  let score = 0;
  score += Math.min(open.length * 6, 45);
  score += open.filter((i) => i.priority === "high").length * 10;
  score += open.filter((i) => i.dueDate && i.dueDate < today).length * 12; // overdue
  score += open.filter((i) => i.dueDate === today).length * 5;

  // density: many items same day signals an imbalanced, overloaded schedule
  const byDay: Record<string, number> = {};
  for (const i of open) {
    if (!i.dueDate) continue;
    byDay[i.dueDate] = (byDay[i.dueDate] ?? 0) + 1;
  }
  const dayCounts = Object.values(byDay);
  const maxDensity = Math.max(0, ...dayCounts);
  if (maxDensity >= 5) score += 15;
  else if (maxDensity >= 3) score += 8;

  // imbalance: high variance between busiest and lightest day adds friction
  if (dayCounts.length >= 2) {
    const spread = Math.max(...dayCounts) - Math.min(...dayCounts);
    if (spread >= 4) score += 8;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function stressLabel(score: number): "calm" | "focused" | "busy" | "overloaded" {
  if (score < 30) return "calm";
  if (score < 60) return "focused";
  if (score < 80) return "busy";
  return "overloaded";
}

// ---------- energy score ----------

/** A gentle, typical energy curve across the day — peaks mid-morning, dips after lunch. */
function energyAtHour(hour: number): number {
  if (hour < 6) return 20;
  if (hour < 9) return 45 + (hour - 6) * 12;
  if (hour < 12) return 92;
  if (hour < 14) return 62;
  if (hour < 17) return 76;
  if (hour < 20) return 52;
  return 28;
}

/**
 * Predicts the user's current energy level (0-100) from time of day, pulled
 * down slightly when today's cognitive load is high (a packed day is tiring).
 */
export function computeEnergyScore(now: Date = new Date(), items: AuraItem[] = []): number {
  const base = energyAtHour(now.getHours() + now.getMinutes() / 60);
  const stress = items.length ? computeStressScore(items, now) : 0;
  const fatigue = stress > 70 ? 18 : stress > 45 ? 8 : 0;
  return Math.max(5, Math.min(100, Math.round(base - fatigue)));
}

export function energyLabel(score: number): "peak" | "steady" | "low" {
  if (score >= 70) return "peak";
  if (score >= 40) return "steady";
  return "low";
}

// ---------- smart scheduling (manual "auto-schedule my day" re-optimization) ----------

export interface ScheduleSlot {
  itemId: string;
  date: string;
  start: string; // HH:mm
  end: string; // HH:mm
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function autoSchedule(
  items: AuraItem[],
  workStart: string,
  workEnd: string,
  now: Date = new Date()
): Record<string, { dueDate: string; dueTime: string }> {
  const updates: Record<string, { dueDate: string; dueTime: string }> = {};
  const open = items.filter((i) => !i.done);

  const sorted = [...open].sort((a, b) => {
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });

  const dayStartMin = timeToMinutes(workStart);
  const dayEndMin = timeToMinutes(workEnd);
  const cursorByDay: Record<string, number> = {};

  for (const item of sorted) {
    const targetDate = item.dueDate ?? toISODate(now);
    if (cursorByDay[targetDate] === undefined) {
      cursorByDay[targetDate] = dayStartMin;
    }

    let start = cursorByDay[targetDate];
    if (item.dueTime) {
      const requested = timeToMinutes(item.dueTime);
      start = Math.max(start, requested);
    }

    if (start + item.durationMinutes > dayEndMin) {
      start = dayEndMin - item.durationMinutes;
    }

    const endMin = start + item.durationMinutes;
    cursorByDay[targetDate] = endMin + 10; // short buffer between items

    updates[item.id] = {
      dueDate: targetDate,
      dueTime: minutesToTime(start),
    };
  }

  return updates;
}

// ---------- automatic population: schedule freshly-parsed Brain Dump items ----------

type Draft = Omit<AuraItem, "id" | "createdAt">;

interface Interval {
  start: number;
  end: number;
}

function intervalsOverlap(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

/** Places an anchored (explicit-time) item at its requested time, nudging it
 *  forward only far enough to clear any *real* conflicts. */
function findAnchoredSlot(
  intervals: Interval[],
  requestedStart: number,
  duration: number,
  dayStartMin: number,
  dayEndMin: number
): number {
  // dayEndMin is a soft target, not a hard wall: clamping back to it after
  // conflicts are resolved would just reintroduce a collision with whatever
  // sits at the end of the day, so a genuinely packed day is allowed to run
  // a little late rather than silently double-booking two items.
  let start = Math.max(dayStartMin, requestedStart);
  let changed = true;
  while (changed) {
    changed = false;
    for (const iv of intervals) {
      if (intervalsOverlap({ start, end: start + duration }, iv)) {
        start = iv.end + 10;
        changed = true;
      }
    }
  }
  return start;
}

/** Finds the earliest open gap in the day for an item with no requested time. */
function findFreeSlot(intervals: Interval[], duration: number, dayStartMin: number, _dayEndMin: number): number {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let cursor = dayStartMin;
  for (const iv of sorted) {
    if (iv.start - cursor >= duration) return cursor;
    cursor = Math.max(cursor, iv.end + 10);
  }
  // no gap found between existing items — tack it on after the last one
  // (may run past the nominal day end on a packed day; see note above)
  return cursor;
}

/**
 * Runs immediately after a Brain Dump is parsed. Every actionable item
 * (anything but a free-floating note) is placed on the calendar automatically:
 * explicit times from the text are treated as real anchors — they only move
 * if they truly collide with something else — while anything vague is slotted
 * into the nearest open gap using workload balancing (never overloading a
 * single day) and energy-aware ordering (important items claim the earliest
 * openings first).
 */
export function scheduleNewDraftItems(
  drafts: Draft[],
  existingItems: AuraItem[],
  workStart: string,
  workEnd: string,
  now: Date = new Date()
): Draft[] {
  const dayStartMin = timeToMinutes(workStart);
  const dayEndMin = timeToMinutes(workEnd);
  const dayCapacity = Math.max(60, dayEndMin - dayStartMin);
  const BALANCE_CEILING = 0.85; // leave headroom so days don't get crammed solid

  const intervalsByDay: Record<string, Interval[]> = {};
  const usedByDay: Record<string, number> = {};
  for (const it of existingItems) {
    if (it.done || !it.dueDate) continue;
    usedByDay[it.dueDate] = (usedByDay[it.dueDate] ?? 0) + it.durationMinutes;
    if (it.dueTime) {
      const start = timeToMinutes(it.dueTime);
      (intervalsByDay[it.dueDate] ??= []).push({ start, end: start + it.durationMinutes });
    }
  }

  function findDayWithCapacity(preferredDate: string, minutesNeeded: number): string {
    let candidate = preferredDate;
    for (let i = 0; i < 14; i++) {
      const used = usedByDay[candidate] ?? 0;
      if (used + minutesNeeded <= dayCapacity * BALANCE_CEILING) return candidate;
      candidate = toISODate(addDays(fromISODate(candidate), 1));
    }
    return candidate;
  }

  // explicit-time items are placed first (as real anchors); among the rest,
  // urgent/important items get first pick of the earliest remaining openings
  const order = drafts
    .map((d, idx) => ({ d, idx }))
    .sort((a, b) => {
      const aAnchored = a.d.dueTime ? 0 : 1;
      const bAnchored = b.d.dueTime ? 0 : 1;
      if (aAnchored !== bAnchored) return aAnchored - bAnchored;
      const pa = PRIORITY_ORDER[a.d.priority];
      const pb = PRIORITY_ORDER[b.d.priority];
      if (pa !== pb) return pa - pb;
      return a.idx - b.idx;
    });

  const scheduled = new Map<number, Draft>();

  for (const { d, idx } of order) {
    if (d.kind === "note") {
      scheduled.set(idx, d); // notes stay free-floating, never forced onto the calendar
      continue;
    }

    const todayIso = toISODate(now);
    let targetDate = d.dueDate ?? todayIso;

    // only balance across days when the user didn't name an explicit date
    if (!d.dueDate) {
      targetDate = findDayWithCapacity(targetDate, d.durationMinutes);
    }

    const intervals = (intervalsByDay[targetDate] ??= []);
    const start = d.dueTime
      ? findAnchoredSlot(intervals, timeToMinutes(d.dueTime), d.durationMinutes, dayStartMin, dayEndMin)
      : findFreeSlot(intervals, d.durationMinutes, dayStartMin, dayEndMin);

    intervals.push({ start, end: start + d.durationMinutes });
    usedByDay[targetDate] = (usedByDay[targetDate] ?? 0) + d.durationMinutes;

    scheduled.set(idx, { ...d, dueDate: targetDate, dueTime: minutesToTime(start) });
  }

  return drafts.map((_, idx) => scheduled.get(idx)!);
}

// ---------- contextual suggestions ----------

export function generateContextualSuggestion(
  items: AuraItem[],
  stress: number,
  energy: number,
  lang: "en" | "ar",
  now: Date = new Date()
): string {
  const today = toISODate(now);
  const open = items.filter((i) => !i.done);
  const todayItems = open.filter((i) => i.dueDate === today);
  const overdue = open.filter((i) => i.dueDate && i.dueDate < today);
  const highToday = todayItems.filter((i) => i.priority === "high").length;
  const calls = todayItems.filter((i) => i.tags.includes("call")).length;
  const meetings = todayItems.filter((i) => i.tags.includes("meeting") || i.kind === "event").length;

  if (lang === "ar") {
    if (overdue.length >= 1) return `لديك ${overdue.length} مهمة متأخرة. أعد جدولتها أو تخلَّ عنها لتخفيف الحمل.`;
    if (stress >= 80) return "يومك مزدحم جدًا. حاول تأجيل مهمة واحدة غير عاجلة إلى الغد.";
    if (energy < 40 && highToday > 0) return "طاقتك منخفضة الآن — ابدأ بأصغر مهمة عالية الأولوية لتحافظ على الزخم.";
    if (calls + meetings >= 3) return `لديك ${calls + meetings} مكالمات واجتماعات اليوم — حاول تجميعها في كتلة واحدة.`;
    if (highToday >= 3) return "لديك عدة أولويات عالية — ابدأ بالأصعب أولاً بينما طاقتك في أعلى مستوياتها.";
    if (energy >= 70 && highToday > 0) return "طاقتك في ذروتها — الوقت مثالي لإنجاز أصعب مهمة اليوم.";
    if (stress < 30) return "يومك هادئ نسبيًا. وقت ممتاز للتخطيط للأسبوع القادم.";
    return "خذ استراحة قصيرة بين المهام للحفاظ على تركيزك.";
  }

  if (overdue.length >= 1) return `You have ${overdue.length} overdue ${overdue.length === 1 ? "item" : "items"} — reschedule or drop them to ease the load.`;
  if (stress >= 80) return "Your day looks packed. Consider pushing one non-urgent task to tomorrow.";
  if (energy < 40 && highToday > 0) return "Your energy is dipping — start with the smallest high-priority task to keep momentum.";
  if (calls + meetings >= 3) return `You have ${calls + meetings} calls and meetings today — try batching them back-to-back.`;
  if (highToday >= 3) return "You have several high-priority items — tackle the hardest one first while your energy is highest.";
  if (energy >= 70 && highToday > 0) return "Your energy is at its peak — perfect time for today's hardest task.";
  if (stress < 30) return "Today looks calm. A great time to plan ahead for next week.";
  return "Take a short break between tasks to keep your focus sharp.";
}

// ---------- conversational companion ----------

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * A natural, varied greeting Aura says out loud whenever the Presence screen
 * opens — grounded in real state (time of day, workload, energy) so it never
 * feels like a canned line.
 */
export function generateGreeting(
  userName: string,
  lang: "en" | "ar",
  items: AuraItem[],
  stress: number,
  energy: number,
  now: Date = new Date()
): string {
  const today = toISODate(now);
  const open = items.filter((i) => !i.done);
  const todayOpen = open.filter((i) => i.dueDate === today);
  const highToday = todayOpen.filter((i) => i.priority === "high").length;
  const hour = now.getHours();

  if (lang === "ar") {
    const timeWord = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء النور";
    const name = userName ? ` يا ${userName}` : "";

    if (open.length === 0) {
      return pick([
        `${timeWord}${name}. يومك فارغ تمامًا — وقت رائع للبدء بخفة.`,
        `${timeWord}${name}! لا شيء على قائمتك بعد. أخبرني بما يدور في ذهنك وسأرتبه لك.`,
      ]);
    }
    if (stress >= 80) {
      return pick([
        `${timeWord}${name}. يومك مزدحم بعض الشيء، لكن لا تقلق — سنرتبه معًا خطوة بخطوة.`,
        `${timeWord}${name}. أرى الكثير على لائحتك اليوم. لنبدأ بالأهم ونأخذ الباقي بهدوء.`,
      ]);
    }
    if (highToday >= 1 && energy >= 70) {
      return pick([
        `${timeWord}${name}! طاقتك عالية الآن، وهذا وقت مثالي لإنجاز أهم مهمة اليوم.`,
        `${timeWord}${name}. أنت في أفضل حالاتك الآن — لنبدأ بالمهمة الأكثر أهمية.`,
      ]);
    }
    if (todayOpen.length === 0) {
      return `${timeWord}${name}. لا يوجد شيء مجدول اليوم بعد — يوم هادئ ومناسب للتخطيط.`;
    }
    return pick([
      `${timeWord}${name}. لديك ${todayOpen.length} ${todayOpen.length === 1 ? "مهمة" : "مهام"} اليوم. أنا هنا لمساعدتك في ترتيبها.`,
      `${timeWord}${name}. جهّزت لك نظرة على ${todayOpen.length} ${todayOpen.length === 1 ? "مهمة" : "مهام"} اليوم — لنبدأ متى كنت جاهزًا.`,
    ]);
  }

  const timeWord = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = userName ? `, ${userName}` : "";

  if (open.length === 0) {
    return pick([
      `${timeWord}${name}. Your plate is completely clear — a great time to start light.`,
      `${timeWord}${name}! Nothing on your list yet. Tell me what's on your mind and I'll sort it out.`,
    ]);
  }
  if (stress >= 80) {
    return pick([
      `${timeWord}${name}. Today looks pretty full, but don't worry — we'll take it one step at a time.`,
      `${timeWord}${name}. I see a lot on your plate today. Let's start with what matters most and ease into the rest.`,
    ]);
  }
  if (highToday >= 1 && energy >= 70) {
    return pick([
      `${timeWord}${name}! Your energy's high right now — perfect time to tackle today's biggest task.`,
      `${timeWord}${name}. You're at your sharpest — let's knock out the most important thing first.`,
    ]);
  }
  if (todayOpen.length === 0) {
    return `${timeWord}${name}. Nothing's scheduled for today yet — a calm day to plan ahead.`;
  }
  return pick([
    `${timeWord}${name}. You have ${todayOpen.length} ${todayOpen.length === 1 ? "thing" : "things"} on today — I'm here to help you through it.`,
    `${timeWord}${name}. I've got ${todayOpen.length} ${todayOpen.length === 1 ? "thing" : "things"} lined up for today whenever you're ready to look.`,
  ]);
}

/**
 * What Aura "says" right after parsing a Brain Dump, before the extracted
 * cards appear — a friendly, plain-language summary of what it understood.
 */
export function generateBrainDumpExplanation(
  drafts: Omit<AuraItem, "id" | "createdAt">[],
  lang: "en" | "ar"
): string {
  if (drafts.length === 0) {
    return lang === "ar"
      ? "لم أجد شيئًا واضحًا لأنظمه من هذا النص — جرّب صياغة مختلفة."
      : "Hmm, I couldn't quite pull anything actionable from that — try rephrasing a bit.";
  }

  const counts = { task: 0, event: 0, reminder: 0, note: 0 };
  for (const d of drafts) counts[d.kind]++;
  const highCount = drafts.filter((d) => d.priority === "high").length;
  const shoppingCount = drafts.filter((d) => d.tags.includes("shopping")).length;

  if (lang === "ar") {
    const parts: string[] = [`وجدت ${drafts.length} ${drafts.length === 1 ? "عنصر" : "عناصر"} في كلامك.`];
    const bits: string[] = [];
    if (counts.event) bits.push(`${counts.event} ${counts.event === 1 ? "موعد" : "مواعيد"}`);
    if (counts.reminder) bits.push(`${counts.reminder} ${counts.reminder === 1 ? "تذكير" : "تذكيرات"}`);
    if (shoppingCount) bits.push(`${shoppingCount} ${shoppingCount === 1 ? "غرض تسوق" : "أغراض تسوق"}`);
    if (counts.task) bits.push(`${counts.task} ${counts.task === 1 ? "مهمة" : "مهام"}`);
    if (bits.length) parts.push(`من بينها ${bits.join("، ")}.`);
    if (highCount > 0) parts.push(`لاحظت ${highCount} ${highCount === 1 ? "عنصر عاجل" : "عناصر عاجلة"} فرفعت أولويته${highCount === 1 ? "" : "ا"}.`);
    parts.push("هذا ما رتبته لك:");
    return parts.join(" ");
  }

  const parts: string[] = [`I found ${drafts.length} ${drafts.length === 1 ? "thing" : "things"} in there.`];
  const bits: string[] = [];
  if (counts.event) bits.push(`${counts.event} ${counts.event === 1 ? "meeting" : "meetings"}`);
  if (counts.reminder) bits.push(`${counts.reminder} ${counts.reminder === 1 ? "reminder" : "reminders"}`);
  if (shoppingCount) bits.push(`${shoppingCount} shopping ${shoppingCount === 1 ? "item" : "items"}`);
  if (counts.task) bits.push(`${counts.task} ${counts.task === 1 ? "task" : "tasks"}`);
  if (bits.length) parts.push(`Including ${bits.join(", ")}.`);
  if (highCount > 0) {
    parts.push(`I spotted ${highCount} urgent ${highCount === 1 ? "item" : "items"} and bumped ${highCount === 1 ? "it" : "them"} to the top.`);
  }
  parts.push("Here's how I've sorted it:");
  return parts.join(" ");
}

export { toISODate, addDays };
