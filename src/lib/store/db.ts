import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { CatalogState } from "@/lib/api/types";

const DB_NAME = "cheflan";
const DB_VERSION = 1;

export interface StoredRecord<T> {
  customerId: number;
  fetchedAt: number;
  data: T;
}

interface ChefLanDb extends DBSchema {
  catalogState: {
    key: number;
    value: StoredRecord<CatalogState>;
  };
}

/** Every store holds per-customer records keyed by `customerId`; the data type of each is listed here. */
export interface StoreData {
  catalogState: CatalogState;
}

export type StoreName = keyof StoreData;

const STORE_NAMES: StoreName[] = ["catalogState"];

let opening: Promise<IDBPDatabase<ChefLanDb> | null> | null = null;

/** Opened once, in the browser only. Null when IndexedDB is missing or blocked: callers treat that as "no record". */
function getDb(): Promise<IDBPDatabase<ChefLanDb> | null> {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }

  opening ??= openDB<ChefLanDb>(DB_NAME, DB_VERSION, {
    // Additive steps only: add a new `if (oldVersion < N)` block and bump DB_VERSION, never edit an old one.
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("catalogState", { keyPath: "customerId" });
      }
    },
  }).catch(() => null);

  return opening;
}

export async function readRecord<S extends StoreName>(store: S, customerId: number): Promise<StoredRecord<StoreData[S]> | null> {
  try {
    const db = await getDb();
    const record = await db?.get(store, customerId);

    return (record as StoredRecord<StoreData[S]> | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function writeRecord<S extends StoreName>(store: S, record: StoredRecord<StoreData[S]>): Promise<void> {
  try {
    const db = await getDb();
    await db?.put(store, record as StoredRecord<CatalogState>);
  } catch {
    // Storage full or blocked: the data is simply not kept.
  }
}

/** Removes everything stored for one customer, in every store. Called on logout. */
export async function deleteUserRecords(customerId: number): Promise<void> {
  try {
    const db = await getDb();

    if (!db) {
      return;
    }

    const tx = db.transaction(STORE_NAMES, "readwrite");
    await Promise.all([...STORE_NAMES.map((store) => tx.objectStore(store).delete(customerId)), tx.done]);
  } catch {
    // Nothing to clean up if the database is unavailable.
  }
}
