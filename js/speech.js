// speech.js
// Sprachausgabe der Fremdsprache über die Web Speech API (Erweiterungen 18.08. #2 + #3).
// Läuft komplett lokal im Browser (iOS Safari & Edge unterstützen speechSynthesis),
// es werden keine Daten an externe Dienste geschickt.

import { getForeignLanguage } from './settings.js';

export function isSpeechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Merkt sich, welche "Quelle" (Button) gerade spricht, damit ein erneuter
// Tipp auf denselben Button die Wiedergabe stoppt (Toggle-Verhalten) und
// die UI ihren Zustand zurücksetzen kann.
let activeToken = null;
let onActiveEnd = null;

function clearActive() {
  if (onActiveEnd) {
    const cb = onActiveEnd;
    onActiveEnd = null;
    activeToken = null;
    cb();
  } else {
    activeToken = null;
  }
}

export function stopSpeech() {
  if (!isSpeechAvailable()) return;
  window.speechSynthesis.cancel();
  clearActive();
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices() || [];
  const short = lang.slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang && v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(short)) ||
    null
  );
}

// Startet die Wiedergabe von `text` in der eingestellten Fremdsprache.
// - token: beliebiger eindeutiger Wert je Auslöser (z. B. Karten-ID)
// - onEnd: Callback, wenn die Wiedergabe endet oder gestoppt wird (für Icon-Reset)
// Rückgabe: true = Wiedergabe gestartet, false = gestoppt (Toggle) oder nicht verfügbar.
export function toggleSpeech(text, token, onEnd) {
  if (!isSpeechAvailable() || !text) return false;

  // Erneuter Tipp auf dieselbe Quelle → Wiedergabe abschalten.
  if (activeToken === token) {
    stopSpeech();
    return false;
  }

  // Eine evtl. andere laufende Wiedergabe zuerst beenden.
  stopSpeech();

  const lang = getForeignLanguage().speechLang;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;

  utterance.onend = () => {
    if (activeToken === token) clearActive();
  };
  utterance.onerror = () => {
    if (activeToken === token) clearActive();
  };

  activeToken = token;
  onActiveEnd = onEnd || null;
  window.speechSynthesis.speak(utterance);
  return true;
}

// iOS/Safari lädt die Stimmenliste asynchron – einmal anstoßen.
if (isSpeechAvailable()) {
  window.speechSynthesis.getVoices();
  if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}
