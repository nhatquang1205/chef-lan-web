import type { Dictionary } from "@/i18n/dictionaries";

/** The only strings `CoursePrice` (a client component) needs, so a server page does not ship the whole dictionary. */
export type PriceDict = {
  card: Pick<Dictionary["card"], "owned">;
  common: Pick<Dictionary["common"], "free">;
};

export const priceDict = (dict: Dictionary): PriceDict => ({ card: { owned: dict.card.owned }, common: { free: dict.common.free } });
