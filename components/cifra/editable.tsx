"use client";

import { useLayoutEffect, useRef } from "react";

// The node is left uncontrolled so typing never triggers a re-render, and the
// caret never jumps. Text is pushed in only when `value` changed upstream
// (a transposition, say) and the user isn't currently editing this node.
export function Editable({
  tag = "span",
  value,
  onCommit,
  className,
}: {
  tag?: "span" | "div";
  value: string;
  onCommit: (value: string) => void;
  className?: string;
}) {
  // satisfies both branches below; span and div carry no extra members
  const ref = useRef<HTMLDivElement & HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  const props = {
    ref,
    className,
    contentEditable: true,
    spellCheck: false,
    suppressContentEditableWarning: true,
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      // a token is a single line — keep browsers from injecting <div>/<br>
      if (e.key === "Enter") e.preventDefault();
    },
    onPaste: (e: React.ClipboardEvent<HTMLElement>) => {
      e.preventDefault();
      const text = e.clipboardData
        .getData("text/plain")
        .replace(/\s*\n\s*/g, " ");
      document.execCommand("insertText", false, text);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) =>
      onCommit(e.currentTarget.textContent ?? ""),
  };

  return tag === "div" ? <div {...props} /> : <span {...props} />;
}
