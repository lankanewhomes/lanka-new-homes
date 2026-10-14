"use client";

import { useRef, useState } from "react";
import { ImageIcon, Link as LinkIcon, UploadCloud, X } from "lucide-react";
import { FieldShell, inputCls, isReadOnly, type FieldProps } from "./shared";

/**
 * Payload upload, and the image-URL text fields (heroImage, logo, gallery images…) that point at the media bucket.
 * Dropping a file previews it locally; the real version would send it to Payload's media collection / R2.
 */
export function UploadField({ field, value, onChange, path, ctx, readOnly }: FieldProps<string | number | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [broken, setBroken] = useState(false);
  const url = typeof value === "string" ? value : "";
  const isImg = /^(https?:|blob:|data:)/.test(url) && !/\.(pdf|mp4|docx?)$/i.test(url);
  const take = (file?: File) => {
    if (!file) return;
    setBroken(false);
    onChange(URL.createObjectURL(file));
  };
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!ro) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!ro) take(e.dataTransfer.files[0]); }}
        className={`rounded-lg border border-dashed p-3 transition ${over ? "border-accent bg-accent-soft" : "border-line bg-panel"}`}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-md bg-subtle text-muted">
            {isImg && !broken ? (
              // eslint-disable-next-line @next/next/no-img-element -- mock preview of an arbitrary URL
              <img src={url} alt="" onError={() => setBroken(true)} className="h-full w-full object-cover" />
            ) : <ImageIcon size={22} />}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <UploadCloud size={16} className="text-muted" />
              <span className="text-muted">Drop an image here or</span>
              <button type="button" disabled={ro} onClick={() => input.current?.click()} className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-medium hover:border-accent/60 hover:text-accent disabled:opacity-50">Choose file</button>
              {url && !ro ? <button type="button" onClick={() => onChange(null)} className="ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-bad"><X size={13} /> Remove</button> : null}
            </div>
            <div className="relative">
              <LinkIcon size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={url} disabled={ro} onChange={(e) => { setBroken(false); onChange(e.target.value); }} placeholder="…or paste the image address" className={`${inputCls} py-1.5 pl-8 text-xs`} />
            </div>
          </div>
        </div>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => take(e.target.files?.[0])} />
      </div>
    </FieldShell>
  );
}
