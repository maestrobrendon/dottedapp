"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WidgetCard } from "./WidgetCard";
import { MonthDayPicker } from "./MonthDayPicker";

const today = new Date();

interface Props {
  userName: string;
}

export function OnboardingClient({ userName }: Props) {
  const router = useRouter();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [day, setDay] = useState(today.getDate());
  const [loading, setLoading] = useState(false);

  async function markSeen() {
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingSeen: true }),
    });
  }

  async function handleAdd() {
    setLoading(true);
    try {
      await fetch("/api/events/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "BIRTHDAY", month, day }),
      });
      await markSeen();
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      await markSeen();
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-bloom flex flex-col items-center justify-center px-4 py-12 gap-8">
      <div className="w-full max-w-sm">
        <WidgetCard
          name={userName || "You"}
          month={month}
          day={day}
          tagline="Your birthday · yearly"
        />
      </div>

      <div className="w-full max-w-sm space-y-2 text-center">
        <h1 className="text-[28px] font-bold text-ink tracking-tight leading-tight">
          Want to add your own birthday?
        </h1>
        <p className="text-mist text-base leading-relaxed">
          We&apos;ll save it to your calendar and include it if you ever share your link
          with people who collect dates the same way.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <MonthDayPicker
          month={month}
          day={day}
          onMonthChange={setMonth}
          onDayChange={setDay}
        />
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading}
          className="w-full bg-gradient-sunrise text-white font-semibold rounded-full px-6 py-4 active:scale-[0.97] transition-transform disabled:opacity-60"
        >
          {loading ? "Saving…" : "Add to my calendar"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className="w-full text-mist text-sm font-medium py-2 min-h-11"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
