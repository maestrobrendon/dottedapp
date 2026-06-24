"use client";

import { useState } from "react";

interface Props {
  url: string;
  label?: string;
}

export function ShareLink({ url, label = "Your share link" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <p className="text-mist text-xs font-medium uppercase tracking-wide">{label}</p>}
      <div className="flex items-center gap-2 bg-[#F0F0EE] rounded-[12px] px-4 py-3">
        <span className="text-ink text-sm flex-1 truncate font-medium">{url}</span>
        <button
          type="button"
          onClick={copy}
          className={`text-sm font-semibold shrink-0 min-h-11 min-w-11 flex items-center justify-center gap-1 active:scale-[0.97] transition-all ${
            copied ? "text-success" : "text-coral"
          }`}
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Copied</span>
            </>
          ) : (
            "Copy"
          )}
        </button>
      </div>
    </div>
  );
}
