"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  NOTES_SHARP,
  CHORD_QUALITIES,
  splitChord,
  buildChord,
  type ChordParts,
} from "@/lib/cifra/chords";

// Rendered into document.body rather than next to the chord: the sheet is a
// multi-column, overflow-clipped container, which would crop an absolutely
// positioned child.
export function ChordPicker({
  value,
  anchor,
  onChange,
  onClose,
}: {
  value: string;
  anchor: HTMLElement;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const { root, quality, bass } = splitChord(value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const a = anchor.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const margin = 8;

    let left = a.left + a.width / 2 - box.width / 2;
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - box.width - margin),
    );

    let top = a.bottom + 6;
    if (top + box.height > window.innerHeight - margin) {
      top = Math.max(margin, a.top - box.height - 6);
    }

    setPos({ top, left });
  }, [anchor, value]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [anchor, onClose]);

  const set = (patch: Partial<ChordParts>) =>
    onChange(buildChord({ root, quality, bass, ...patch }));

  return createPortal(
    <div
      ref={ref}
      className="chord-picker"
      style={{ top: pos.top, left: pos.left }}
      role="dialog"
      aria-label="Escolher acorde"
    >
      <div className="cp-head">
        <span className="cp-preview">{value || "?"}</span>
        <button className="cp-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </div>

      <div className="cp-label">Tônica</div>
      <div className="cp-grid cp-roots">
        {NOTES_SHARP.map((n) => (
          <button
            key={n}
            className={"cp-opt" + (n === root ? " is-active" : "")}
            onClick={() => set({ root: n })}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="cp-label">Tipo</div>
      <div className="cp-grid cp-quals">
        {CHORD_QUALITIES.map((q) => (
          <button
            key={q.value}
            className={"cp-opt" + (q.value === quality ? " is-active" : "")}
            onClick={() => set({ quality: q.value })}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="cp-label">Baixo invertido</div>
      <div className="cp-grid cp-roots">
        <button
          className={"cp-opt" + (bass === "" ? " is-active" : "")}
          onClick={() => set({ bass: "" })}
          title="Sem baixo invertido"
        >
          —
        </button>
        {NOTES_SHARP.map((n) => (
          <button
            key={n}
            className={"cp-opt" + (n === bass ? " is-active" : "")}
            onClick={() => set({ bass: n })}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="cp-custom">
        <label className="cp-label" htmlFor="cp-free">
          Outro
        </label>
        <input
          id="cp-free"
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>,
    document.body,
  );
}
