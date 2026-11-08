"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { getCatalogState } from "@/lib/api/myCourses";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useSyncedRecord } from "@/lib/store/syncedRecord";

const MAX_AGE_MS = 30 * 60_000;

interface CatalogStateValue {
  /** The signed-in customer owns this course whole (cards show "owned" instead of a price). False for everyone else. */
  isOwned(courseId: number): boolean;
  /** The price this customer pays when it is below the list price; undefined otherwise. */
  finalPriceOf(courseId: number): number | undefined;
  /** Fetches the state now (after a purchase), instead of waiting for the stored copy to age. No-op for anyone but a customer. */
  refresh(): void;
}

const noop = () => {};
const empty: CatalogStateValue = { isOwned: () => false, finalPriceOf: () => undefined, refresh: noop };

const CatalogStateContext = createContext<CatalogStateValue>(empty);

export function CatalogStateProvider({ children }: { children: React.ReactNode }) {
  const { status, user, getAccessToken } = useAuth();
  const userId = status === "loading" ? undefined : user?.actor === "Customer" ? user.id : null;

  const fetchState = useCallback(async () => {
    const token = await getAccessToken();

    return token ? getCatalogState(token) : null;
  }, [getAccessToken]);

  const { data, refresh } = useSyncedRecord({ store: "catalogState", userId, maxAgeMs: MAX_AGE_MS, fetch: fetchState });

  const value = useMemo<CatalogStateValue>(() => {
    if (!data) {
      return { ...empty, refresh };
    }

    const owned = new Set(data.ownedCourseIds);
    const prices = new Map(data.prices.map((price) => [price.courseId, price]));

    return {
      isOwned: (courseId) => owned.has(courseId),
      finalPriceOf: (courseId) => {
        const price = prices.get(courseId);

        return price && price.finalPriceVnd < price.listPriceVnd ? price.finalPriceVnd : undefined;
      },
      refresh,
    };
  }, [data, refresh]);

  return <CatalogStateContext.Provider value={value}>{children}</CatalogStateContext.Provider>;
}

const subscribeNothing = () => () => {};

/**
 * Empty while a component hydrates: the server HTML was rendered without this data, and a section streamed in after the
 * provider already holds it would otherwise not match (hydration error). The real value follows right after.
 */
export function useCatalogState(): CatalogStateValue {
  const value = useContext(CatalogStateContext);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);

  return hydrated ? value : empty;
}
