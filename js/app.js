// app.js — Orchestriert Navigation zwischen den 5 Screens.
import * as store from './store.js';
import { initHome } from './screens/home.js';
import { initLearn } from './screens/learn.js';
import { initAdd } from './screens/add.js';
import { initOverview } from './screens/overview.js';
import { initStats } from './screens/stats.js';

const screens = {};
const navButtons = document.querySelectorAll('.nav-btn');
const screenEls = document.querySelectorAll('.screen');

function showScreen(name) {
  screenEls.forEach((s) => s.classList.toggle('active', s.dataset.screen === name));
  navButtons.forEach((b) => b.classList.toggle('active', b.dataset.screen === name));
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

// --- PWA: Service Worker fuer Offline-Betrieb registrieren ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((err) => {
      console.warn('Service Worker Registrierung fehlgeschlagen:', err);
    });
  });
}
