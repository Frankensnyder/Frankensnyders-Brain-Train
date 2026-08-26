// screens/learn.js
import { isDue, boxColor } from '../leitner.js';
import { toggleSpeech, stopSpeech, isSpeechAvailable } from '../speech.js';
import { getForeignLanguage, getAutoSpeak, setAutoSpeak, subscribe as subscribeSettings } from '../settings.js';
import { normalizeVocabText } from '../text-utils.js';

const SWIPE_THRESHOLD = 80;

export function initLearn(store) {
  const emptyEl = document.getElementById('learn-empty');
  const activeEl = document.getElementById('learn-active');
  const progressEl = document.getElementById('learn-progress');
  const flashcard = document.getElementById('flashcard');
  const inner = flashcard.querySelector('.flashcard-inner');
  const frontText = document.getElementById('card-front-text');
  const backText = document.getElementById('card-back-text');
  const btnWrong = document.getElementById('btn-wrong');
  const btnCorrect = document.getElementById('btn-correct');
  const emptyText = emptyEl.querySelector('p');
  const btnSpeak = document.getElementById('btn-speak-card');
  const backLangTag = document.getElementById('card-back-lang-tag');
  const toggleAutoSpeak = document.getElementById('toggle-auto-speak');

  let queue = [];
  let sessionTotal = 0;
  let currentId = null;
  let flipped = false;
  let dragging = false;
  let startX = 0;
  let deltaX = 0;

  function buildQueue() {
    const cards = store.getCards();
    const due = cards.filter((c) => isDue(c));
    due.sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
    queue = due.map((c) => c.id);
    sessionTotal = queue.length;
  }

  function currentCard() {
    return store.getCards().find((c) => c.id === currentId);
  }

  function showCard() {
    const card = currentCard();
    if (!card) {
      showEmpty(store.getCards().length === 0 ? 'none' : 'done');
      return;
    }
    flipped = false;
    stopSpeech(); // Erweiterung 18.08. #2: Wiedergabe endet beim Kartenwechsel
    backLangTag.textContent = getForeignLanguage().tag;
    // Fehler #2: Ohne dies animiert die CSS-Flip-Transition beim Kartenwechsel von der
    // (franzoesischen) Rueckseite zurueck zur Vorderseite, wodurch die neue Karte kurz in
    // Franzoesisch aufblitzt. Transition kurz deaktivieren, Klasse entfernen, Reflow erzwingen,
    // erst danach die Transition wieder freigeben -> die neue Karte erscheint sofort in Deutsch.
    flashcard.classList.add('no-transition');
    flashcard.classList.remove('flipped');
    // Fehler 26.08. #1: normalizeVocabText() wandelt geschützte/unsichtbare
    // Leerzeichen-Varianten aus bereits gespeicherten Karten in normale Leerzeichen
    // um, damit der Zeilenumbruch auf der Karte zuverlässig funktioniert.
    frontText.textContent = normalizeVocabText(card.front);
    backText.textContent = normalizeVocabText(card.back);
    void inner.offsetHeight; // Reflow erzwingen
    flashcard.classList.remove('no-transition');
    const color = boxColor(card.box);
    flashcard.querySelector('.flashcard-front').style.background = color;
    flashcard.querySelector('.flashcard-back').style.background = color;
    progressEl.textContent = `Karte ${sessionTotal - queue.length} von ${sessionTotal} · Box ${card.box}`;
    activeEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }

  function showEmpty(reason) {
    activeEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    emptyText.textContent = reason === 'none'
      ? 'Noch keine Vokabeln vorhanden. Füge unter "Neu" welche hinzu.'
      : 'Super, für heute sind alle fälligen Karten erledigt!';
  }

  function nextCard() {
    currentId = queue.shift() ?? null;
    if (currentId) {
      showCard();
    } else {
      showEmpty(store.getCards().length === 0 ? 'none' : 'done');
    }
  }

  function flash(kind) {
    flashcard.classList.add(kind === 'correct' ? 'flash-correct' : 'flash-wrong');
    setTimeout(() => flashcard.classList.remove('flash-correct', 'flash-wrong'), 250);
  }

  function answer(correct) {
    if (!currentId) return;
    // Fehler #3: Rahmenfarbe muss die tatsaechliche Bewertung widerspiegeln –
    // gruen bei richtig, rot bei falsch (vorher war hier "correct" hartkodiert).
    flash(correct ? 'correct' : 'wrong');
    stopSpeech();
    store.answerCard(currentId, correct);
    resetDrag();
    setTimeout(nextCard, 220);
  }

  function resetDrag() {
    dragging = false;
    deltaX = 0;
    flashcard.classList.remove('dragging');
    inner.style.transform = '';
    inner.style.opacity = '';
  }

  flashcard.addEventListener('click', (e) => {
    if (dragging) return;
    // Ein Tipp auf den Lautsprecher darf die Karte NICHT umdrehen –
    // doppelt abgesichert (stopPropagation am Button + Ziel-Prüfung hier).
    if (e.target.closest('.speak-btn')) return;
    flipped = !flipped;
    flashcard.classList.toggle('flipped', flipped);
    if (flipped) {
      // Erweiterung 26.08. #6: "Immer vorlesen" – sobald die Fremdsprachen-Seite
      // erscheint, automatisch vorlesen (nur wenn die Einstellung aktiv ist). Die
      // deutsche Seite wird davon nie betroffen, da dieser Zweig nur beim Umdrehen
      // ZUR Fremdsprachen-Seite läuft.
      if (getAutoSpeak() && isSpeechAvailable()) playCardSpeech();
    } else {
      // Wird zur deutschen Seite zurückgedreht, ist der Lautsprecher nicht mehr
      // sichtbar – eine evtl. laufende Wiedergabe wird beendet.
      stopSpeech();
    }
  });

  // --- Erweiterung 18.08. #2: Sprachausgabe der Fremdsprache (Web Speech) ---
  // Der Button liegt als Overlay über der Karte (außerhalb der 3D-gedrehten
  // Fläche, siehe index.html) und ist per CSS nur sichtbar, wenn die
  // Fremdsprachen-Seite angezeigt wird. Tipp = abspielen, erneuter
  // Tipp = Wiedergabe abschalten.
  if (!isSpeechAvailable()) {
    btnSpeak.classList.add('hidden');
    toggleAutoSpeak.disabled = true;
  }

  // Gemeinsame Wiedergabe-Funktion für den manuellen Lautsprecher-Button (Erw.
  // 18.08. #2) und die automatische Wiedergabe beim Umdrehen (Erw. 26.08. #6).
  // Beide nutzen denselben Token, sodass ein Tipp auf den Button eine automatisch
  // gestartete Wiedergabe wie gewohnt stoppen kann. Es wird ausschließlich
  // card.back (Fremdsprache) vorgelesen – die deutsche Seite nie.
  function playCardSpeech() {
    const card = currentCard();
    if (!card) return;
    const started = toggleSpeech(normalizeVocabText(card.back), `learn:${card.id}`, () => {
      btnSpeak.classList.remove('speaking');
    });
    btnSpeak.classList.toggle('speaking', started);
  }

  ['touchstart', 'touchend'].forEach((type) => {
    btnSpeak.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
  });
  btnSpeak.addEventListener('click', (e) => {
    e.stopPropagation(); // darf die Karte nicht umdrehen
    e.preventDefault();
    playCardSpeech();
  });

  // Erweiterung 26.08. #6: Toggle "Immer vorlesen" – Zustand aus den Einstellungen
  // laden/speichern (persistiert wie die Sprachauswahl in localStorage).
  toggleAutoSpeak.checked = getAutoSpeak();
  toggleAutoSpeak.addEventListener('change', () => {
    setAutoSpeak(toggleAutoSpeak.checked);
  });
  flashcard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flashcard.click();
    }
  });

  flashcard.addEventListener('touchstart', (e) => {
    // Berührungen auf dem Lautsprecher-Button gehören nicht zur Wisch-Geste.
    if (e.target.closest('.speak-btn')) return;
    startX = e.touches[0].clientX;
    dragging = true;
    flashcard.classList.add('dragging');
  }, { passive: true });

  flashcard.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    deltaX = e.touches[0].clientX - startX;
    const rotate = deltaX / 12;
    inner.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg) ${flipped ? 'rotateY(180deg)' : ''}`;
  }, { passive: true });

  flashcard.addEventListener('touchend', () => {
    if (!dragging) return;
    if (deltaX > SWIPE_THRESHOLD) {
      answer(true);
    } else if (deltaX < -SWIPE_THRESHOLD) {
      answer(false);
    } else {
      resetDrag();
    }
  });

  btnWrong.addEventListener('click', () => answer(false));
  btnCorrect.addEventListener('click', () => answer(true));

  window.addEventListener('keydown', (e) => {
    if (!document.getElementById('screen-learn').classList.contains('active')) return;
    if (e.key === 'ArrowLeft') answer(false);
    if (e.key === 'ArrowRight') answer(true);
  });

  function render() {
    buildQueue();
    nextCard();
  }

  // Sprach-Tag (z. B. FR/EN) sofort anpassen, wenn die Fremdsprache geändert wird.
  subscribeSettings(() => {
    backLangTag.textContent = getForeignLanguage().tag;
  });

  return { render };
}
