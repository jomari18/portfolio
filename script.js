const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');
function syncThemeButton() {
  const dark = root.dataset.theme === 'dark';
  toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  toggle.firstElementChild.textContent = dark ? '☼' : '☾';
}
syncThemeButton();
toggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('jc-theme', root.dataset.theme); } catch(e) {}
  syncThemeButton();
});
document.getElementById('copy-email').addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText('jomaricandido18@gmail.com');
    status.textContent = 'Email copied.';
  } catch(e) {
    status.textContent = 'Copy unavailable. Email: jomaricandido18@gmail.com';
  }
});
