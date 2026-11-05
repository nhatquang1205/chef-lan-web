import { localePath, type Locale } from "@/i18n/config";

export interface HistoryEntry {
  videoId: string;
  courseSlug: string;
  courseTitle: string;
  lessonSlug?: string;
  lessonTitle: string;
  title: string;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: number;
}

const MAX_ENTRIES = 50;

const key = (userId: string) => `cheflan.history.v1.${userId}`;

export function readHistory(userId: string): HistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveProgress(userId: string, entry: Omit<HistoryEntry, "updatedAt">) {
  try {
    const rest = readHistory(userId).filter((item) => item.videoId !== entry.videoId);
    const next = [{ ...entry, updatedAt: Date.now() }, ...rest].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // Storage blocked or full: history is a convenience, not worth surfacing.
  }
}

export function removeFromHistory(userId: string, videoId: string) {
  try {
    const next = readHistory(userId).filter((item) => item.videoId !== videoId);
    window.localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // Nothing to remove.
  }
}

/** Where "continue watching" goes: the lesson page on that video, or the old watch route (which redirects) for entries saved before lessons were recorded. */
export function historyHref(lang: Locale, entry: HistoryEntry): string {
  return entry.lessonSlug
    ? `${localePath(lang, `/courses/${entry.courseSlug}/lessons/${entry.lessonSlug}`)}?v=${entry.videoId}`
    : localePath(lang, `/courses/${entry.courseSlug}/watch/${entry.videoId}`);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h > 0 ? 2 : 1, "0");
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s % 60).padStart(2, "0")}`;
}
