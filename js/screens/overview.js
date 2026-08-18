// screens/overview.js
import { boxColor } from '../leitner.js';
import { toggleSpeech, stopSpeech, isSpeechAvailable } from '../speech.js';

export function initOverview(store) {
  const searchInput = document.getElementById('search-input');
  const filterBox = document.getElementById('filter-box');
  const btnExport = document.getElementById('btn-export-csv');
  const btnExportBackup = document.getElementById('btn-export-backup');
  const backupFileInput = document.getElementById('backup-file');
  const tbody = document.getElementById('overview-tbody');
  const emptyEl = document.getElementById('overview-empty');
  const headers = document.querySelectorAll('#overview-table th[data-sort]');

  let sortKey = 'nextReview';
  let sortDir = 1;
  let editingId = null;

  searchInput.addEventListener('input', render);
  filterBox.addEventListener('change', render);
  btnExport.addEventListener('click', () => store.exportCsv());
  btnExportBackup.addEventListener('click', () => store.exportBackup());
  backupFileInput.addEventListener('change', () => {
    const file = backupFileInput.files[0];
    if (!file) return;
    if (!confirm('Backup importieren? Der aktuelle Datenstand auf diesem Gerät wird dabei überschrieben.')) {
      backupFileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importBackup(String(reader.result));
        alert('Backup wurde erfolgreich importiert.');
      } catch (err) {
        alert(`Import fehlgeschlagen: ${err.message}`);
      }
      backupFileInput.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  });

  headers.forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) {
        sortDir *= -1;
      } else {
        sortKey = key;
        sortDir = 1;
      }
      render();
    });
  });

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE');
  }

  function matchesFilters(card) {
    const term = searchInput.value.trim().toLowerCase();
    const matchesTerm = !term || card.front.toLowerCase().includes(term) || card.back.toLowerCase().includes(term);
    const boxVal = filterBox.value;
    const matchesBox = boxVal === 'all' || card.box === Number(boxVal);
    return matchesTerm && matchesBox;
  }

  function buildRow(card) {
    const tr = document.createElement('tr');

    if (editingId === card.id) {
      tr.innerHTML = `
        <td><input type="text" class="edit-front" value="${escapeAttr(card.front)}" /></td>
        <td><input type="text" class="edit-back" value="${escapeAttr(card.back)}" /></td>
        <td><span class="box-chip" style="background:${boxColor(card.box)}">${card.box}</span></td>
        <td>${fmtDate(card.nextReview)}</td>
        <td>${card.repetitions || 0}</td>
        <td class="actions-cell">
          <button class="row-btn save" title="Speichern">💾</button>
          <button class="row-btn cancel" title="Abbrechen">✖</button>
        </td>
      `;
      tr.querySelector('.save').addEventListener('click', () => {
        const front = tr.querySelector('.edit-front').value.trim();
        const back = tr.querySelector('.edit-back').value.trim();
        if (front && back) store.updateCard(card.id, { front, back });
        editingId = null;
        render();
      });
      tr.querySelector('.cancel').addEventListener('click', () => {
        editingId = null;
        render();
      });
    } else {
      // Erweiterung 18.08. #3 (Alternative 1): Lautsprecher-Icon direkt hinter dem
      // Fremdsprachen-Text jeder Zeile. Tipp = vorlesen, erneuter Tipp = stoppen.
      const speakBtnHtml = isSpeechAvailable()
        ? `<button class="row-btn speak" title="Vorlesen" aria-label="Fremdsprache vorlesen">🔊</button>`
        : '';
      tr.innerHTML = `
        <td>${escapeHtml(card.front)}</td>
        <td><span class="back-cell">${escapeHtml(card.back)}${speakBtnHtml}</span></td>
        <td><span class="box-chip" style="background:${boxColor(card.box)}">${card.box}</span></td>
        <td>${fmtDate(card.nextReview)}</td>
        <td>${card.repetitions || 0}</td>
        <td class="actions-cell">
          <button class="row-btn edit" title="Bearbeiten">✎</button>
          <button class="row-btn delete" title="Löschen">🗑</button>
        </td>
      `;
      const speakBtn = tr.querySelector('.speak');
      if (speakBtn) {
        speakBtn.addEventListener('click', () => {
          const started = toggleSpeech(card.back, `overview:${card.id}`, () => {
            speakBtn.classList.remove('speaking');
          });
          speakBtn.classList.toggle('speaking', started);
        });
      }
      tr.querySelector('.edit').addEventListener('click', () => {
        editingId = card.id;
        render();
      });
      tr.querySelector('.delete').addEventListener('click', () => {
        if (confirm(`"${card.front}" wirklich löschen?`)) {
          store.deleteCard(card.id);
        }
      });
    }
    return tr;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function render() {
    // Beim Neuaufbau der Tabelle werden die Lautsprecher-Buttons ersetzt –
    // eine evtl. laufende Wiedergabe daher sauber beenden.
    stopSpeech();
    const cards = store.getCards().filter(matchesFilters);
    cards.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === 'nextReview') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });

    tbody.innerHTML = '';
    if (cards.length === 0) {
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      cards.forEach((c) => tbody.appendChild(buildRow(c)));
    }
  }

  store.subscribe(render);
  render();
  return { render };
}
