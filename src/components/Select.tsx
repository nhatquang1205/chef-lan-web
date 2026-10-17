"use client";

import { useId, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A styled combo box in place of the browser's own dropdown. It submits through a hidden input, so it
 * works inside the plain GET filter form. Focus stays on the button; arrows move the highlight.
 */
export function Select({ id, name, options, defaultValue }: { id: string; name: string; options: SelectOption[]; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex];

  const show = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    setValue(options[index].value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) {
          show();
        } else {
          const step = event.key === "ArrowDown" ? 1 : -1;
          setActive((index) => (index + step + options.length) % options.length);
        }
        break;
      }
      case "Home":
      case "End":
        if (open) {
          event.preventDefault();
          setActive(event.key === "Home" ? 0 : options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        if (open) {
          event.preventDefault();
          choose(active);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-4 rounded border border-beige/30 bg-olive py-2 pl-3 pr-3 text-left text-beige hover:border-beige/60"
      >
        <span className="truncate">{selected.label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className={`shrink-0 text-beige/70 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          // Keeps focus on the button, so a click selects without blurring the control first.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-beige/20 bg-olive-raised p-1 shadow-xl"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded px-3 py-2 ${index === active ? "bg-beige/10 text-beige" : "text-beige/85"}`}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className="shrink-0">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
