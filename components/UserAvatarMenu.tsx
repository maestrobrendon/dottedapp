"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Settings, LogOut } from "lucide-react";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function shortName(name: string | null): string {
  if (!name) return "Account";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

interface Props {
  name: string | null;
  image: string | null;
  showSettingsButton?: boolean;
}

export function UserAvatarMenu({ name, image, showSettingsButton }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      {showSettingsButton && (
        <Link
          href="/dashboard/settings"
          className="hidden lg:flex items-center gap-1.5 text-mist text-sm font-medium border border-hairline rounded-full px-4 min-h-9 hover:bg-[#F5F4F2] transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </Link>
      )}

      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full hover:bg-[#F5F4F2] transition-colors px-2 min-h-11"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-bloom-peach shrink-0 flex items-center justify-center">
            {image ? (
              <Image
                src={image}
                alt={name ?? "Avatar"}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-ink text-xs font-semibold">{initials(name)}</span>
            )}
          </div>
          <span className="text-ink text-sm font-medium hidden sm:block">{shortName(name)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-mist" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 bg-surface rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-hairline overflow-hidden z-30 min-w-[160px]">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-ink text-sm font-medium hover:bg-canvas transition-colors min-h-11"
            >
              <Settings className="w-4 h-4 text-mist shrink-0" />
              Settings
            </Link>
            <div className="border-t border-hairline" />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-ink text-sm font-medium hover:bg-canvas transition-colors min-h-11"
            >
              <LogOut className="w-4 h-4 text-mist shrink-0" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
