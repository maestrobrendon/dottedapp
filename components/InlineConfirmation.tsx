"use client";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function InlineConfirmation({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <div className="bg-[#FFF4F0] rounded-[12px] p-3 mt-2">
      <p className="text-ink text-sm font-medium">{title}</p>
      <p className="text-mist text-xs mt-1 leading-relaxed">{description}</p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="bg-coral text-white text-sm font-semibold rounded-full px-4 py-2 active:scale-[0.97] transition-transform disabled:opacity-60 min-h-[44px]"
        >
          {loading ? "…" : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-mist text-sm font-medium px-4 py-2 min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
