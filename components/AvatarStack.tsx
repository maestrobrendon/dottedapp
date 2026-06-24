const PASTEL = ["bg-bloom-pink", "bg-bloom-peach", "bg-[#F0F0EE]"];

interface Props {
  names: string[];
  max?: number;
}

export function AvatarStack({ names, max = 3 }: Props) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;

  return (
    <div className="flex -space-x-3">
      {shown.map((name, i) => (
        <div
          key={i}
          className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-ink text-sm font-semibold ${PASTEL[i % PASTEL.length]}`}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-9 h-9 rounded-full border-2 border-white bg-[#F0F0EE] flex items-center justify-center text-mist text-sm font-semibold">
          +{extra}
        </div>
      )}
    </div>
  );
}
