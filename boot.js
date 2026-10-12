// Runs before first paint: enables JS-only styles and decides whether to show the welcome splash.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  let seen = false;
  try { seen = sessionStorage.getItem('jc-intro') === '1'; sessionStorage.setItem('jc-intro', '1'); } catch (e) {}
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || reduced || location.hash) root.classList.add('no-intro');
})();
