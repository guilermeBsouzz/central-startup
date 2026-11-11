// VOLTA / controlador da cena 2D.
// A arte é SVG plano gerado por personality.js e animado por CSS (studio.css).
// Este módulo só liga o palco à âncora do layout, pausa e suspende fora da tela.
// Não há WebGL, canvas nem laço de requestAnimationFrame.
let host = null, observer = null;
const root = document.documentElement;
function detach() {
  observer?.disconnect(); observer = null;
  if (host) delete host.dataset.renderer;
  root.classList.remove('scene-offscreen');
}
function pause(value) { root.classList.toggle('scene-paused', Boolean(value)); }
function mount(nextHost, { persona = 'volta', paused = false } = {}) {
  if (!(nextHost instanceof Element)) throw new TypeError('VoltaOrbit.mount requires a DOM host');
  detach(); host = nextHost; host.dataset.renderer = 'svg';
  const anchor = document.querySelector('[data-scene-anchor]');
  if (anchor && !anchor.querySelector('.volta-scene') && window.VoltaArt) anchor.innerHTML = window.VoltaArt.render(persona, false);
  pause(paused);
  if (anchor && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => root.classList.toggle('scene-offscreen', !entries.some(entry => entry.isIntersecting)));
    observer.observe(anchor);
  }
  return window.VoltaOrbit;
}
function dispose() { detach(); host = null; pause(false); }
window.VoltaOrbit = { mount, pause, dispose };
window.dispatchEvent(new CustomEvent('volta-orbit-ready'));
