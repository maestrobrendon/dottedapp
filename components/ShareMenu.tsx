"use client";

import { useEffect, useRef, useState } from "react";

const WHATSAPP_TEXT = "Hey! Save your birthday here so I never forget it 🎂";

interface Props {
  url: string;
  label?: string;
}

export function ShareMenu({ url, label = "Your share link" }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setOpen(false);
    setTimeout(() => setCopied(false), 2000);
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${WHATSAPP_TEXT}\n${url}`)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(`${WHATSAPP_TEXT}\n${url}`)}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <p className="text-mist text-xs font-medium uppercase tracking-wide">{label}</p>
      )}
      <div className="flex items-center gap-2 bg-[#F0F0EE] rounded-[12px] px-4 py-3">
        <span className="text-ink text-sm flex-1 truncate font-medium">{url}</span>

        <div ref={containerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`text-sm font-semibold min-h-11 min-w-11 flex items-center justify-center gap-1 active:scale-[0.97] transition-all ${
              copied ? "text-success" : "text-coral"
            }`}
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Copied</span>
              </>
            ) : (
              "Share"
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 bg-surface rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-hairline overflow-hidden z-20 min-w-[180px]">
              <button
                type="button"
                onClick={copyLink}
                className="w-full text-left px-4 py-3 text-ink text-sm font-medium hover:bg-canvas transition-colors min-h-11 flex items-center gap-2"
              >
                Copy link
              </button>
              <div className="border-t border-hairline" />
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-ink text-sm font-medium hover:bg-canvas transition-colors min-h-11 flex items-center gap-2"
              >
                Share via WhatsApp
              </a>
              <div className="border-t border-hairline" />
              <a
                href={smsUrl}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-ink text-sm font-medium hover:bg-canvas transition-colors min-h-11 flex items-center gap-2"
              >
                Share via SMS
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
