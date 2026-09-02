"use client";

export function ControlsPanel({
  rawText,
  onRawTextChange,
  onProcess,
}: {
  rawText: string;
  onRawTextChange: (value: string) => void;
  onProcess: () => void;
}) {
  return (
    <div className="card controls-panel no-print">
      <div className="row">
        <textarea
          className="raw-input"
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder="Cole aqui a cifra completa (com cabeçalhos tipo RIFF, REFRÃO, e as linhas de acordes)..."
        />
      </div>
      <div className="row">
        <button className="primary" onClick={onProcess}>
          Processar cifra
        </button>
      </div>
      <div className="hint">
        Aceita texto colado ou arquivo .txt. Para .docx, copie e cole o texto
        aqui.
      </div>
    </div>
  );
}
