"use client";

import { type EventType } from "@/lib/validations";

const OPTIONS: { value: EventType; label: string }[] = [
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "ANNIVERSARY", label: "Anniversary" },
  { value: "CEREMONY", label: "Ceremony" },
  { value: "CUSTOM", label: "Custom" },
];

interface Props {
  value: EventType;
  onChange: (value: EventType) => void;
}

export function EventTypePicker({ value, onChange }: Props) {
  return (
    <div className="inline-flex bg-[#F0F0EE] rounded-full p-1 w-full">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-all min-h-[44px] ${
            value === opt.value
              ? "bg-white shadow-sm text-ink"
              : "text-mist"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
