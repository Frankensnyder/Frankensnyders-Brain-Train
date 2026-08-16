// screens/learn.js
import { isDue, boxColor } from '../leitner.js';

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
    // Fehler #2: Ohne dies animiert die CSS-Flip-Transition beim Kartenwechsel von der
    // (franzoesischen) Rueckseite zurueck zur Vorderseite, wodurch die neue Karte kurz in
    // Franzoesisch aufblitzt. Transition kurz deaktivieren, Klasse entfernen, Reflow erzwingen,
    // erst danach die Transition wieder freigeben -> die neue Karte erscheint sofort in Deutsch.
    flashcard.classList.add('no-transition');
    flashcard.classList.remove('flipped');
    frontText.textContent = card.front;
    backText.textContent = card.back;
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

  flashcard.addEventListener('click', () => {
    if (dragging) return;
    flipped = !flipped;
    flashcard.classList.toggle('flipped', flipped);
  });
  flashcard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flashcard.click();
    }
  });

  flashcard.addEventListener('touchstart', (e) => {
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

  return { render };
}
