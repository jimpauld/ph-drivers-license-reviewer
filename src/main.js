import { resolveTheme, applyTheme } from './theme.js';

const THEME_KEY = 'phdlr:theme';

function getSystemPreference() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : null;
}

function currentTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return resolveTheme(stored, getSystemPreference());
}

function setTheme(theme) {
  applyTheme(document, theme);
  localStorage.setItem(THEME_KEY, theme);
  updateToggle(theme);
}

function updateToggle(theme) {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  const label = toggle.querySelector('.theme-toggle-label');
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

function initTheme() {
  setTheme(currentTheme());
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

if (typeof window !== 'undefined') {
  initTheme();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}
