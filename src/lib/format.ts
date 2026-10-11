import type { Dictionary } from "@/i18n/dictionaries";

export function formatDuration(totalSeconds: number, dict: Dictionary): string {
  const minutes = Math.round(totalSeconds / 60);

  if (minutes < 60) {
    return `${Math.max(minutes, totalSeconds > 0 ? 1 : 0)} ${dict.duration.minutes}`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0
    ? `${hours} ${dict.duration.hours}`
    : `${hours} ${dict.duration.hours} ${rest} ${dict.duration.minutes}`;
}

/** "1.200.000 ₫" — same shape as the API's priceDisplay, for values it does not format. */
export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

export function template(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
