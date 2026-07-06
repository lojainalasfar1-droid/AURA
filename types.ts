export type Priority = "high" | "medium" | "low";

export type ItemKind = "task" | "reminder" | "note" | "event";

export interface AuraItem {
  id: string;
  kind: ItemKind;
  title: string;
  raw: string;
  priority: Priority;
  dueDate: string | null; // ISO date (yyyy-mm-dd)
  dueTime: string | null; // HH:mm
  done: boolean;
  createdAt: string; // ISO datetime
  durationMinutes: number;
  tags: string[];
}

export type AuraShape = "blob" | "orb" | "wave" | "diamond";
export type AuraPersonality = "calm" | "energetic" | "direct" | "warm";
export type AuraVoiceStyle = "soft" | "confident" | "bright";
export type Language = "en" | "ar";
export type ThemeMode = "light" | "dark";

export interface AuraProfile {
  name: string;
  color: string; // hex
  secondaryColor: string; // hex
  shape: AuraShape;
  personality: AuraPersonality;
  voiceStyle: AuraVoiceStyle;
  voiceEnabled: boolean;
}

export interface UserSettings {
  userName: string;
  language: Language;
  theme: ThemeMode;
  workStart: string; // HH:mm
  workEnd: string; // HH:mm
  onboarded: boolean;
}

export interface BrainDumpEntry {
  id: string;
  text: string;
  createdAt: string;
  itemIds: string[];
}

export interface AppState {
  items: AuraItem[];
  dumps: BrainDumpEntry[];
  aura: AuraProfile;
  settings: UserSettings;
}
