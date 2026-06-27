"use client";
import { useState, useEffect, useRef } from "react";
import { CalendarHeart } from "lucide-react";

const SLIDES = [
  { name: "Tunde's birthday", date: "Jun 24" },
  { name: "Ada's anniversary", date: "Sep 2" },
  { name: "Baby naming ceremony", date: "Jul 14" },
];

const FADE_MS = 500;
const INTERVAL_MS = 3500;

export function DemoWidget() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const paused = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (paused.current) return;
      setVisible(false);
      timeoutRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % SLIDES.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const slide = SLIDES[index];

  return (
    <div
      className="flex flex-col items-center py-8"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onTouchStart={() => { paused.current = true; }}
    >
      {/* Widget area: ghost + main card + badge, all in a bounded relative container */}
      <div className="relative w-72">
        {/* Ghost card — absolute, peeks behind and to the side */}
        <div
          className="absolute top-0 left-0 w-64 h-40 bg-white/40 rounded-[20px] rotate-3 translate-x-3 translate-y-2"
          aria-hidden
        />

        {/* Main card wrapper — relative so badge escapes overflow-hidden */}
        <div className="relative">
          {/* Gradient shell — overflow-hidden keeps bg clipped to rounded corners */}
          <div className="rounded-[28px] p-6 overflow-hidden bg-gradient-bloom">
            <div
              className="backdrop-blur-2xl rounded-[20px] p-5 transition-opacity duration-500"
              style={{
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 8px 32px rgba(255,122,89,0.12)",
                opacity: visible ? 1 : 0,
              }}
            >
              <p className="text-mist text-sm font-medium">{slide.name}</p>
              <p
                className="text-ink text-[56px] font-bold leading-none tracking-tight"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {slide.date}
              </p>
              <p className="text-coral text-sm font-medium mt-2">
                Saved to your calendar
              </p>
            </div>
          </div>

          {/* Badge — outside overflow-hidden so it overlaps the card edge */}
          <div className="absolute -bottom-4 -right-2 w-11 h-11 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center">
            <CalendarHeart className="w-5 h-5 text-coral" />
          </div>
        </div>
      </div>

      {/* Pagination dots — mobile only, synced to cycle index */}
      <div className="flex gap-2 mt-8 lg:hidden" aria-hidden>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === index ? "w-4 h-2 bg-coral" : "w-2 h-2 bg-coral/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
