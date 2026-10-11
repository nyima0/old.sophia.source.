import { createFigureManager } from './figures/index.js';
import { createNav } from './nav.js';

const CHAR_W = 8;
const CHAR_H = 14;

const canvas = document.getElementById('ascii-stage');
const scrollTarget = window;          // скроллим window, а не контейнер
const sections = Array.from(document.querySelectorAll('.panel-section'));
const navDots = Array.from(document.querySelectorAll('.nav-dot'));
const figureIndexEl = document.getElementById('figure-index');
const figureNameEl = document.getElementById('figure-name');
const figureQuoteEl = document.getElementById('figure-quote');
const figureSwitcher = document.getElementById('figure-switcher');

// ------------------------------------------------------------
//  1. РАЗМЕРЫ
// ------------------------------------------------------------
function getDimensions() {
  const W = canvas.width;
  const H = canvas.height;
  return {
    W,
    H,
    COLS: Math.floor(W / CHAR_W),
    ROWS: Math.floor(H / CHAR_H),
    CHAR_W,
    CHAR_H
  };
}

function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}

resizeCanvas();

// ------------------------------------------------------------
//  2. ФИГУРЫ
// ------------------------------------------------------------
const figures = createFigureManager(canvas, getDimensions);

figures.onChange((figure, index) => {
  if (figureIndexEl) figureIndexEl.textContent = figure.indexStr;
  if (figureNameEl) figureNameEl.textContent = figure.name;
  if (figureQuoteEl) figureQuoteEl.textContent = figure.quote;
});

if (figureSwitcher) {
  figureSwitcher.addEventListener('click', () => {
    figures.next();
  });
}

figures.random();

// ------------------------------------------------------------
//  3. НАВИГАЦИЯ (скролл window)
// ------------------------------------------------------------
createNav(scrollTarget, sections, navDots);

// ------------------------------------------------------------
//  4. WHEEL: зум только в hero, иначе — обычный скролл
// ------------------------------------------------------------
let activeSectionIndex = 0;

function setActiveSectionIndex(i) {
  activeSectionIndex = i;
}

// nav.js должен сообщать наружу, какая секция активна — см. ниже

window.addEventListener('wheel', (e) => {
  // Если активна не hero-секция (не первая) — не мешаем скроллу
  if (activeSectionIndex !== 0) return;

  // В hero: если курсор над канвасом (а он под всем) — зум
  // Но мы не можем точно знать — поэтому даём канвасу обработать,
  // а preventDefault делаем только если реально зумим.
  // Проще: канвас сам обрабатывает wheel, а мы лишь сообщаем ему,
  // разрешён ли зум. См. ниже передачу флага через data-атрибут.
}, { passive: true });

// ------------------------------------------------------------
//  5. РЕСАЙЗ
// ------------------------------------------------------------
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvas();
    const cur = figures.getCurrent();
    if (cur) figures.start(cur.index);
  }, 150);
});

// ------------------------------------------------------------
//  6. ДИАЛОГ (поп-ап)
// ------------------------------------------------------------
const input = document.getElementById('dialogue-input');
const dialogueFeed = document.getElementById('dialogue-feed');
const resetBtn = document.getElementById('dialogue-reset-btn');

let dialogueActive = false;

function openDialogue() {
  if (dialogueActive) return;
  dialogueActive = true;
  document.body.classList.add('dialogue-open');
}

function closeDialogue() {
  if (!dialogueActive) return;
  dialogueActive = false;
  document.body.classList.remove('dialogue-open');
}

if (input) {
  input.addEventListener('focus', () => {
    if (input.value.length > 0) openDialogue();
  });

  input.addEventListener('input', () => {
    if (input.value.length > 0) openDialogue();
    else closeDialogue();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.blur();
      closeDialogue();
      return;
    }
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault();
      appendMessage('user', input.value.trim());
      input.value = '';
      setTimeout(() => {
        appendMessage('system', '...');
      }, 400);
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    if (dialogueFeed) dialogueFeed.innerHTML = '';
    if (input) input.value = '';
    closeDialogue();
  });
}

// клик по затемнению — закрыть
document.addEventListener('click', (e) => {
  if (!dialogueActive) return;
  if (e.target.classList && e.target.classList.contains('dialogue-backdrop')) {
    closeDialogue();
  }
});

function appendMessage(role, text) {
  if (!dialogueFeed) return;
  const el = document.createElement('div');
  el.className = 'msg msg-' + role;
  el.textContent = text;
  dialogueFeed.appendChild(el);
  dialogueFeed.scrollTop = dialogueFeed.scrollHeight;
}
