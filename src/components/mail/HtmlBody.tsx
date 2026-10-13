"use client";

import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

// Renders an email body safely: sanitised with DOMPurify, shown in a script-less sandboxed iframe, remote images blocked until the
// reader clicks "Show images" (tracking pixels never load by default), links always open in a new tab.

const REMOTE = /^(https?:)?\/\//i;

export function sanitizeEmailHtml(html: string, showImages: boolean): { html: string; blocked: number } {
  let blocked = 0;
  const hook = (node: Element) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") ?? "";
      if (REMOTE.test(src) && !showImages) {
        blocked += 1;
        node.setAttribute("data-blocked-src", src);
        node.removeAttribute("src");
        node.removeAttribute("srcset");
      }
    }
    const style = node.getAttribute("style");
    if (style && /url\(/i.test(style) && !showImages) {
      blocked += 1;
      node.setAttribute("style", style.replace(/url\([^)]*\)/gi, "none"));
    }
  };
  DOMPurify.addHook("afterSanitizeAttributes", hook);
  try {
    const clean = DOMPurify.sanitize(html, { ADD_TAGS: ["style"], FORCE_BODY: true, FORBID_TAGS: ["form", "input", "button", "textarea", "select", "iframe", "object", "embed", "script"], FORBID_ATTR: ["srcset"].filter(() => !showImages) });
    return { html: clean, blocked };
  } finally {
    DOMPurify.removeHook("afterSanitizeAttributes");
  }
}

export function HtmlBody({ html }: { html: string }) {
  const [showImages, setShowImages] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(80);
  const safe = useMemo(() => sanitizeEmailHtml(html || "", showImages), [html, showImages]);
  const doc = useMemo(
    () => `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#222;word-wrap:break-word;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}blockquote{margin:0 0 0 4px;padding-left:12px;border-left:2px solid #ddd;color:#666}pre{white-space:pre-wrap}</style></head><body>${safe.html}</body></html>`,
    [safe.html],
  );

  const measure = () => {
    const d = frame.current?.contentDocument;
    if (d?.documentElement) setHeight(Math.max(60, d.documentElement.scrollHeight + 4));
  };
  useEffect(() => {
    const t = setTimeout(measure, 150);
    return () => clearTimeout(t);
  }, [doc]);

  return (
    <div>
      {safe.blocked > 0 && !showImages ? (
        <div className="lnh-mail-imgbar">
          <ImageOff size={14} /> Remote images are hidden.
          <button type="button" className="lnh-mail-btn" style={{ height: 26 }} onClick={() => setShowImages(true)}>Show images</button>
        </div>
      ) : null}
      <iframe ref={frame} title="Email" className="lnh-mail-frame" style={{ height }} sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" srcDoc={doc} onLoad={measure} />
    </div>
  );
}
