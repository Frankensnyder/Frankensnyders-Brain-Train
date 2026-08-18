// speech.js
// Sprachausgabe der Fremdsprache über die Web Speech API (Erweiterungen 18.08. #2 + #3).
// Läuft komplett lokal im Browser (iOS Safari & Edge unterstützen speechSynthesis),
// es werden keine Daten an externe Dienste geschickt.
//
// iOS-Besonderheiten, die hier berücksichtigt sind:
// 1. Die Utterance muss in einer Modul-Variable gehalten werden, sonst kann sie vom
//    Garbage Collector eingesammelt werden, bevor sie abgespielt wurde (-> Stille).
// 2. cancel() unmittelbar gefolgt von speak() verschluckt auf iOS die neue Wiedergabe.
//    Daher: cancel() nur wenn wirklich etwas läuft, und speak() danach leicht verzögert.
// 3. resume() vor speak(), da die Synthese auf iOS in einem "paused"-Zustand hängen kann.

import { getForeignLanguage } from './settings.js';

export function isSpeechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Merkt sich, welche "Quelle" (Button) gerade spricht, damit ein erneuter
// Tipp auf denselben Button die Wiedergabe stoppt (Toggle-Verhalten) und
// die UI ihren Zustand zurücksetzen kann.
let activeToken = null;
let onActiveEnd = null;
let currentUtterance = null; // Referenz halten (siehe iOS-Hinweis 1)

function clearActive() {
  currentUtterance = null;
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
  const synth = window.speechSynthesis;
  // cancel() nur aufrufen, wenn tatsächlich etwas läuft oder wartet –
  // ein "blindes" cancel() kurz vor speak() macht iOS stumm (Hinweis 2).
  if (synth.speaking || synth.pending) {
    synth.cancel();
  }
  clearActive();
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices() || [];
  const short = lang.slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang && v.lang.toLowerCase() === lang.toLowerCase().replace('_', '-')) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(short)) ||
    null
  );
}

function startSpeaking(text, token) {
  const synth = window.speechSynthesis;
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

  currentUtterance = utterance;
  try { synth.resume(); } catch (e) { /* ignorieren */ }
  synth.speak(utterance);
}

// Startet die Wiedergabe von `text` in der eingestellten Fremdsprache.
// - token: beliebiger eindeutiger Wert je Auslöser (z. B. Karten-ID)
// - onEnd: Callback, wenn die Wiedergabe endet oder gestoppt wird (für Icon-Reset)
// Rückgabe: true = Wiedergabe gestartet, false = gestoppt (Toggle) oder nicht verfügbar.
export function toggleSpeech(text, token, onEnd) {
  if (!isSpeechAvailable() || !text) return false;
  const synth = window.speechSynthesis;

  // Erneuter Tipp auf dieselbe Quelle → Wiedergabe abschalten.
  if (activeToken === token) {
    stopSpeech();
    return false;
  }

  const wasBusy = synth.speaking || synth.pending;
  stopSpeech(); // evtl. andere laufende Wiedergabe beenden

  activeToken = token;
  onActiveEnd = onEnd || null;

  if (wasBusy) {
    // Nach einem cancel() braucht iOS einen kurzen Moment, bevor speak()
    // wieder zuverlässig funktioniert (Hinweis 2). Die Audio-Freigabe durch
    // eine Nutzergeste ist zu diesem Zeitpunkt bereits erfolgt.
    setTimeout(() => {
      if (activeToken === token) startSpeaking(text, token);
    }, 80);
  } else {
    // Direkt in der Nutzergeste starten (wichtig für die erste Wiedergabe auf iOS).
    startSpeaking(text, token);
  }
  return true;
}

// iOS/Safari lädt die Stimmenliste asynchron – einmal anstoßen.
if (isSpeechAvailable()) {
  window.speechSynthesis.getVoices();
  if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}
