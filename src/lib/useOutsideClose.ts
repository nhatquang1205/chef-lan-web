import { useEffect, useRef, type RefObject } from "react";

/** While `open`, calls `close` on a pointerdown anywhere outside every element in `refs`. */
export function useOutsideClose(open: boolean, refs: RefObject<HTMLElement | null>[], close: () => void) {
  const latest = useRef({ refs, close });

  useEffect(() => {
    latest.current = { refs, close };
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!latest.current.refs.some((ref) => ref.current?.contains(target))) {
        latest.current.close();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);
}
