// screens/stats.js
import { BOXES, isDue, boxColor } from '../leitner.js';
import { renderBarChart, renderStackedGrowthChart } from '../charts.js';

// Feste Reihenfolge der Transaktionen laut Anforderung 3.5.4
const TRANSITIONS = [
  { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 5 },
  { from: 2, to: 1 }, { from: 3, to: 1 }, { from: 4, to: 1 }, { from: 5, to: 1 }, { from: 1, to: 1 },
];

function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

// Baut Tages-Snapshots der Boxverteilung, nur fuer Tage mit tatsaechlichen Veraenderungen.
function computeGrowthSnapshots(history) {
  const sorted = [...history].sort((a, b) => new Date(a.at) - new Date(b.at));
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const snapshots = [];
  let lastDay = null;

  sorted.forEach((entry, idx) => {
    if (entry.fromBox) counts[entry.fromBox] = Math.max(0, counts[entry.fromBox] - 1);
    if (entry.toBox) counts[entry.toBox] = (counts[entry.toBox] || 0) + 1;

    const day = dayKey(entry.at);
    const isLastOfDay = idx === sorted.length - 1 || dayKey(sorted[idx + 1].at) !== day;
    if (isLastOfDay) {
      snapshots.push({ date: entry.at, counts: { ...counts } });
      lastDay = day;
    }
  });

  return snapshots;
}

function computeTransitionCounts(history) {
  const map = new Map();
  TRANSITIONS.forEach((t) => map.set(`${t.from}-${t.to}`, 0));
  history.forEach((entry) => {
    if (entry.action !== 'correct' && entry.action !== 'wrong') return;
    const key = `${entry.fromBox}-${entry.toBox}`;
    if (map.has(key)) map.set(key, map.get(key) + 1);
  });
  return map;
}

export function initStats(store) {
  const elTotal = document.getElementById('stats-total');
  const elMastered = document.getElementById('stats-mastered');
  const elDue = document.getElementById('stats-due');
  const perBoxContainer = document.getElementById('chart-per-box');
  const growthContainer = document.getElementById('chart-growth');
  const transitionsContainer = document.getElementById('chart-transitions');

  function render() {
    const cards = store.getCards();
    const history = store.getHistory();

    elTotal.textContent = cards.length;
    elMastered.textContent = cards.filter((c) => c.box === 5).length;
    elDue.textContent = cards.filter((c) => isDue(c)).length;

    renderBarChart(perBoxContainer, {
      categories: BOXES.map((b) => `Box ${b.box}`),
      values: BOXES.map((b) => cards.filter((c) => c.box === b.box).length),
      colors: BOXES.map((b) => b.color),
    });

    const snapshots = computeGrowthSnapshots(history);
    renderStackedGrowthChart(growthContainer, snapshots);

    const counts = computeTransitionCounts(history);
    renderBarChart(transitionsContainer, {
      categories: TRANSITIONS.map((t) => `${t.from}→${t.to}`),
      values: TRANSITIONS.map((t) => counts.get(`${t.from}-${t.to}`) || 0),
      colors: TRANSITIONS.map((t) => boxColor(t.to)),
      height: 180,
    });
  }

  store.subscribe(render);
  render();
  return { render };
}
