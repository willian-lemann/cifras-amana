"use client";

import { NOTES_SHARP } from "@/lib/cifra/chords";

export function Toolbar({
  originalKey,
  currentKey,
  fontSize,
  columnMode,
  columns,
  estimatedPages,
  onShift,
  onJump,
  onFontSize,
  onColumnMode,
  organizing,
  onToggleOrganize,
  onExport,
  onReset,
}: {
  originalKey: string | null;
  currentKey: string | null;
  fontSize: number;
  columnMode: string;
  columns: number;
  estimatedPages: number;
  onShift: (delta: number) => void;
  onJump: (target: string) => void;
  onFontSize: (size: number) => void;
  onColumnMode: (mode: string) => void;
  organizing: boolean;
  onToggleOrganize: () => void;
  onExport: () => void;
  onReset: () => void;
}) {
  return (
    <div className="toolbar no-print">
      <div className="tone-group">
        <label className="small">Tom original</label>
        <span className="tone-badge">{originalKey || "?"}</span>
        <span style={{ color: "var(--ink-soft)" }}>→</span>
        <label className="small">Tom atual</label>
        <span className="tone-badge">{currentKey || "—"}</span>
      </div>

      <div className="tone-group">
        <button
          className="step-btn"
          title="Descer 1 semitom"
          onClick={() => onShift(-1)}
        >
          −
        </button>
        <button
          className="step-btn"
          title="Subir 1 semitom"
          onClick={() => onShift(1)}
        >
          +
        </button>
        <select
          className="jump-key"
          value={currentKey ?? ""}
          disabled={!currentKey}
          onChange={(e) => onJump(e.target.value)}
        >
          {!currentKey && <option value="">—</option>}
          {NOTES_SHARP.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="tone-group">
        <label className="small">Colunas</label>
        <select
          className="jump-key"
          value={columnMode}
          onChange={(e) => onColumnMode(e.target.value)}
        >
          <option value="auto">Auto</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
        <span className="small page-est">
          ≈ {estimatedPages} pág.
          {columnMode === "auto" && columns === 2 ? " (2 col.)" : ""}
        </span>
      </div>

      <div className="row" style={{ margin: 0, gap: 8 }}>
        <label className="small">Fonte</label>
        <input
          type="range"
          min="7"
          max="15"
          step="0.5"
          value={fontSize}
          onChange={(e) => onFontSize(Number(e.target.value))}
        />
        <button
          className={organizing ? "primary" : ""}
          aria-pressed={organizing}
          onClick={onToggleOrganize}
        >
          {organizing ? "Concluir" : "Organizar"}
        </button>
        <button className="accent" onClick={onExport}>
          Exportar PDF
        </button>
        <button className="ghost" onClick={onReset}>
          Nova cifra
        </button>
      </div>
    </div>
  );
}
