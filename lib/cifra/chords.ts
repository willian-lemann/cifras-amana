export const NOTES_SHARP = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const NOTE_TO_INDEX: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

export type ChordToken = {
  kind: "chord";
  prefix: string;
  value: string;
  suffix: string;
};
export type PlainToken = { kind: "plain"; value: string };
export type WhitespaceToken = { kind: "ws"; value: string };
export type Token = ChordToken | PlainToken | WhitespaceToken;

export type BlankLine = { id: string; type: "blank" };
export type LyricsLine = { id: string; type: "lyrics"; text: string };
export type TokenLine = {
  id: string;
  type: "chords" | "header";
  tokens: Token[];
};
export type Line = BlankLine | LyricsLine | TokenLine;
export type LineType = Line["type"];

export type Stanza = { id: string; lines: Line[]; trailingBlanks: number };

const ROOT_RE = /^([A-G])(#|b)?(.*)$/;
const SUFFIX_TOKEN = "(?:maj|min|dim|aug|sus|add|m|M|[0-9]|[#b]|\\(|\\)|\\+|°)";
const SUFFIX_RE = new RegExp("^" + SUFFIX_TOKEN + "*$");
const SECTION_RE =
  /\b(INTRO|INTRODU[ÇC][ÃA]O|RIFF|REFR[ÃA]O|CORO|VERSO|ESTROFE|PONTE|SOLO|BASE|FINAL|CAPO|PR[ÉE][- ]?REFR[ÃA]O)\b/i;

// offered by the organize bar; any other name can be typed there
export const SECTION_PRESETS = [
  "INTRO",
  "VERSO",
  "PRÉ-REFRÃO",
  "REFRÃO",
  "CORO",
  "PONTE",
  "SOLO",
  "FINAL",
];

export function looksLikeChord(tok: string) {
  const m = ROOT_RE.exec(tok);
  if (!m) return false;
  return SUFFIX_RE.test(m[3]);
}

export function noteIndex(note: string) {
  return note in NOTE_TO_INDEX ? NOTE_TO_INDEX[note] : null;
}

function transposeRootToken(tok: string, semis: number) {
  if (!looksLikeChord(tok)) return tok;
  const m = ROOT_RE.exec(tok);
  if (!m) return tok;
  const letter = m[1],
    acc = m[2] || "",
    rest = m[3];
  const idx = noteIndex(letter + acc);
  if (idx === null) return tok;
  const newIdx = (((idx + semis) % 12) + 12) % 12;
  return NOTES_SHARP[newIdx] + rest;
}

export function transposeChordTok(tok: string, semis: number) {
  if (tok.indexOf("/") !== -1) {
    const parts = tok.split("/");
    return (
      transposeRootToken(parts[0], semis) +
      "/" +
      transposeRootToken(parts[1], semis)
    );
  }
  return transposeRootToken(tok, semis);
}

// splits a raw token like "(D)," or "G," preserving punctuation,
// returns [prefix, core, suffix] or null
function splitPunct(tok: string): [string, string, string] | null {
  const m = /^(\(*)([^()\s,]+)(\)*,?)$/.exec(tok);
  if (!m) return null;
  return [m[1], m[2], m[3]];
}

function classifyLine(raw: string): LineType {
  const trimmed = raw.trim();
  if (trimmed === "") return "blank";
  if (SECTION_RE.test(trimmed)) return "header";
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  let chordCount = 0;
  tokens.forEach((t) => {
    const sp = splitPunct(t);
    if (sp && looksLikeChord(sp[1])) chordCount++;
  });
  if (tokens.length > 0 && chordCount / tokens.length >= 0.6) return "chords";
  return "lyrics";
}

// chord/header lines become token arrays so transposition is a pure state
// mapping instead of a DOM mutation. Whitespace is kept as its own token to
// preserve the original column alignment.
function tokenizeChordLine(text: string) {
  const tokens: Token[] = [];
  text.split(/(\s+)/).forEach((tok) => {
    if (tok === "") return;
    if (tok.trim() === "") {
      tokens.push({ kind: "ws", value: tok });
      return;
    }
    const sp = splitPunct(tok);
    if (sp && looksLikeChord(sp[1])) {
      tokens.push({
        kind: "chord",
        prefix: sp[0],
        value: sp[1],
        suffix: sp[2],
      });
    } else {
      tokens.push({ kind: "plain", value: tok });
    }
  });
  return tokens;
}

function rootOf(chord: string) {
  const m = ROOT_RE.exec(chord);
  return m ? m[1] + (m[2] || "") : null;
}

export function detectOriginalKey(lines: Line[]) {
  for (const l of lines) {
    if (l.type === "chords" || l.type === "header") {
      for (const t of l.tokens) {
        if (t.kind === "chord") {
          const root = rootOf(t.value);
          if (root) return root;
        }
      }
    }
  }
  return null;
}

export function guessTitleArtist(text: string) {
  const firstLine = text.split("\n").find((l) => l.trim() !== "") || "";
  let titulo = firstLine.trim(),
    artista = "";
  const dashSplit = firstLine.split(/[-–—]/);
  if (dashSplit.length >= 2) {
    titulo = dashSplit[0].trim();
    artista = dashSplit.slice(1).join("-").trim();
  }
  return { titulo, artista };
}

export function parseCifra(text: string) {
  const allLines = text.split("\n");

  // Only treat the first line as a title when it actually reads like one: it
  // names an artist after a dash, or it stands alone above a blank line.
  // Otherwise it is the first line of the song — pasting raw lyrics used to
  // lose it silently.
  const first = allLines.findIndex((l) => l.trim() !== "");
  const namesArtist =
    first !== -1 &&
    /[-–—]/.test(allLines[first]) &&
    allLines[first].length < 90;
  const standsAlone =
    first !== -1 &&
    allLines[first + 1] !== undefined &&
    allLines[first + 1].trim() === "";

  let titulo = "";
  let artista = "";
  let bodyLines = allLines;
  if (namesArtist || standsAlone) {
    ({ titulo, artista } = guessTitleArtist(text));
    bodyLines = allLines.slice(first + 1);
  }

  const lines: Line[] = bodyLines.map((raw, i) => {
    const text = raw.replace(/\s+$/, "");
    const type = classifyLine(raw);
    const id = "l" + i;
    if (type === "lyrics") return { id, type, text };
    if (type === "blank") return { id, type };
    return { id, type, tokens: tokenizeChordLine(text) };
  });

  return { lines, originalKey: detectOriginalKey(lines), titulo, artista };
}

export function transposeLines(lines: Line[], semis: number): Line[] {
  if (!semis) return lines;
  return lines.map((line) => {
    if (line.type !== "chords" && line.type !== "header") return line;
    return {
      ...line,
      tokens: line.tokens.map((t) =>
        t.kind === "chord"
          ? { ...t, value: transposeChordTok(t.value, semis) }
          : t,
      ),
    };
  });
}

export const CHORD_QUALITIES = [
  { label: "M", value: "" },
  { label: "m", value: "m" },
  { label: "7", value: "7" },
  { label: "m7", value: "m7" },
  { label: "maj7", value: "maj7" },
  { label: "6", value: "6" },
  { label: "m6", value: "m6" },
  { label: "9", value: "9" },
  { label: "m9", value: "m9" },
  { label: "add9", value: "add9" },
  { label: "sus2", value: "sus2" },
  { label: "sus4", value: "sus4" },
  { label: "dim", value: "dim" },
  { label: "aug", value: "aug" },
  { label: "7sus4", value: "7sus4" },
  { label: "m7b5", value: "m7b5" },
];

export type ChordParts = { root: string; quality: string; bass: string };

// Breaks a chord into the three parts the picker edits independently.
export function splitChord(chord: string): ChordParts {
  const slash = chord.indexOf("/");
  const main = slash === -1 ? chord : chord.slice(0, slash);
  const bass = slash === -1 ? "" : chord.slice(slash + 1);
  const m = ROOT_RE.exec(main);
  if (!m) return { root: "", quality: "", bass };
  return { root: m[1] + (m[2] || ""), quality: m[3], bass };
}

export function buildChord({ root, quality, bass }: ChordParts) {
  return root + quality + (bass ? "/" + bass : "");
}

// Groups consecutive non-blank lines into stanzas. Columns and page breaks are
// then allowed between stanzas but never inside one, so a chord line is never
// separated from the lyric line it sits above. Blank lines survive as the
// trailing gap of the stanza they follow.
export function groupStanzas(lines: Line[]) {
  const groups: Stanza[] = [];
  let current: Stanza | null = null;
  for (const line of lines) {
    if (line.type === "blank") {
      if (current) current.trailingBlanks += 1;
      continue;
    }
    if (!current || current.trailingBlanks > 0) {
      current = { id: "s" + groups.length, lines: [], trailingBlanks: 0 };
      groups.push(current);
    }
    current.lines.push(line);
  }
  return groups;
}

function bindsToNextLine(line: Line, next: Line) {
  // a section label belongs with whatever it labels
  if (line.type === "header") return true;
  // a chord line only means something sitting above its words
  return line.type === "chords" && next.type === "lyrics";
}

// Splits a stanza into the smallest blocks that must never be torn apart: a
// chord line together with the lyric line under it, and a header together with
// the line it labels. Keeping whole stanzas together is the first choice, but a
// stanza taller than the column has to break somewhere — these units are where
// that break is allowed to land, so chords never end up in one column with
// their words in the next.
export function groupLineUnits(lines: Line[]) {
  const units: Line[][] = [];
  let current: Line[] | null = null;
  lines.forEach((line, i) => {
    if (current) {
      current.push(line);
    } else {
      current = [line];
      units.push(current);
    }
    const next = lines[i + 1];
    if (!next || !bindsToNextLine(line, next)) current = null;
  });
  return units;
}

// Lines created after the initial parse need ids that can't collide with the
// "l<n>" ones parseCifra hands out.
let inserted = 0;
const nextId = () => "n" + ++inserted;

export function makeHeaderLine(label: string): TokenLine {
  const text = label.trim();
  return {
    id: nextId(),
    type: "header",
    tokens: [{ kind: "plain", value: /[:–-]$/.test(text) ? text : text + ":" }],
  };
}

export function makeBlankLine(): BlankLine {
  return { id: nextId(), type: "blank" };
}

// Turns lines[start..end] into their own labelled stanza: a blank line and a
// header above, a blank line below. A section is just a header line in the
// normal flow, so print, transposition and stanza grouping keep working on it
// exactly as they do for a cifra that was pasted with headers already in place.
export function applySection(
  lines: Line[],
  startIndex: number,
  endIndex: number,
  label: string,
): Line[] {
  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);

  const before = lines.slice(0, start);
  const range = lines.slice(start, end + 1);
  const after = lines.slice(end + 1);

  // reuse the existing label slot instead of stacking two headers, so
  // re-applying a section renames it
  if (range.length && range[0].type === "header") range.shift();
  else if (before.length && before[before.length - 1].type === "header")
    before.pop();

  const out = [...before];
  if (out.length && out[out.length - 1].type !== "blank")
    out.push(makeBlankLine());
  out.push(makeHeaderLine(label));
  out.push(...range);
  if (after.length && after[0].type !== "blank") out.push(makeBlankLine());
  out.push(...after);
  return out;
}

// same grouping, without giving the block a name
export function separateRange(
  lines: Line[],
  startIndex: number,
  endIndex: number,
): Line[] {
  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);

  const before = lines.slice(0, start);
  const range = lines.slice(start, end + 1);
  const after = lines.slice(end + 1);

  const out = [...before];
  if (out.length && out[out.length - 1].type !== "blank")
    out.push(makeBlankLine());
  out.push(...range);
  if (after.length && after[0].type !== "blank") out.push(makeBlankLine());
  out.push(...after);
  return out;
}

export function removeLines(lines: Line[], ids: Iterable<string>): Line[] {
  const drop = new Set(ids);
  return lines.filter((l) => !drop.has(l.id));
}

export function keyAfterShift(originalKey: string | null, shift: number) {
  if (!originalKey) return null;
  const idx = noteIndex(originalKey);
  if (idx === null) return null;
  return NOTES_SHARP[(((idx + shift) % 12) + 12) % 12];
}
