"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ControlsPanel } from "./controls-panel";
import { Toolbar } from "./toolbar";
import { Sheet } from "./sheet";
import { ChordPicker } from "./chord-picker";
import { OrganizeBar } from "./organize-bar";
import {
  parseCifra,
  transposeLines,
  keyAfterShift,
  noteIndex,
  applySection,
  separateRange,
  removeLines,
  type Line,
} from "@/lib/cifra/chords";

import "./cifra.css";

// Usable height of one A4 page minus the 13mm print margins, in CSS px at
// 96dpi.
const PAGE_PX = ((297 - 26) / 25.4) * 96;

type Picker = { lineId: string; index: number; anchor: HTMLElement };
type Selection = { anchorId: string; focusId: string };

export function CifraApp() {
  const [rawText, setRawText] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [originalKey, setOriginalKey] = useState<string | null>(null);
  const [shift, setShift] = useState(0);
  const [meta, setMeta] = useState({ titulo: "", artista: "", capo: "" });
  const [fontSize, setFontSize] = useState(10);
  const [columnMode, setColumnMode] = useState("auto");
  const [sheetHeight, setSheetHeight] = useState(0);
  const [hasSheet, setHasSheet] = useState(false);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  // Measured on a hidden mirror that is always one column at the real printed
  // width. Measuring the visible sheet instead would make the auto mode
  // oscillate: two columns halve the height, which flips it back to one.
  const measureRef = useRef<HTMLDivElement>(null);
  const currentKey = keyAfterShift(originalKey, shift);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setSheetHeight(el.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasSheet]);

  const overflowsOnePage = sheetHeight > PAGE_PX;
  const columns =
    columnMode === "auto" ? (overflowsOnePage ? 2 : 1) : Number(columnMode);
  const estimatedPages = Math.max(
    1,
    Math.ceil(sheetHeight / (PAGE_PX * columns)),
  );

  function handleProcess() {
    if (!rawText.trim()) return;
    const parsed = parseCifra(rawText);
    setLines(parsed.lines);
    setOriginalKey(parsed.originalKey);
    setShift(0);
    setMeta({
      titulo: parsed.titulo || "",
      artista: parsed.artista || "",
      capo: "",
    });
    setHasSheet(true);
  }

  function applyShift(delta: number) {
    if (!delta) return;
    setLines((prev) => transposeLines(prev, delta));
    setShift((prev) => (((prev + delta) % 12) + 12) % 12);
  }

  function jumpToKey(target: string) {
    if (!currentKey) return;
    const from = noteIndex(currentKey);
    const to = noteIndex(target);
    if (from === null || to === null) return;
    applyShift((((to - from) % 12) + 12) % 12);
  }

  function editLyrics(id: string, text: string) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id && l.type === "lyrics" ? { ...l, text } : l,
      ),
    );
  }

  function editToken(id: string, index: number, value: string) {
    setLines((prev) =>
      prev.map((l) =>
        l.id === id && (l.type === "chords" || l.type === "header")
          ? {
              ...l,
              tokens: l.tokens.map((t, i) =>
                i === index ? { ...t, value } : t,
              ),
            }
          : l,
      ),
    );
  }

  function reset() {
    setHasSheet(false);
    setLines([]);
    setOriginalKey(null);
    setShift(0);
    setSheetHeight(0);
    setRawText("");
    setPicker(null);
    setOrganizing(false);
    setSelection(null);
  }

  // Selection is stored as two ids and resolved against the current lines, so
  // it survives transposition and edits without holding stale indices.
  const selectedRange = useMemo(() => {
    if (!selection) return null;
    const a = lines.findIndex((l) => l.id === selection.anchorId);
    const b = lines.findIndex((l) => l.id === selection.focusId);
    if (a === -1 || b === -1) return null;
    return [Math.min(a, b), Math.max(a, b)] as const;
  }, [selection, lines]);

  const selectedIds = useMemo(() => {
    if (!selectedRange) return null;
    return new Set(
      lines.slice(selectedRange[0], selectedRange[1] + 1).map((l) => l.id),
    );
  }, [selectedRange, lines]);

  const selectedCount = selectedRange
    ? lines
        .slice(selectedRange[0], selectedRange[1] + 1)
        .filter((l) => l.type !== "blank").length
    : 0;

  function toggleOrganize() {
    setOrganizing((v) => !v);
    setSelection(null);
    setPicker(null);
  }

  function selectLine(id: string, extend: boolean) {
    setSelection((prev) =>
      extend && prev ? { ...prev, focusId: id } : { anchorId: id, focusId: id },
    );
  }

  function withRange(
    fn: (lines: Line[], start: number, end: number) => Line[],
  ) {
    if (!selectedRange) return;
    const [start, end] = selectedRange;
    setLines((prev) => fn(prev, start, end));
    setSelection(null);
  }

  // Chrome prints the document title in its own page header. It can be turned
  // off in the print dialog, but when it is left on it should name the song
  // rather than the app.
  useEffect(() => {
    const titulo = meta.titulo.trim();
    const artista = meta.artista.trim();
    if (!hasSheet || !titulo) {
      document.title = "Cifra";
      return;
    }
    document.title = artista ? `${titulo} – ${artista}` : titulo;
  }, [hasSheet, meta.titulo, meta.artista]);

  useEffect(() => {
    if (!organizing) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (selection) setSelection(null);
      else setOrganizing(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [organizing, selection]);

  // read live from state so the popover follows transposition and edits
  function readPickerValue(target: Picker | null) {
    if (!target) return null;
    const line = lines.find((l) => l.id === target.lineId);
    if (!line || (line.type !== "chords" && line.type !== "header"))
      return null;
    return line.tokens[target.index]?.value ?? null;
  }
  const pickerValue = readPickerValue(picker);

  const setMetaField =
    (field: "titulo" | "artista" | "capo") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setMeta((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="cifra-app">
      <div className="wrap">
        <div className="app-title no-print">Cifras Amana</div>
        <div className="app-sub no-print">
          Cole a cifra, detecte o tom, transponha e exporte em PDF pronto pra
          folha do culto.
        </div>

        {!hasSheet && (
          <ControlsPanel
            rawText={rawText}
            onRawTextChange={setRawText}
            onProcess={handleProcess}
          />
        )}

        {hasSheet && (
          <>
            <Toolbar
              originalKey={originalKey}
              currentKey={currentKey}
              fontSize={fontSize}
              columnMode={columnMode}
              columns={columns}
              estimatedPages={estimatedPages}
              onShift={applyShift}
              onJump={jumpToKey}
              onFontSize={setFontSize}
              onColumnMode={setColumnMode}
              organizing={organizing}
              onToggleOrganize={toggleOrganize}
              onExport={() => window.print()}
              onReset={reset}
            />

            <div className="meta-fields no-print">
              <input
                className="titulo"
                value={meta.titulo}
                onChange={setMetaField("titulo")}
                placeholder="Título da música"
              />
              <input
                className="artista"
                value={meta.artista}
                onChange={setMetaField("artista")}
                placeholder="Artista"
              />
              <input
                className="capo"
                value={meta.capo}
                onChange={setMetaField("capo")}
                placeholder="Capo / observação (opcional)"
              />
            </div>

            {/* only rendered on paper */}
            <div className="print-header">
              <div className="print-title">
                {meta.titulo || "Cifra"}
                {meta.artista ? " – " + meta.artista : ""}
              </div>
              {meta.capo && <div className="print-capo">{meta.capo}</div>}
            </div>

            <Sheet
              lines={lines}
              fontSize={fontSize}
              columns={columns}
              selectable={organizing}
              selectedIds={selectedIds}
              onSelectLine={selectLine}
              activeChord={picker ? picker.lineId + ":" + picker.index : null}
              onPickChord={(lineId, index, anchor) =>
                setPicker({ lineId, index, anchor })
              }
              onEditLyrics={editLyrics}
              onEditToken={editToken}
            />

            <div className="measure-host" aria-hidden="true">
              <Sheet
                ref={measureRef}
                lines={lines}
                fontSize={fontSize}
                columns={1}
                plain
              />
            </div>

            <div className="hint no-print">
              {organizing
                ? "Clique numa linha e shift+clique em outra para marcar o trecho, depois escolha o nome da seção. Esc limpa a seleção."
                : "Clique num acorde para escolher outro pelo seletor; clique na letra para editar o texto. Use “Organizar” para separar refrão, coro e ponte."}
            </div>

            {organizing && (
              <OrganizeBar
                count={selectedCount}
                onApply={(label) =>
                  withRange((prev, s, e) => applySection(prev, s, e, label))
                }
                onSeparate={() =>
                  withRange((prev, s, e) => separateRange(prev, s, e))
                }
                onRemove={() =>
                  withRange((prev) => removeLines(prev, selectedIds ?? []))
                }
                onClear={() => setSelection(null)}
                onDone={() => {
                  setOrganizing(false);
                  setSelection(null);
                }}
              />
            )}

            {picker && pickerValue !== null && (
              <ChordPicker
                value={pickerValue}
                anchor={picker.anchor}
                onChange={(v) => editToken(picker.lineId, picker.index, v)}
                onClose={() => setPicker(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
