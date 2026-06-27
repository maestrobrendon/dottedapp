"use client";
import { useEffect, useState } from "react";

interface Countdown {
  months: number;
  days: number;
  hrs: number;
  mins: number;
}

function compute(targetMs: number): Countdown {
  const diff = Math.max(0, targetMs - Date.now());
  const totalMins = Math.floor(diff / 60_000);
  const mins = totalMins % 60;
  const totalHrs = Math.floor(totalMins / 60);
  const hrs = totalHrs % 24;
  const totalDays = Math.floor(totalHrs / 24);
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  return { months, days, hrs, mins };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const LABELS = ["MONTHS", "DAYS", "HRS", "MINS"] as const;

interface Props {
  dateMs: number;
}

export function UpNextCountdown({ dateMs }: Props) {
  const [mounted, setMounted] = useState(false);
  const [cd, setCd] = useState<Countdown>({ months: 0, days: 0, hrs: 0, mins: 0 });

  useEffect(() => {
    setCd(compute(dateMs));
    setMounted(true);
    const id = setInterval(() => setCd(compute(dateMs)), 60_000);
    return () => clearInterval(id);
  }, [dateMs]);

  if (!mounted) {
    // Placeholder skeleton same size as real boxes to prevent layout shift
    return (
      <div className="hidden lg:flex gap-4">
        {LABELS.map((l) => (
          <div key={l} className="text-center w-10">
            <div className="h-7 bg-white/30 rounded animate-pulse" />
            <div className="h-2 bg-white/20 rounded mt-1 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const values = [cd.months, cd.days, cd.hrs, cd.mins];

  return (
    <div className="hidden lg:flex gap-4">
      {LABELS.map((label, i) => (
        <div key={label} className="text-center">
          <p
            className="text-ink text-2xl font-bold leading-none"
            style={{ fontFeatureSettings: '"tnum"' }}
          >
            {pad(values[i])}
          </p>
          <p className="text-mist text-[9px] font-semibold tracking-wider mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
