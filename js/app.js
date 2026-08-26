// app.js — Orchestriert Navigation zwischen den 5 Screens.
import * as store from './store.js';
import * as settings from './settings.js';
import { stopSpeech } from './speech.js';
import { APP_VERSION } from './version.js';
import { initHome } from './screens/home.js';
import { initLearn } from './screens/learn.js';
import { initAdd } from './screens/add.js';
import { initOverview } from './screens/overview.js';
import { initStats } from './screens/stats.js';

const screens = {};
const navButtons = document.querySelectorAll('.nav-btn');
const screenEls = document.querySelectorAll('.screen');
const settingsBtn = document.getElementById('btn-settings');

function showScreen(name) {
  stopSpeech(); // laufende Sprachausgabe beim Screen-Wechsel beenden
  screenEls.forEach((s) => s.classList.toggle('active', s.dataset.screen === name));
  navButtons.forEach((b) => b.classList.toggle('active', b.dataset.screen === name));
  // Erweiterung 18.08. #1: Zahnrad oben rechts im Header, auf dem Home-Screen.
  settingsBtn.classList.toggle('hidden', name !== 'home');
  screens[name]?.render();
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => showScreen(btn.dataset.screen));
});

screens.home = initHome(store, { onGoToLearn: () => showScreen('learn') });
screens.learn = initLearn(store);
screens.add = initAdd(store);
screens.overview = initOverview(store);
screens.stats = initStats(store);

showScreen('home');

// --- Erweiterung 18.08. #1: Einstellungsdialog (Zahnrad → Auswahl der Fremdsprache) ---
const settingsOverlay = document.getElementById('settings-overlay');
const settingsLanguages = document.getElementById('settings-languages');
const settingsClose = document.getElementById('btn-settings-close');

function renderSettingsDialog() {
  const current = settings.getForeignLanguage().code;
  settingsLanguages.innerHTML = '';
  settings.LANGUAGES.forEach((lang) => {
    const label = document.createElement('label');
    label.className = 'settings-language-option';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'foreign-language';
    radio.value = lang.code;
    radio.checked = lang.code === current;
    radio.addEventListener('change', () => {
      settings.setForeignLanguage(lang.code);
    });
    const text = document.createElement('span');
    text.textContent = lang.label;
    label.appendChild(radio);
    label.appendChild(text);
    settingsLanguages.appendChild(label);
  });
}

settingsBtn.addEventListener('click', () => {
  renderSettingsDialog();
  settingsOverlay.classList.remove('hidden');
});
settingsClose.addEventListener('click', () => settingsOverlay.classList.add('hidden'));
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) settingsOverlay.classList.add('hidden');
});

// --- Erweiterung 26.08. #3 + #4: Versionsnummer auf dem Start-Screen (Splash) und
//     im Einstellungsdialog. Eine einzige Quelle (version.js), damit beide Stellen
//     immer synchron sind. ---
document.getElementById('splash-version').textContent = APP_VERSION;
document.getElementById('settings-version').textContent = `Version ${APP_VERSION}`;

// --- Erweiterung 26.08. #5: Info-Dialog "Wie funktioniert das Leitner-System?" ---
// Die Boxen-Übersicht wird direkt aus store.leitner.BOXES erzeugt (gleiche Quelle
// wie die tatsächliche Lernlogik), damit die Erklärung nie von der echten
// Boxen-/Intervall-Konfiguration abweichen kann.
const leitnerInfoOverlay = document.getElementById('leitner-info-overlay');
const leitnerInfoContent = document.getElementById('leitner-info-content');
const btnLeitnerInfo = document.getElementById('btn-leitner-info');
const btnLeitnerInfoClose = document.getElementById('btn-leitner-info-close');

function renderLeitnerInfo() {
  const rows = store.leitner.BOXES.map((b) => `
    <div class="leitner-box-row">
      <span class="box-progress-swatch" style="background:${b.color}"></span>
      <span class="leitner-box-name">Box ${b.box}</span>
      <span class="leitner-box-desc">${b.label}</span>
      <span class="leitner-box-days">alle ${b.days} Tag${b.days === 1 ? '' : 'e'}</span>
    </div>
  `).join('');
  leitnerInfoContent.innerHTML = `
    <p>Jede Vokabel durchläuft 5 Boxen. Die Box einer Karte bestimmt, in welchem
    Abstand sie wiederholt wird – je höher die Box, desto seltener taucht die Karte
    auf.</p>
    <div class="leitner-box-list">${rows}</div>
    <p><strong>Richtig beantwortet:</strong> Die Karte wandert eine Box nach oben
    (Box 5 ist die höchste) und wird erst nach dem für die neue Box geltenden
    Intervall wieder abgefragt.</p>
    <p><strong>Falsch beantwortet:</strong> Die Karte fällt zurück auf Box 1 und wird
    schon am nächsten Tag wieder abgefragt.</p>
    <p>Karten in Box 1 gelten immer als fällig und werden bei jeder Lerneinheit
    eingemischt, bis sie richtig beantwortet wurden.</p>
  `;
}

btnLeitnerInfo.addEventListener('click', () => {
  renderLeitnerInfo();
  settingsOverlay.classList.add('hidden');
  leitnerInfoOverlay.classList.remove('hidden');
});
btnLeitnerInfoClose.addEventListener('click', () => leitnerInfoOverlay.classList.add('hidden'));
leitnerInfoOverlay.addEventListener('click', (e) => {
  if (e.target === leitnerInfoOverlay) leitnerInfoOverlay.classList.add('hidden');
});

// --- Erweiterung #6: animierter Splash-Screen fuer ca. 2 Sekunden beim App-Start,
//     danach automatisch (weil bereits im Hintergrund gerendert) der Home-Bildschirm. ---
const splash = document.getElementById('splash-screen');
if (splash) {
  setTimeout(() => {
    splash.classList.add('splash-hide');
    setTimeout(() => splash.remove(), 400);
  }, 1600);
}

// --- PWA: Service Worker fuer Offline-Betrieb registrieren ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((err) => {
      console.warn('Service Worker Registrierung fehlgeschlagen:', err);
    });
  });
}
