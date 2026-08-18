// settings.js
// App-Einstellungen (Erweiterung 18.08. #1): Auswahl der Fremdsprache.
// Wird lokal in localStorage gespeichert – analog zu Karten und Verlauf.

const SETTINGS_KEY = 'brainTrain.settings.v1';

// Verfügbare Fremdsprachen. Laut Change Request erscheinen zuerst
// "Englisch" und "Französisch"; weitere Sprachen können hier ergänzt werden.
export const LANGUAGES = [
  { code: 'en', label: 'Englisch', tag: 'EN', speechLang: 'en-US' },
  { code: 'fr', label: 'Französisch', tag: 'FR', speechLang: 'fr-FR' },
];

const DEFAULTS = {
  // Die App wurde ursprünglich für Deutsch <-> Französisch gebaut,
  // daher bleibt Französisch die Voreinstellung.
  foreignLanguage: 'fr',
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
