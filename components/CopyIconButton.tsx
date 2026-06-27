"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  url: string;
}

export function CopyIconButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy link"
      className="text-mist hover:text-coral transition-colors min-h-11 min-w-11 flex items-center justify-center shrink-0"
    >
      {copied ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
