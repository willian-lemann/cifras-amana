"use client";

import { useState } from "react";
import { SECTION_PRESETS } from "@/lib/cifra/chords";

export function OrganizeBar({
  count,
  onApply,
  onSeparate,
  onRemove,
  onClear,
  onDone,
}: {
  count: number;
  onApply: (label: string) => void;
  onSeparate: () => void;
  onRemove: () => void;
  onClear: () => void;
  onDone: () => void;
}) {
  const [custom, setCustom] = useState("");
  const idle = count === 0;

  function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    const label = custom.trim();
    if (!label || idle) return;
    onApply(label);
    setCustom("");
  }

  return (
    <div className="organize-bar no-print">
      <div className="ob-top">
        <span className="ob-count">
          {idle
            ? "Clique numa linha para começar — shift+clique marca até ela"
            : `${count} linha${count === 1 ? "" : "s"} selecionada${count === 1 ? "" : "s"}`}
        </span>
        <button className="ob-done" onClick={onDone}>
          Concluir
        </button>
      </div>

      <div className="ob-presets">
        {SECTION_PRESETS.map((s) => (
          <button
            key={s}
            className="ob-opt"
            disabled={idle}
            onClick={() => onApply(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="ob-row">
        <form className="ob-custom" onSubmit={submitCustom}>
          <input
            value={custom}
            disabled={idle}
            placeholder="Outro nome de seção..."
            onChange={(e) => setCustom(e.target.value)}
          />
          <button type="submit" disabled={idle || !custom.trim()}>
            Aplicar
          </button>
        </form>

        <button className="ob-ghost" disabled={idle} onClick={onSeparate}>
          Só separar
        </button>
        <button className="ob-ghost" disabled={idle} onClick={onRemove}>
          Apagar linhas
        </button>
        <button className="ob-ghost" disabled={idle} onClick={onClear}>
          Limpar seleção
        </button>
      </div>
    </div>
  );
}
