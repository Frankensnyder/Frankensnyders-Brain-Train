// screens/add.js
import { parseVocabCsv } from '../storage.js';

export function initAdd(store) {
  const tabBtns = document.querySelectorAll('#screen-add .tab-btn');
  const panels = {
    manual: document.getElementById('tab-manual'),
    csv: document.getElementById('tab-csv'),
  };
  const form = document.getElementById('manual-form');
  const inputFront = document.getElementById('input-front');
  const inputBack = document.getElementById('input-back');
  const manualFeedback = document.getElementById('manual-feedback');

  const csvTextarea = document.getElementById('csv-input');
  const csvFileInput = document.getElementById('csv-file');
  const btnCsvImport = document.getElementById('btn-csv-import');
  const csvFeedback = document.getElementById('csv-feedback');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      Object.values(panels).forEach((p) => p.classList.add('hidden'));
      panels[btn.dataset.tab].classList.remove('hidden');
    });
  });

  function showFeedback(el, message, ok) {
    el.textContent = message;
    el.classList.remove('hidden', 'success', 'error');
    el.classList.add(ok ? 'success' : 'error');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const front = inputFront.value.trim();
    const back = inputBack.value.trim();
    if (!front || !back) return;
    store.addCard(front, back);
    showFeedback(manualFeedback, `"${front}" → "${back}" wurde zu Box 1 hinzugefügt.`, true);
    form.reset();
    inputFront.focus();
  });

  csvFileInput.addEventListener('change', () => {
    const file = csvFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      csvTextarea.value = String(reader.result);
    };
    reader.readAsText(file, 'UTF-8');
  });

  btnCsvImport.addEventListener('click', () => {
    const text = csvTextarea.value.trim();
    if (!text) {
      showFeedback(csvFeedback, 'Bitte zuerst Vokabeln einfügen oder eine CSV-Datei wählen.', false);
      return;
    }
    const pairs = parseVocabCsv(text);
    if (pairs.length === 0) {
      showFeedback(csvFeedback, 'Keine gültigen Zeilen gefunden. Format: Deutsch;Französisch', false);
      return;
    }
    store.importCards(pairs);
    showFeedback(csvFeedback, `${pairs.length} Vokabel${pairs.length === 1 ? '' : 'n'} importiert und zu Box 1 hinzugefügt.`, true);
    csvTextarea.value = '';
    csvFileInput.value = '';
  });

  function render() {
    // Reines Eingabe-Screen, kein dynamischer Zustand aus dem Store noetig.
  }

  return { render };
}
