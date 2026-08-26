// text-utils.js
// Hilfsfunktion fuer Fehler 26.08. #1 (Zeilenumbruch): Bei einigen bestehenden Karten
// blieb der Zeilenumbruch aus, obwohl der Fix vom 17.08./18.08. bei neu angelegten
// Karten funktionierte. Ursache: Text, der per Copy&Paste (z. B. aus Woerterbuechern,
// PDFs oder Office-Dokumenten) importiert wurde, enthaelt teils ein geschuetztes
// Leerzeichen (U+00A0, im Franzoesischen typografisch ueblich vor ;:!?) statt eines
// normalen Leerzeichens. CSS bricht an einem geschuetzten Leerzeichen bewusst NICHT um
// - daher blieb der Text bei genau diesen (aelteren, kopierten) Karten ununterbrochen
// und lief ueber den Kartenrand hinaus. Neu getippter Text ist davon nie betroffen,
// weil eine normale Tastatur kein U+00A0 erzeugt (passt zur Beobachtung "keine
// Systematik erkennbar" / "manuell neu angelegt korrekt").
//
// normalizeVocabText() wandelt geschuetzte und sonstige unsichtbare Leerzeichen-
// Varianten in normale Leerzeichen um (bzw. entfernt echte Zero-Width-Zeichen). Sie
// wird sowohl beim Erfassen/Import neuer Vokabeln als auch beim Anzeigen bestehender
// Karten angewendet, damit auch schon gespeicherte Karten ohne manuelle Nacharbeit
// korrekt umbrechen. \u-Escapes statt Rohzeichen, damit die unsichtbaren Zeichen im
// Quellcode nicht versehentlich verloren gehen (z. B. beim Kopieren/Hochladen).
const SPACE_LIKE_PATTERN = /[    ﻿]/g;
const ZERO_WIDTH_PATTERN = /[​]/g;

export function normalizeVocabText(text) {
  if (typeof text !== 'string') return text;
  return text.replace(SPACE_LIKE_PATTERN, ' ').replace(ZERO_WIDTH_PATTERN, '');
}
