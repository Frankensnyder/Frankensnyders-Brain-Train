// app.js — Orchestriert Navigation zwischen den 5 Screens.
import * as store from './store.js';
import * as settings from './settings.js';
import { stopSpeech } from './speech.js';
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
