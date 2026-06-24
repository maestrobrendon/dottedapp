"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InlineConfirmation } from "./InlineConfirmation";

export function RegenerateFeedButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegenerate() {
    setLoading(true);
    try {
      await fetch("/api/feed/regenerate", { method: "POST" });
      router.refresh();
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming((v) => !v)}
        className="text-warning text-sm font-medium min-h-11"
      >
        Regenerate feed token
      </button>

      {confirming && (
        <InlineConfirmation
          title="Regenerate your feed token?"
          description="Your current Apple Calendar/Outlook subscription will stop working until you re-subscribe with the new link."
          confirmLabel="Yes, regenerate"
          onConfirm={handleRegenerate}
          onCancel={() => setConfirming(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
