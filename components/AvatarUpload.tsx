"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
  currentImage: string | null;
  userName: string | null;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AvatarUpload({ currentImage, userName }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(currentImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP.");
      return;
    }

    setError(null);
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setImage(localUrl);

    try {
      const sigRes = await fetch("/api/cloudinary/sign");
      if (!sigRes.ok) throw new Error();
      const { signature, timestamp, cloudName, apiKey, uploadPreset } =
        (await sigRes.json()) as {
          signature: string;
          timestamp: number;
          cloudName: string;
          apiKey: string;
          uploadPreset: string;
        };

      const form = new FormData();
      form.append("file", file);
      form.append("signature", signature);
      form.append("timestamp", String(timestamp));
      form.append("api_key", apiKey);
      form.append("upload_preset", uploadPreset);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      if (!uploadRes.ok) throw new Error();
      const { secure_url } = (await uploadRes.json()) as { secure_url: string };

      await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: secure_url }),
      });

      setImage(secure_url);
      router.refresh();
    } catch {
      setError("Upload failed — please try again.");
      setImage(currentImage);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 pb-4 border-b border-hairline">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <div className="relative w-16 h-16 shrink-0">
        {image ? (
          <Image
            src={image}
            alt={userName ?? "Avatar"}
            fill
            className="object-cover rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-bloom-peach flex items-center justify-center text-ink font-semibold text-lg">
            {initials(userName)}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-medium">…</span>
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-coral text-sm font-semibold min-h-11 flex items-center disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Change photo"}
        </button>
        <p className="text-mist text-xs">JPEG · PNG · WebP · up to 5MB</p>
        {error && <p className="text-[#FF5C3A] text-xs mt-1">{error}</p>}
      </div>
    </div>
  );
}
