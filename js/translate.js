// translate.js
// Erweiterung 26.08. #2: Automatische Übersetzung Deutsch → Fremdsprache beim
// manuellen Anlegen einer Vokabel. Nutzt die kostenlose MyMemory-Übersetzungs-API
// (https://mymemory.translated.net) – kein API-Key nötig, CORS-fähig, direkt aus
// dem Browser aufrufbar. Läuft ausschließlich, wenn das Gerät online ist; die
// Aufrufer (screens/add.js) zeigen dafür einen dezenten Hinweis und aktivieren den
// Button nur online (siehe isOnline()).

const ENDPOINT = 'https://api.mymemory.translated.net/get';
const TIMEOUT_MS = 8000;

export function isOnline() {
  // navigator.onLine ist nicht 100% zuverlässig (erkennt z. B. keinen Proxy ohne
  // Internet), reicht aber für einen dezenten Hinweis/De-/Aktivieren des Buttons.
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

// sourceLang/targetLang: ISO-639-1-Codes, z. B. 'de', 'fr', 'en'.
// Wirft einen Error mit einer für den Nutzer verständlichen deutschen Meldung.
export async function translateText(text, sourceLang, targetLang) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('Bitte zuerst ein deutsches Wort eingeben.');
  }
  if (!isOnline()) {
    throw new Error('Keine Internetverbindung – automatische Übersetzung ist offline nicht verfügbar.');
  }

  const url = `${ENDPOINT}?q=${encodeURIComponent(trimmed)}&langpair=${encodeURIComponent(sourceLang)}|${encodeURIComponent(targetLang)}`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;

  let response;
  try {
    response = await fetch(url, controller ? { signal: controller.signal } : undefined);
  } catch (err) {
    throw new Error('Übersetzungsdienst nicht erreichbar. Bitte Internetverbindung prüfen.');
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error('Übersetzungsdienst hat einen Fehler gemeldet. Bitte später erneut versuchen.');
  }

  const data = await response.json();
  const translated = data && data.responseData && data.responseData.translatedText;
  if (!translated || /MYMEMORY WARNING/i.test(translated)) {
    throw new Error('Keine Übersetzung gefunden. Bitte manuell eingeben.');
  }
  return translated;
}
