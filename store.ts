import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  AuraItem,
  AuraProfile,
  BrainDumpEntry,
  UserSettings,
} from "./types";
import { autoSchedule, scheduleNewDraftItems } from "./nlp";
import { getDemoData } from "./demoData";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const defaultAura: AuraProfile = {
  name: "Aura",
  color: "#7048ff",
  secondaryColor: "#22d3ee",
  shape: "blob",
  personality: "calm",
  voiceStyle: "soft",
  voiceEnabled: true,
};

const defaultSettings: UserSettings = {
  userName: "",
  language: "en",
  theme: "dark",
  workStart: "09:00",
  workEnd: "21:00",
  onboarded: false,
};

interface Actions {
  addItemsFromDump: (rawText: string, items: Omit<AuraItem, "id" | "createdAt">[]) => void;
  toggleDone: (id: string) => void;
  deleteItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<AuraItem>) => void;
  setAuraProfile: (patch: Partial<AuraProfile>) => void;
  setSettings: (patch: Partial<UserSettings>) => void;
  autoScheduleAll: () => void;
  resetAll: () => void;
  loadDemo: () => void;
  markOnboarded: () => void;
}

export const useAuraStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      items: [],
      dumps: [],
      aura: defaultAura,
      settings: defaultSettings,

      addItemsFromDump: (rawText, newItems) => {
        const createdAt = new Date().toISOString();
        const { items: existingItems, settings } = get();
        const scheduled = scheduleNewDraftItems(
          newItems,
          existingItems,
          settings.workStart,
          settings.workEnd
        );
        const withIds: AuraItem[] = scheduled.map((it) => ({
          ...it,
          id: uid(),
          createdAt,
        }));
        const dump: BrainDumpEntry = {
          id: uid(),
          text: rawText,
          createdAt,
          itemIds: withIds.map((i) => i.id),
        };
        set((state) => ({
          items: [...withIds, ...state.items],
          dumps: [dump, ...state.dumps],
        }));
      },

      toggleDone: (id) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),

      deleteItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      setAuraProfile: (patch) =>
        set((state) => ({ aura: { ...state.aura, ...patch } })),

      setSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      autoScheduleAll: () => {
        const { items, settings } = get();
        const updates = autoSchedule(items, settings.workStart, settings.workEnd);
        set((state) => ({
          items: state.items.map((i) =>
            updates[i.id] ? { ...i, dueDate: updates[i.id].dueDate, dueTime: updates[i.id].dueTime } : i
          ),
        }));
      },

      resetAll: () =>
        set(() => ({
          items: [],
          dumps: [],
          aura: defaultAura,
          settings: { ...defaultSettings },
        })),

      loadDemo: () => {
        const demo = getDemoData();
        set((state) => ({
          items: [...demo.items, ...state.items],
          dumps: [...demo.dumps, ...state.dumps],
        }));
      },

      markOnboarded: () =>
        set((state) => ({ settings: { ...state.settings, onboarded: true } })),
    }),
    {
      name: "aura-storage",
      version: 1,
    }
  )
);
