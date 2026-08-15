// leitner.js
// Zentrale Leitner-Logik: Boxen, Intervalle, Farben, nextReview-Berechnung, Transitions.

export const BOXES = [
  { box: 1, days: 1, color: '#FF6B6B', label: 'Neue / falsch beantwortete Karten' },
  { box: 2, days: 2, color: '#FF9F43', label: 'In Lernfortschritt' },
  { box: 3, days: 4, color: '#FECA57', label: 'Gut bekannte Karten' },
  { box: 4, days: 7, color: '#48DBFB', label: 'Sehr gut bekannte Karten' },
  { box: 5, days: 14, color: '#1DD1A1', label: 'Gemeisterte Karten' },
];

export function boxInfo(box) {
  return BOXES.find((b) => b.box === box) || BOXES[0];
}

export function boxColor(box) {
  return boxInfo(box).color;
}

// ISO-Datum (nur Datum, kein Zeitanteil) fuer stabile Tagesvergleiche.
export function isoDate(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function computeNextReview(box, fromDate = new Date()) {
  const info = boxInfo(box);
  return addDays(fromDate, info.days).toISOString();
}

// Ist die Karte heute faellig? Box-1-Karten gelten laut Anforderung IMMER als lernbar,
// unabhaengig vom nextReview-Datum.
export function isDue(card, now = new Date()) {
  if (card.box === 1) return true;
  return new Date(card.nextReview) <= now;
}

export function dueCount(cards, now = new Date()) {
  return cards.filter((c) => isDue(c, now)).length;
}

// Karte war richtig: eine Box hoeher (Box 5 bleibt Box 5), ans Ende der Box verschoben.
export function applyCorrect(card, now = new Date()) {
  const fromBox = card.box;
  const toBox = Math.min(5, card.box + 1);
  const iso = now.toISOString();
  return {
    updated: {
      ...card,
      box: toBox,
      nextReview: computeNextReview(toBox, now),
      lastAction: iso,
      repetitions: (card.repetitions || 0) + 1,
    },
    transition: { fromBox, toBox, at: iso, cardId: card.id },
  };
}

// Karte war falsch: zurueck an das Ende von Box 1.
export function applyWrong(card, now = new Date()) {
  const fromBox = card.box;
  const toBox = 1;
  const iso = now.toISOString();
  return {
    updated: {
      ...card,
      box: toBox,
      nextReview: computeNextReview(toBox, now),
      lastAction: iso,
      repetitions: (card.repetitions || 0) + 1,
    },
    transition: { fromBox, toBox, at: iso, cardId: card.id },
  };
}

export function newCard(front, back, now = new Date()) {
  const iso = now.toISOString();
  return {
    id: `${now.getTime()}-${Math.floor(Math.random() * 100000)}`,
    front,
    back,
    box: 1,
    nextReview: computeNextReview(1, now),
    createdAt: iso,
    lastAction: iso,
    repetitions: 0,
  };
}
