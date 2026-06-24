"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface UploadResult {
  imageUrl: string;
  imagePublicId: string;
}

interface Props {
  onUpload: (result: UploadResult | null) => void;
}

export function PhotoUploadTile({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, or WebP photos are accepted.");
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setError(null);
    setUploading(true);
    onUpload(null);

    try {
      // Get signed upload params from our server
      const sigRes = await fetch("/api/cloudinary/sign");
      if (!sigRes.ok) throw new Error("Could not get upload signature.");
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
      if (!uploadRes.ok) throw new Error("Upload failed.");
      const data = (await uploadRes.json()) as {
        secure_url: string;
        public_id: string;
      };

      onUpload({ imageUrl: data.secure_url, imagePublicId: data.public_id });
    } catch (err) {
      setError("Photo upload failed. Your event will still be saved without it.");
      setPreview(null);
      onUpload(null);
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clear() {
    setPreview(null);
    onUpload(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="relative w-full aspect-video rounded-[12px] overflow-hidden">
          <Image src={preview} alt="Preview" fill className="object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-medium">Uploading…</span>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
              aria-label="Remove photo"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="w-full min-h-[120px] rounded-[12px] border-2 border-dashed border-hairline bg-[#F0F0EE] flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-[#E8E8E6] transition-colors"
        >
          <span className="text-2xl" aria-hidden>📷</span>
          <span className="text-mist text-sm font-medium">Add a photo (optional)</span>
          <span className="text-mist text-xs">JPEG · PNG · WebP · up to 5MB</span>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
