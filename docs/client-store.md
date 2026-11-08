# Client store (IndexedDB)

Per-customer data the browser keeps for itself: what a customer owns and pays, and later bookmarks, history and the like.

## Why IndexedDB

Server-rendered pages are cached for everybody, so they cannot know who is looking. Personal data therefore has to come
from the browser: fetched from the API with the customer's token, kept in IndexedDB (structured, larger than
localStorage, async) and applied on top of the cached page. localStorage stays for the session and the small
watch history (`src/lib/history.ts`, left as is).

Never store here: tokens, signed video links, or anything secret. Anything in the browser is readable by any script on the page.

## The database

`src/lib/store/db.ts`: database `cheflan`, opened lazily and once, browser only (never during SSR or build).
Without IndexedDB (private mode, blocked) every read is "no record" and every write is a no-op; nothing shows an error.

| Version | Change |
|---|---|
| 1 | store `catalogState`, keyPath `customerId`, value `{ customerId, fetchedAt, data }` |

Upgrades are additive steps in `upgrade(db, oldVersion)`: `if (oldVersion < N) { ... }`, then bump `DB_VERSION`. Never edit an earlier step.

Records are per account (`customerId`). `deleteUserRecords(customerId)` clears every store for that customer and is called by
`AuthProvider.logout`. Only customers have records: staff and anonymous visitors fetch nothing.

## Refreshing: `useSyncedRecord`

`src/lib/store/syncedRecord.ts`: `useSyncedRecord({ store, userId, maxAgeMs, fetch })` returns the data or null.

- The stored copy is returned at once; a fetch happens when there is none or it is `maxAgeMs` old.
- `userId`: `undefined` while the session loads, `null` for nobody. A change from signed out to a customer (login, accepting an
  invite) or to another customer forces a fetch.
- A timer fires at `fetchedAt + maxAgeMs`; when the tab becomes visible the record is re-read (another tab may have refreshed it)
  and fetched if due. Timer and listener are removed on cleanup (pages stay mounted in React Activity).
- A failed fetch keeps the stored copy; the next trigger tries again.

## Catalog state

`CatalogStateProvider` (inside `AuthProvider`) fetches `GET /api/v1/me/catalog-state` every 30 minutes at most and exposes
`useCatalogState()` -> `{ isOwned(courseId), finalPriceOf(courseId) }` (empty for anyone but a signed-in customer). The home page's
`HeroSlider` and `CategorySection` hide owned courses and show the reduced price. A course approved by staff may stay on the home page up to 30 minutes.

## Adding a feature (bookmarks, history...)

1. New version step in `db.ts` creating the store, and an entry in `StoreData` and `STORE_NAMES`.
2. A function in `src/lib/api/` for the endpoint, a provider next to `CatalogStateProvider` using `useSyncedRecord`.
3. Mount the provider in `app/[lang]/layout.tsx` inside `AuthProvider`. Logout cleanup is automatic via `deleteUserRecords`.
