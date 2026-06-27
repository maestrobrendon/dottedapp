"use client";
import { ChevronRight } from "lucide-react";

interface Props {
  targetId: string;
}

export function ScrollToButton({ targetId }: Props) {
  function handleClick() {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-coral", "ring-offset-1");
    setTimeout(() => el.classList.remove("ring-2", "ring-coral", "ring-offset-1"), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to event"
      className="lg:hidden w-9 h-9 rounded-full bg-white/70 border border-white/60 flex items-center justify-center active:scale-[0.97] transition-transform shrink-0"
    >
      <ChevronRight className="w-4 h-4 text-ink" />
    </button>
  );
}
