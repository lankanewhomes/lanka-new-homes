"use client";

import { Bold, Eraser, Italic, Link2, List, ListOrdered, Quote, Redo2, Underline, Undo2 } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef } from "react";

// Small rich-text editor (contentEditable + the browser's built-in formatting commands): bold, italic, underline, lists, quote, link.
// Exposes getHtml/setSignature so the compose window can keep the signature of the selected "From" mailbox in place.

export type RichEditorHandle = {
  getHtml: () => string;
  getText: () => string;
  setSignature: (html: string) => void;
  focus: () => void;
};

export const RichEditor = forwardRef<RichEditorHandle, { initialHtml: string; onChange: () => void }>(function RichEditor({ initialHtml, onChange }, ref) {
  const el = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);

  useImperativeHandle(ref, () => ({
    getHtml: () => el.current?.innerHTML ?? "",
    getText: () => el.current?.innerText ?? "",
    setSignature: (html: string) => {
      const sig = el.current?.querySelector("[data-lnh-signature]");
      if (sig) sig.innerHTML = html;
      onChange();
    },
    focus: () => el.current?.focus(),
  }));

  const cmd = (name: string, value?: string) => {
    el.current?.focus();
    document.execCommand(name, false, value);
    onChange();
  };
  const tool = (title: string, icon: React.ReactNode, run: () => void) => (
    <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={run}>{icon}</button>
  );

  return (
    <>
      <div className="lnh-editor-tools">
        {tool("Undo", <Undo2 size={15} />, () => cmd("undo"))}
        {tool("Redo", <Redo2 size={15} />, () => cmd("redo"))}
        {tool("Bold", <Bold size={15} />, () => cmd("bold"))}
        {tool("Italic", <Italic size={15} />, () => cmd("italic"))}
        {tool("Underline", <Underline size={15} />, () => cmd("underline"))}
        {tool("Bulleted list", <List size={15} />, () => cmd("insertUnorderedList"))}
        {tool("Numbered list", <ListOrdered size={15} />, () => cmd("insertOrderedList"))}
        {tool("Quote", <Quote size={15} />, () => cmd("formatBlock", "blockquote"))}
        {tool("Link", <Link2 size={15} />, () => {
          const url = window.prompt("Link address (https://…)");
          if (url && /^(https?:|mailto:)/i.test(url)) cmd("createLink", url);
        })}
        {tool("Clear formatting", <Eraser size={15} />, () => cmd("removeFormat"))}
      </div>
      <div
        ref={(node) => {
          el.current = node;
          if (node && !initialised.current) {
            node.innerHTML = initialHtml;
            initialised.current = true;
          }
        }}
        className="lnh-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Message"
        onInput={onChange}
        onPaste={(e) => {
          // Paste as plain text (keeps pasted pages from dragging their styles into the email).
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
      />
    </>
  );
});
