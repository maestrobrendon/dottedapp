const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Props {
  name: string;
  month: number;
  day: number;
  tagline?: string;
}

export function WidgetCard({ name, month, day, tagline }: Props) {
  const monthStr = MONTH_SHORT[month - 1] ?? "";
  return (
    <div className="relative rounded-[28px] p-6 overflow-hidden bg-gradient-bloom">
      <div
        className="backdrop-blur-2xl rounded-[20px] p-5"
        style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 8px 32px rgba(255,122,89,0.12)",
        }}
      >
        <p className="text-mist text-sm font-medium">{name}</p>
        <p
          className="text-ink text-[56px] font-bold leading-none tracking-tight"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {monthStr} {day}
        </p>
        {tagline && (
          <p className="text-coral text-sm font-medium mt-2">{tagline}</p>
        )}
      </div>
    </div>
  );
}
