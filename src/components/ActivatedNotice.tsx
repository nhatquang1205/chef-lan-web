"use client";

import { useSearchParams } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";

/** Shown once after an invitation was accepted (`?activated=1`). */
export function ActivatedNotice({ dict }: { dict: Dictionary }) {
  if (useSearchParams().get("activated") !== "1") {
    return null;
  }

  return (
    <div role="status" className="mb-8 rounded border border-beige/30 bg-olive-raised px-4 py-3 text-beige">
      {dict.account.activated}
    </div>
  );
}
