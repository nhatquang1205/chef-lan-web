export interface HistoryEntry {
  videoId: string;
  courseSlug: string;
  courseTitle: string;
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

export function clearHistory(userId: string) {
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    // Nothing to clear.
  }
}
