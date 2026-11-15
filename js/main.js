const year = document.getElementById('current-year');
if (year) year.textContent = new Date().getFullYear();

const STORAGE = {
  contrast: 'mms-high-contrast',
  dark: 'mms-dark-mode',
  large: 'mms-font-large'
};

// Dark mode and high contrast are deliberately mutually exclusive.
let contrastEnabled = localStorage.getItem(STORAGE.contrast) === 'true';
let darkEnabled = localStorage.getItem(STORAGE.dark) === 'true';
const largeEnabled = localStorage.getItem(STORAGE.large) === 'true';
if (contrastEnabled && darkEnabled) {
  contrastEnabled = false;
  localStorage.setItem(STORAGE.contrast, 'false');
}
document.body.classList.toggle('high-contrast', contrastEnabled);
document.body.classList.toggle('dark-mode', darkEnabled);
document.body.classList.toggle('font-large', largeEnabled);

const tools = document.createElement('div');
tools.className = 'accessibility-tools';
tools.setAttribute('role', 'group');
tools.setAttribute('aria-label', 'Display preferences');
tools.innerHTML = `
  <button type="button" id="font-tool" aria-label="Toggle larger text" title="Larger text">A+</button>
  <button type="button" id="dark-tool" aria-label="Toggle dark mode" title="Dark mode"><span aria-hidden="true">🌙</span></button>
  <button type="button" id="contrast-tool" aria-label="Toggle high contrast" title="High contrast"><span aria-hidden="true">◩</span></button>`;
document.body.appendChild(tools);

const fontTool = document.getElementById('font-tool');
const darkTool = document.getElementById('dark-tool');
const contrastTool = document.getElementById('contrast-tool');
const footerContrast = document.getElementById('contrast-toggle');

function syncThemeControls() {
  const isLarge = document.body.classList.contains('font-large');
  const isDark = document.body.classList.contains('dark-mode');
  const isContrast = document.body.classList.contains('high-contrast');
  fontTool.setAttribute('aria-pressed', String(isLarge));
  darkTool.setAttribute('aria-pressed', String(isDark));
  contrastTool.setAttribute('aria-pressed', String(isContrast));
  darkTool.innerHTML = `<span aria-hidden="true">${isDark ? '☀️' : '🌙'}</span>`;
  darkTool.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  darkTool.title = isDark ? 'Light mode' : 'Dark mode';
  if (footerContrast) footerContrast.setAttribute('aria-pressed', String(isContrast));
}

function setDarkMode(enabled) {
  document.body.classList.toggle('dark-mode', enabled);
  localStorage.setItem(STORAGE.dark, String(enabled));
  if (enabled) {
    document.body.classList.remove('high-contrast');
    localStorage.setItem(STORAGE.contrast, 'false');
  }
  syncThemeControls();
}

function setHighContrast(enabled) {
  document.body.classList.toggle('high-contrast', enabled);
  localStorage.setItem(STORAGE.contrast, String(enabled));
  if (enabled) {
    document.body.classList.remove('dark-mode');
    localStorage.setItem(STORAGE.dark, 'false');
  }
  syncThemeControls();
}

fontTool.addEventListener('click', () => {
  const enabled = !document.body.classList.contains('font-large');
  document.body.classList.toggle('font-large', enabled);
  localStorage.setItem(STORAGE.large, String(enabled));
  syncThemeControls();
});
darkTool.addEventListener('click', () => setDarkMode(!document.body.classList.contains('dark-mode')));
contrastTool.addEventListener('click', () => setHighContrast(!document.body.classList.contains('high-contrast')));
if (footerContrast) footerContrast.addEventListener('click', () => setHighContrast(!document.body.classList.contains('high-contrast')));
syncThemeControls();

const revealEls = document.querySelectorAll('.feature-card,.price-card,.section-heading,.quote-card,.why-item');
revealEls.forEach(el => el.classList.add('reveal'));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: .12 });
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

// Enable offline support only when the project is served over HTTP/HTTPS.
if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
  const mainScriptUrl = document.currentScript?.src;
  window.addEventListener('load', () => {
    if (!mainScriptUrl) return;
    const workerUrl = new URL('../service-worker.js', mainScriptUrl);
    navigator.serviceWorker.register(workerUrl).catch(error => {
      console.warn('Offline support could not be enabled:', error);
    });
  });
}
