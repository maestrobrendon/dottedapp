"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InlineConfirmation } from "./InlineConfirmation";
import { CopyIconButton } from "./CopyIconButton";

const RESERVED_SLUGS = new Set([
  "api", "app", "admin", "settings", "dashboard", "login", "logout",
  "signin", "signup", "auth", "u", "wall", "feed", "success", "event",
  "help", "support", "about", "terms", "privacy", "dottd",
]);

type Status = "idle" | "checking" | "available" | "taken" | "invalid";

interface StatusIndicatorProps {
  status: Status;
  message: string;
}

function StatusIndicator({ status, message }: StatusIndicatorProps) {
  if (status === "idle") return null;
  const color =
    status === "available" ? "text-success" :
    status === "checking"  ? "text-mist" :
    "text-[#FF5C3A]";
  return <p className={`text-xs font-medium mt-1 ${color}`}>{message}</p>;
}

interface Props {
  currentSlug: string;
  baseUrl: string; // e.g. "https://dottd.app" — without trailing slash
}

export function SlugEditor({ currentSlug: slugProp, baseUrl }: Props) {
  const router = useRouter();
  const [displaySlug, setDisplaySlug] = useState(slugProp);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slugProp);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when server re-renders with a new slug (after router.refresh)
  useEffect(() => {
    if (!editing) {
      setDisplaySlug(slugProp);
      setDraft(slugProp);
    }
  }, [slugProp, editing]);

  const domain = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  function validateLocally(value: string): string | null {
    if (value.length < 3 || value.length > 40) return "Only lowercase letters, numbers, and hyphens.";
    if (!/^[a-z0-9-]+$/.test(value)) return "Only lowercase letters, numbers, and hyphens.";
    if (value.startsWith("-") || value.endsWith("-")) return "Only lowercase letters, numbers, and hyphens.";
    if (RESERVED_SLUGS.has(value)) return "That word's reserved — try another.";
    return null;
  }

  const scheduleCheck = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const localErr = validateLocally(value);
      if (localErr) {
        setStatus("invalid");
        setStatusMessage(localErr);
        return;
      }

      if (value === displaySlug) {
        setStatus("available");
        setStatusMessage("Available");
        return;
      }

      setStatus("checking");
      setStatusMessage("Checking...");

      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/account/check-slug?value=${encodeURIComponent(value)}`,
          );
          if (!res.ok) { setStatus("idle"); return; }
          const data = (await res.json()) as {
            available: boolean;
            reason?: string;
            message?: string;
          };
          if (data.available) {
            setStatus("available");
            setStatusMessage("Available");
          } else {
            setStatus(data.reason === "reserved" || data.reason === "invalid" ? "invalid" : "taken");
            setStatusMessage(data.message ?? "Already taken");
          }
        } catch {
          setStatus("idle");
        }
      }, 400);
    },
    [displaySlug],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Auto-lowercase and strip invalid chars
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setDraft(val);
    scheduleCheck(val);
  }

  function enterEdit() {
    setDraft(displaySlug);
    setStatus("idle");
    setStatusMessage("");
    setConfirming(false);
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
  }

  function cancel() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setEditing(false);
    setDraft(displaySlug);
    setStatus("idle");
    setConfirming(false);
  }

  async function commitChange() {
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: draft }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setStatus("taken");
        setStatusMessage(data.error ?? "Already taken");
        setConfirming(false);
        return;
      }
      // Optimistic local update, then let the server catch up
      setDisplaySlug(draft);
      setEditing(false);
      setConfirming(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const canSave = draft !== displaySlug && status === "available";

  if (!editing) {
    const shareUrl = `${baseUrl}/u/${displaySlug}`;
    return (
      <div
        className="group flex items-center justify-between py-1 cursor-pointer rounded-[8px] -mx-1 px-1 hover:bg-[#F5F4F2] transition-colors"
        onClick={enterEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && enterEdit()}
      >
        <div className="min-w-0">
          <p className="text-mist text-xs font-medium uppercase tracking-wide">Your public link</p>
          <p className="text-ink font-medium mt-0.5 truncate">
            {domain}/u/{displaySlug}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <CopyIconButton url={shareUrl} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); enterEdit(); }}
            className="text-mist text-sm opacity-0 group-hover:opacity-100 transition-opacity min-h-11 px-2 shrink-0"
            tabIndex={-1}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1 space-y-2">
      <p className="text-mist text-xs font-medium uppercase tracking-wide">Your public link</p>

      {/* URL row: static prefix + editable slug */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-mist text-sm shrink-0">{domain}/u/</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Escape" && cancel()}
          placeholder={displaySlug}
          maxLength={40}
          className="bg-[#F0F0EE] rounded-[12px] px-3 py-2 text-ink focus:bg-white focus:ring-2 focus:ring-coral/30 outline-none transition-colors min-h-11 min-w-30 max-w-50"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      <StatusIndicator status={status} message={statusMessage} />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {canSave && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="bg-gradient-sunrise text-white text-sm font-semibold rounded-full px-4 py-2 active:scale-[0.97] transition-transform min-h-11"
          >
            Save
          </button>
        )}
        <button
          type="button"
          onClick={cancel}
          className="text-mist text-sm font-medium px-2 min-h-11"
        >
          Cancel
        </button>
      </div>

      {/* Inline confirmation before committing the slug change */}
      {confirming && (
        <InlineConfirmation
          title="Change your public link?"
          description="Your current share link will stop working immediately. Anyone you've already sent the old link to won't be able to use it."
          confirmLabel="Yes, change it"
          onConfirm={commitChange}
          onCancel={() => setConfirming(false)}
          loading={saving}
        />
      )}
    </div>
  );
}
