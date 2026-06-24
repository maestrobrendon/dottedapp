"use client";

import { useRef, useState, useEffect } from "react";

interface Props {
  label: string;
  initialValue: string;
  placeholder?: string;
  onSave: (value: string) => Promise<string | null>; // returns error message or null on success
  validate?: (value: string) => string | null;
}

export function InlineEditField({
  label,
  initialValue,
  placeholder,
  onSave,
  validate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(initialValue);
  const [draft, setDraft] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheck, setShowCheck] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancellingRef = useRef(false);

  // Sync if parent re-renders with a new value (e.g. after router.refresh)
  useEffect(() => {
    if (!editing) setCurrent(initialValue);
  }, [initialValue, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function enter() {
    cancellingRef.current = false;
    setDraft(current);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    cancellingRef.current = true;
    setEditing(false);
    setDraft(current);
    setError(null);
  }

  async function handleBlur() {
    if (cancellingRef.current) {
      cancellingRef.current = false;
      return;
    }
    const trimmed = draft.trim();
    // No change — just close without hitting the API
    if (trimmed === current) {
      setEditing(false);
      return;
    }
    if (validate) {
      const err = validate(trimmed);
      if (err) {
        setError(err);
        // Re-focus so the user can fix it — blur fired but we stay in edit
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
    }
    setSaving(true);
    const err = await onSave(trimmed);
    setSaving(false);
    if (err) {
      setError(err);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setCurrent(trimmed);
      setEditing(false);
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 1200);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      cancellingRef.current = true;
      inputRef.current?.blur();
      setEditing(false);
      setDraft(current);
      setError(null);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  }

  if (editing) {
    return (
      <div className="py-1">
        <p className="text-mist text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={saving}
            placeholder={placeholder}
            className="flex-1 bg-[#F0F0EE] rounded-[12px] px-3 py-2 text-ink focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors disabled:opacity-60 min-h-[44px]"
          />
          {saving && <span className="text-mist text-sm">…</span>}
        </div>
        {error && (
          <p className="text-[#FF5C3A] text-xs mt-1">{error}</p>
        )}
        <p className="text-mist text-xs mt-1">Press Enter to save, Esc to cancel</p>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center justify-between py-1 cursor-pointer rounded-[8px] -mx-1 px-1 hover:bg-[#F5F4F2] transition-colors"
      onClick={enter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && enter()}
    >
      <div>
        <p className="text-mist text-xs font-medium uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-ink font-medium">{current || "—"}</p>
          {showCheck && (
            <span className="text-success text-sm leading-none">✓</span>
          )}
        </div>
      </div>
      <button
        type="button"
        className="text-mist text-sm opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] px-2 shrink-0"
        onClick={(e) => { e.stopPropagation(); enter(); }}
        tabIndex={-1}
      >
        Edit
      </button>
    </div>
  );
}
