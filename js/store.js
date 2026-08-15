// store.js
// Zentraler Datenspeicher fuer die laufende Session. Kapselt storage.js + leitner.js
// und benachrichtigt Listener bei Aenderungen, damit die Screens sich neu rendern koennen.

import * as storage from './storage.js';
import * as leitner from './leitner.js';

let cards = storage.loadCards();
let history = storage.loadHistory();
const listeners = [];

function notify() {
  listeners.forEach((fn) => fn());
}

function persist() {
  storage.saveCards(cards);
  storage.saveHistory(history);
}

export function subscribe(fn) {
  listeners.push(fn);
}

export function getCards() {
  return cards;
}

export function getHistory() {
  return history;
}

export function addCard(front, back) {
  const card = leitner.newCard(front.trim(), back.trim());
  cards = [...cards, card];
  history = [...history, { at: card.createdAt, cardId: card.id, fromBox: null, toBox: 1, action: 'new' }];
  persist();
  notify();
  return card;
}

export function importCards(pairs) {
  const now = new Date();
  const newOnes = pairs.map(({ front, back }) => leitner.newCard(front, back, now));
  const newHistory = newOnes.map((c) => ({ at: c.createdAt, cardId: c.id, fromBox: null, toBox: 1, action: 'new' }));
  cards = [...cards, ...newOnes];
  history = [...history, ...newHistory];
  persist();
  notify();
  return newOnes;
}

export function answerCard(id, correct) {
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const now = new Date();
  const { updated, transition } = correct
    ? leitner.applyCorrect(cards[idx], now)
    : leitner.applyWrong(cards[idx], now);
  const next = cards.slice();
  next[idx] = updated;
  cards = next;
  history = [...history, { ...transition, action: correct ? 'correct' : 'wrong' }];
  persist();
  notify();
  return updated;
}

export function updateCard(id, fields) {
  const idx = cards.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const next = cards.slice();
  next[idx] = { ...next[idx], ...fields, lastAction: new Date().toISOString() };
  cards = next;
  persist();
  notify();
}

export function deleteCard(id) {
  cards = cards.filter((c) => c.id !== id);
  persist();
  notify();
}

export function exportCsv() {
  storage.exportCardsAsCsv(cards);
}

export function exportBackup() {
  storage.exportBackupAsJson(cards, history);
}

export function importBackup(text) {
  const data = storage.parseBackupJson(text);
  cards = data.cards;
  history = data.history;
  persist();
  notify();
}

export { leitner, storage };
