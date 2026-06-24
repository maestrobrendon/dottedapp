"use client";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MAX_DAYS: Record<number, number> = {
  1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

interface Props {
  month: number;
  day: number;
  year?: number | null;
  showYear?: boolean;
  onMonthChange: (m: number) => void;
  onDayChange: (d: number) => void;
  onYearChange?: (y: number | null) => void;
}

export function MonthDayPicker({
  month, day, year, showYear, onMonthChange, onDayChange, onYearChange,
}: Props) {
  const maxDay = MAX_DAYS[month] ?? 31;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const selectClass =
    "bg-[#F0F0EE] rounded-[12px] px-4 py-3 text-ink placeholder:text-mist focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors appearance-none min-h-[44px] w-full";

  return (
    <div className="flex gap-2">
      <select
        value={month}
        onChange={(e) => {
          const m = Number(e.target.value);
          onMonthChange(m);
          if (day > (MAX_DAYS[m] ?? 31)) onDayChange(MAX_DAYS[m] ?? 28);
        }}
        className={selectClass}
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>

      <select
        value={day}
        onChange={(e) => onDayChange(Number(e.target.value))}
        className={`${selectClass} max-w-[90px]`}
      >
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {showYear && onYearChange && (
        <input
          type="number"
          placeholder="Year"
          value={year ?? ""}
          min={1900}
          max={2100}
          onChange={(e) =>
            onYearChange(e.target.value ? Number(e.target.value) : null)
          }
          className={`${selectClass} max-w-[100px]`}
        />
      )}
    </div>
  );
}
