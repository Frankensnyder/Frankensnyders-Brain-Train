// charts.js
// Leichte, abhaengigkeitsfreie SVG-Charts (funktionieren offline ohne CDN).
// Folgt den dataviz-Grundsaetzen: duenne Balken, 2px Spacer, Legende bei >=2 Serien,
// Hover-Tooltip, Farbe traegt nie allein die Bedeutung (immer + Text/Achsen-Label).

import { BOXES, boxColor } from './leitner.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

function ensureTooltip(container) {
  let tip = container.querySelector('.chart-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'chart-tooltip';
    container.appendChild(tip);
  }
  return tip;
}

function showTooltip(container, tip, html, evt) {
  tip.innerHTML = html;
  tip.style.opacity = '1';
  const rect = container.getBoundingClientRect();
  const x = (evt.touches ? evt.touches[0].clientX : evt.clientX) - rect.left;
  const y = (evt.touches ? evt.touches[0].clientY : evt.clientY) - rect.top;
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}

function hideTooltip(tip) {
  tip.style.opacity = '0';
}

// --- 1) Einfacher Balkenchart: eine Zahl je Kategorie (Karten pro Box, Transaktionen) ---
export function renderBarChart(container, { categories, values, colors, height = 200, valueLabel }) {
  container.innerHTML = '';
  const max = Math.max(1, ...values);
  const width = Math.max(320, container.clientWidth || 320);
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const n = categories.length;
  const gap = 8;
  const barW = Math.max(6, (chartW - gap * (n - 1)) / n);

  const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', height, role: 'img', 'aria-label': 'Balkendiagramm' });

  categories.forEach((cat, i) => {
    const v = values[i];
    const barH = (v / max) * chartH;
    const x = padding.left + i * (barW + gap);
    const y = padding.top + (chartH - barH);

    const rect = el('rect', {
      x, y, width: barW, height: Math.max(1, barH),
      rx: 4, ry: 4,
      fill: colors[i],
    });
    svg.appendChild(rect);

    const label = el('text', {
      x: x + barW / 2, y: height - 8,
      'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-secondary)',
    });
    label.textContent = cat;
    svg.appendChild(label);

    if (v > 0) {
      const valText = el('text', {
        x: x + barW / 2, y: Math.max(padding.top + 10, y - 6),
        'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: 'var(--ink-primary)',
      });
      valText.textContent = valueLabel ? valueLabel(v) : v;
      svg.appendChild(valText);
    }
  });

  container.appendChild(svg);
  if (values.every((v) => v === 0)) {
    const empty = document.createElement('p');
    empty.className = 'chart-empty';
    empty.textContent = 'Noch keine Daten vorhanden.';
    container.appendChild(empty);
  }
}

// --- 2) Gestapelter Balkenchart ueber Zeit (Wachstum je Box) ---
export function renderStackedGrowthChart(container, snapshots, { height = 240 } = {}) {
  container.innerHTML = '';

  if (!snapshots || snapshots.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'chart-empty';
    empty.textContent = 'Noch keine Verlaufsdaten – sobald Karten gelernt oder hinzugefügt werden, erscheint hier das Wachstum.';
    container.appendChild(empty);
    return;
  }

  const width = Math.max(320, container.clientWidth || 320);
  const padding = { top: 16, right: 12, bottom: 30, left: 28 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const totals = snapshots.map((s) => BOXES.reduce((sum, b) => sum + (s.counts[b.box] || 0), 0));
  const max = Math.max(1, ...totals);
  const n = snapshots.length;
  const gap = n > 20 ? 1 : 3;
  const barW = Math.max(3, (chartW - gap * (n - 1)) / n);

  const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', height, role: 'img', 'aria-label': 'Gestapeltes Wachstumsdiagramm' });

  // y-Achsenlinie + Max-Label (dezent, recessive)
  const axisLine = el('line', { x1: padding.left, y1: padding.top, x2: padding.left, y2: padding.top + chartH, stroke: 'var(--border)', 'stroke-width': 1 });
  svg.appendChild(axisLine);
  const maxLabel = el('text', { x: 2, y: padding.top + 4, 'font-size': 10, fill: 'var(--ink-muted)' });
  maxLabel.textContent = max;
  svg.appendChild(maxLabel);

  const tip = ensureTooltip(container);

  snapshots.forEach((snap, i) => {
    const x = padding.left + i * (barW + gap);
    let yCursor = padding.top + chartH;
    const total = totals[i];

    BOXES.forEach((b) => {
      const count = snap.counts[b.box] || 0;
      if (count <= 0) return;
      const segH = (count / max) * chartH;
      const y = yCursor - segH;
      const rect = el('rect', {
        x, y, width: barW, height: Math.max(0, segH - (n > 20 ? 0 : 1)),
        fill: b.color,
      });
      svg.appendChild(rect);
      yCursor = y;
    });

    // Unsichtbarer Hover-Bereich ueber die ganze Balkenspalte (groesseres Hit-Target)
    const hitW = Math.max(barW, 10);
    const hit = el('rect', { x: x - (hitW - barW) / 2, y: padding.top, width: hitW, height: chartH, fill: 'transparent' });
    const dateLabel = new Date(snap.date).toLocaleDateString('de-DE');
    const tooltipHtml = `<strong>${dateLabel}</strong><br/>` +
      BOXES.map((b) => `Box ${b.box}: ${snap.counts[b.box] || 0}`).join('<br/>') +
      `<br/>Gesamt: ${total}`;
    hit.addEventListener('mouseenter', (e) => showTooltip(container, tip, tooltipHtml, e));
    hit.addEventListener('mousemove', (e) => showTooltip(container, tip, tooltipHtml, e));
    hit.addEventListener('mouseleave', () => hideTooltip(tip));
    hit.addEventListener('touchstart', (e) => showTooltip(container, tip, tooltipHtml, e));
    svg.appendChild(hit);

    // x-Achsen-Label nur fuer erste, letzte und ein paar Zwischen-Punkte (Ueberlappung vermeiden)
    const showLabel = n <= 8 || i === 0 || i === n - 1 || i % Math.ceil(n / 6) === 0;
    if (showLabel) {
      const label = el('text', {
        x: x + barW / 2, y: height - 8, 'text-anchor': 'middle', 'font-size': 9, fill: 'var(--ink-muted)',
      });
      label.textContent = new Date(snap.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      svg.appendChild(label);
    }
  });

  container.appendChild(svg);

  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  BOXES.forEach((b) => {
    const item = document.createElement('span');
    item.className = 'chart-legend-item';
    item.innerHTML = `<span class="chart-legend-swatch" style="background:${b.color}"></span>Box ${b.box}`;
    legend.appendChild(item);
  });
  container.appendChild(legend);
}

export { boxColor };
