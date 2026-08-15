// screens/home.js
import { BOXES, isDue } from '../leitner.js';

export function initHome(store, { onGoToLearn }) {
  const bannerBtn = document.getElementById('due-banner');
  const bannerText = document.getElementById('due-banner-text');
  const elTotal = document.getElementById('stat-total');
  const elMastered = document.getElementById('stat-mastered');
  const elDue = document.getElementById('stat-due');
  const boxList = document.getElementById('box-progress-list');
  const allDoneMsg = document.getElementById('all-done-message');

  bannerBtn.addEventListener('click', () => onGoToLearn());

  function render() {
    const cards = store.getCards();
    const total = cards.length;
    const mastered = cards.filter((c) => c.box === 5).length;
    const due = cards.filter((c) => isDue(c)).length;

    elTotal.textContent = total;
    elMastered.textContent = mastered;
    elDue.textContent = due;

    if (total === 0) {
      bannerText.textContent = 'Noch keine Vokabeln – lege unter "Neu" welche an.';
      bannerBtn.disabled = true;
      allDoneMsg.classList.add('hidden');
    } else if (due === 0) {
      bannerText.textContent = '';
      bannerBtn.disabled = true;
      allDoneMsg.classList.remove('hidden');
    } else {
      bannerText.textContent = `${due} Karte${due === 1 ? '' : 'n'} fällig – jetzt lernen`;
      bannerBtn.disabled = false;
      allDoneMsg.classList.add('hidden');
    }

    boxList.innerHTML = '';
    BOXES.forEach((b) => {
      const count = cards.filter((c) => c.box === b.box).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const row = document.createElement('div');
      row.className = 'box-progress-row';
      row.innerHTML = `
        <span class="box-progress-swatch" style="background:${b.color}"></span>
        <span class="box-progress-label">Box ${b.box}</span>
        <span class="box-progress-track"><span class="box-progress-fill" style="width:${pct}%;background:${b.color}"></span></span>
        <span class="box-progress-count">${count}</span>
      `;
      boxList.appendChild(row);
    });
  }

  store.subscribe(render);
  render();
  return { render };
}
