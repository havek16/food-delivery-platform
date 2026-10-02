"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface PopoverProps {
  trigger: ReactNode;
  panel: ReactNode;
  align?: "left" | "right";
}

export function Popover({ trigger, panel, align = "right" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div
        role="button"
        tabIndex={0}
        className="contents"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((o) => !o); } }}
      >
        {trigger}
      </div>
      {open && (
        <div className={`glass absolute top-12 z-50 rounded-2xl shadow-float ${align === "right" ? "right-0" : "left-0"}`}>
          {panel}
        </div>
      )}
    </div>
  );
}