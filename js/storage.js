// storage.js
// Lokale Persistenz (localStorage) fuer Karten + Verlaufs-Log.
// Ersetzt "AsyncStorage" aus dem Original-Briefing durch das Web-Pendant.

const CARDS_KEY = 'brainTrain.cards.v1';
const HISTORY_KEY = 'brainTrain.history.v1';

export function loadCards() {
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Konnte Karten nicht laden', e);
    return [];
  }
}

export function saveCards(cards) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Konnte Verlauf nicht laden', e);
    return [];
  }
}

export function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function appendHistory(entry) {
  const history = loadHistory();
  history.push(entry);
  saveHistory(history);
  return history;
}

// --- CSV Export (alle Vokabeln inkl. Leitner-Status) ---
const CSV_COLUMNS = ['id', 'front', 'back', 'box', 'nextReview', 'createdAt', 'lastAction', 'repetitions'];

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[;,"\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function cardsToCsv(cards) {
  const header = CSV_COLUMNS.join(';');
  const rows = cards.map((c) => CSV_COLUMNS.map((col) => csvEscape(c[col])).join(';'));
  return [header, ...rows].join('\r\n');
}

export function downloadTextFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportCardsAsCsv(cards) {
  const csv = cardsToCsv(cards);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(`brain-train-vokabeln-${stamp}.csv`, csv);
}

// --- Einfacher CSV-Zeilenparser: erkennt Komma oder Semikolon automatisch,
//     unterstuetzt einfache Anfuehrungszeichen-Faelle. ---
export function parseVocabCsv(text) {
  const lines = text.split(/\r\n|\n|\r/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const delimiter = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';

  const parseLine = (line) => {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields.map((f) => f.trim());
  };

  const result = [];
  for (const line of lines) {
    const fields = parseLine(line);
    if (fields.length < 2) continue;
    const [front, back] = fields;
    // Kopfzeile tolerant erkennen und ueberspringen (z. B. "front;back", "deutsch;franzoesisch")
    const lower = front.toLowerCase();
    if (result.length === 0 && ['front', 'deutsch', 'de', 'german'].includes(lower)) continue;
    if (!front || !back) continue;
    result.push({ front, back });
  }
  return result;
}

// --- JSON-Backup (Karten + Verlauf) fuer Export/Import als Sicherung ---
export function exportBackupAsJson(cards, history) {
  const payload = {
    app: 'Brain Train',
    exportedAt: new Date().toISOString(),
    cards,
    history,
  };
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(`brain-train-backup-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json');
}

export function parseBackupJson(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.cards)) {
    throw new Error('Ungueltiges Backup-Format: "cards" fehlt.');
  }
  return {
    cards: data.cards,
    history: Array.isArray(data.history) ? data.history : [],
  };
}
