// Runs before first paint: applies the saved theme, enables JS-only styles and decides on the welcome splash.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  let theme = null, seen = false;
  try {
    theme = localStorage.getItem('jc-theme');
    seen = sessionStorage.getItem('jc-intro') === '1';
    sessionStorage.setItem('jc-intro', '1');
  } catch (e) {}
  root.dataset.theme = theme === 'light' || theme === 'dark' ? theme : 'dark';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || reduced || location.hash) root.classList.add('no-intro');
})();
