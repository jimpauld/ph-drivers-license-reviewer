const VALID_THEMES = ['light', 'dark'];

export function resolveTheme(stored, systemPreference) {
  if (stored && VALID_THEMES.includes(stored)) return stored;
  if (systemPreference && VALID_THEMES.includes(systemPreference)) return systemPreference;
  return 'light';
}

export function applyTheme(document, theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
