// settings.js
// App-Einstellungen (Erweiterung 18.08. #1): Auswahl der Fremdsprache.
// Wird lokal in localStorage gespeichert – analog zu Karten und Verlauf.

const SETTINGS_KEY = 'brainTrain.settings.v1';

// Verfügbare Fremdsprachen. Laut Change Request erscheinen zuerst
// "Englisch" und "Französisch"; weitere Sprachen können hier ergänzt werden.
// 28.08.: "Spanisch" ergänzt – Sprachausgabe (Lernen + Übersicht), Sprach-Tag auf
// der Lernkarte und die automatische Übersetzung folgen automatisch der Auswahl,
// da alle drei über getForeignLanguage() auf diese Liste zugreifen.
export const LANGUAGES = [
  { code: 'en', label: 'Englisch', tag: 'EN', speechLang: 'en-US' },
  { code: 'fr', label: 'Französisch', tag: 'FR', speechLang: 'fr-FR' },
  { code: 'es', label: 'Spanisch', tag: 'ES', speechLang: 'es-ES' },
];

const DEFAULTS = {
  // Die App wurde ursprünglich für Deutsch <-> Französisch gebaut,
  // daher bleibt Französisch die Voreinstellung.
  foreignLanguage: 'fr',
  // Erweiterung 26.08. #6: "Immer vorlesen" im Lernen-Screen, standardmäßig aus.
  autoSpeak: false,
};

const listeners = [];

function load() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch (e) {
    console.error('Konnte Einstellungen nicht laden', e);
    return { ...DEFAULTS };
  }
}

let settings = load();

function persist() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function subscribe(fn) {
  listeners.push(fn);
}

function notify() {
  listeners.forEach((fn) => fn(settings));
}

export function getForeignLanguage() {
  return LANGUAGES.find((l) => l.code === settings.foreignLanguage) || LANGUAGES[1];
}

export function setForeignLanguage(code) {
  if (!LANGUAGES.some((l) => l.code === code)) return;
  if (settings.foreignLanguage === code) return;
  settings = { ...settings, foreignLanguage: code };
  persist();
  notify();
}

// Erweiterung 26.08. #6: "Immer vorlesen" – liest die Fremdsprache automatisch vor,
// sobald die Lernkarte umgedreht wird (Deutsch wird nie automatisch vorgelesen).
export function getAutoSpeak() {
  return !!settings.autoSpeak;
}

export function setAutoSpeak(value) {
  const next = !!value;
  if (settings.autoSpeak === next) return;
  settings = { ...settings, autoSpeak: next };
  persist();
  notify();
}
