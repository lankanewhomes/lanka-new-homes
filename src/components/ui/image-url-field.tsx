"use client";

import { useRef, useState } from "react";

// Drop-in replacement for a plain "image URL" text input — keeps the URL
// field (pasting a link still works) but adds an "Upload" button that
// sends the file to /api/uploads/image and fills the URL field in with the
// result. Used anywhere a photo/logo URL is collected outside Payload's own
// admin panel (which has its own Media upload flow already).
export function ImageUrlField({
  value,
  onChange,
  folder,
  placeholder = "https://...",
  className = "w-full border border-stone-300 px-3 py-2 text-sm",
}: {
  value: string;
  onChange: (url: string) => void;
  folder: "avatars" | "logos";
  placeholder?: string;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await fetch("/api/uploads/image", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Upload failed");
      onChange(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={className} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="whitespace-nowrap border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload image"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Preview" className="h-16 w-16 rounded-full border border-stone-200 object-cover" />
      ) : null}
    </div>
  );
}
