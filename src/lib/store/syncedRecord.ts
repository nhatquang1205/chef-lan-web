"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readRecord, writeRecord, type StoreData, type StoreName } from "./db";

interface SyncedRecordOptions<S extends StoreName> {
  store: S;
  /** The customer's id; null = nobody (or not a customer); undefined = not known yet (session still loading). */
  userId: number | null | undefined;
  maxAgeMs: number;
  /** Returns fresh data, or null when it cannot be fetched right now. May throw. */
  fetch: () => Promise<StoreData[S] | null>;
}

interface SyncedRecord<S extends StoreName> {
  data: StoreData[S] | null;
  /** Fetches now, whatever the age of the stored copy. Does nothing for nobody (not a customer, or session loading). */
  refresh(): void;
}

/**
 * The stored copy for the signed-in customer, shown at once and refreshed from the API when it is missing or
 * `maxAgeMs` old: on load, on a timer, and when the tab becomes visible again. A fetch right after login (or an
 * account switch) is forced. A failed fetch keeps the stored copy and waits for the next trigger.
 */
export function useSyncedRecord<S extends StoreName>({ store, userId, maxAgeMs, fetch }: SyncedRecordOptions<S>): SyncedRecord<S> {
  const [state, setState] = useState<{ userId: number; data: StoreData[S] } | null>(null);
  const fetchRef = useRef(fetch);
  const previousUser = useRef<number | null | undefined>(undefined);
  const forcePending = useRef(false);
  const refreshRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetchRef.current = fetch;
  });

  useEffect(() => {
    if (userId === undefined) {
      return;
    }

    const previous = previousUser.current;
    previousUser.current = userId;

    if (userId === null) {
      return;
    }

    // Signed out before, or another account: do not trust a copy that may predate this sign-in.
    if (previous === null || (typeof previous === "number" && previous !== userId)) {
      forcePending.current = true;
    }

    let cancelled = false;
    let inFlight = false;
    let again = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(), delay);
    };

    async function load() {
      const record = await readRecord(store, userId as number);

      if (cancelled) {
        return;
      }

      if (record) {
        setState({ userId: userId as number, data: record.data });
      }

      const age = record ? Date.now() - record.fetchedAt : Infinity;

      if (!forcePending.current && age < maxAgeMs) {
        schedule(maxAgeMs - age);
        return;
      }

      if (inFlight) {
        // The running fetch may have been answered before the change that caused this one.
        again ||= forcePending.current;
        return;
      }

      inFlight = true;
      forcePending.current = false;

      try {
        const data = await fetchRef.current();

        if (cancelled || data == null) {
          return;
        }

        await writeRecord(store, { customerId: userId as number, fetchedAt: Date.now(), data });

        if (!cancelled) {
          setState({ userId: userId as number, data });
          schedule(maxAgeMs);
        }
      } catch {
        // Keep the stored copy; the next trigger tries again.
      } finally {
        inFlight = false;

        if (again && !cancelled) {
          again = false;
          void load();
        }
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    refreshRef.current = () => {
      forcePending.current = true;
      void load();
    };

    document.addEventListener("visibilitychange", onVisible);
    void load();

    return () => {
      cancelled = true;
      refreshRef.current = null;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [store, userId, maxAgeMs]);

  const refresh = useCallback(() => refreshRef.current?.(), []);

  return { data: state && state.userId === userId ? state.data : null, refresh };
}
