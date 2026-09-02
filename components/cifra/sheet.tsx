"use client";

import { useMemo } from "react";
import { Editable } from "./editable";
import { groupLineUnits, groupStanzas, type Line } from "@/lib/cifra/chords";

type LineHandlers = {
  activeChord?: string | null;
  onPickChord?: (lineId: string, index: number, anchor: HTMLElement) => void;
  onEditLyrics?: (id: string, text: string) => void;
  onEditToken?: (id: string, index: number, value: string) => void;
};

function LineContent({
  line,
  plain,
  activeChord,
  onPickChord,
  onEditLyrics,
  onEditToken,
}: LineHandlers & { line: Line; plain: boolean }) {
  if (line.type === "blank") return <div className="line-blank" />;

  if (line.type === "lyrics") {
    return plain ? (
      <div className="line-lyrics">{line.text}</div>
    ) : (
      <Editable
        tag="div"
        className="line-lyrics"
        value={line.text}
        onCommit={(v) => onEditLyrics?.(line.id, v)}
      />
    );
  }

  return (
    <div className={"line-" + line.type}>
      {line.tokens.map((tok, i) => {
        if (tok.kind === "ws") return <span key={i}>{tok.value}</span>;

        // Chords are picked, not typed — the button opens the picker popover.
        // The measuring mirror keeps the same element so the box metrics match.
        if (tok.kind === "chord") {
          const isActive = activeChord === line.id + ":" + i;
          return (
            <span key={i}>
              {tok.prefix}
              <button
                type="button"
                className={"chord-tok" + (isActive ? " is-editing" : "")}
                tabIndex={plain ? -1 : 0}
                title={plain ? undefined : "Clique para escolher o acorde"}
                onClick={
                  plain
                    ? undefined
                    : (e) => onPickChord?.(line.id, i, e.currentTarget)
                }
              >
                {tok.value}
              </button>
              {tok.suffix}
            </span>
          );
        }

        return plain ? (
          <span key={i} className="plain-tok">
            {tok.value}
          </span>
        ) : (
          <Editable
            key={i}
            className="plain-tok"
            value={tok.value}
            onCommit={(v) => onEditToken?.(line.id, i, v)}
          />
        );
      })}
    </div>
  );
}

// `plain` renders the same markup without any editable or focusable nodes. It
// backs the hidden single-column mirror used to measure page count, and also
// the organize mode, where clicking a line must select it rather than open a
// chord picker or drop a caret into the lyrics.
export function Sheet({
  ref,
  lines,
  fontSize,
  columns,
  plain = false,
  selectable = false,
  selectedIds,
  onSelectLine,
  activeChord,
  onPickChord,
  onEditLyrics,
  onEditToken,
}: LineHandlers & {
  ref?: React.Ref<HTMLDivElement>;
  lines: Line[];
  fontSize: number;
  columns: number;
  plain?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string> | null;
  onSelectLine?: (id: string, extend: boolean) => void;
}) {
  const stanzas = useMemo(
    () =>
      groupStanzas(lines).map((stanza) => ({
        ...stanza,
        units: groupLineUnits(stanza.lines),
      })),
    [lines],
  );
  const inert = plain || selectable;

  function renderLine(line: Line) {
    const content = (
      <LineContent
        line={line}
        plain={inert}
        activeChord={activeChord}
        onPickChord={onPickChord}
        onEditLyrics={onEditLyrics}
        onEditToken={onEditToken}
      />
    );

    if (!selectable) return <div key={line.id}>{content}</div>;

    return (
      <div
        key={line.id}
        className={
          "line-row" + (selectedIds?.has(line.id) ? " is-selected" : "")
        }
        role="button"
        tabIndex={0}
        aria-pressed={selectedIds?.has(line.id) ?? false}
        onClick={(e) => onSelectLine?.(line.id, e.shiftKey)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectLine?.(line.id, e.shiftKey);
          }
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={
        "sheet" +
        (columns === 2 ? " cols-2" : "") +
        (selectable ? " is-organizing" : "")
      }
      style={{ fontSize: fontSize + "pt" }}
    >
      {stanzas.map((stanza) => (
        <div
          key={stanza.id}
          className="stanza"
          style={{ marginBottom: stanza.trailingBlanks * 0.6 + "em" }}
        >
          {stanza.units.map((unit) => (
            <div key={unit[0].id} className="line-unit">
              {unit.map(renderLine)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
