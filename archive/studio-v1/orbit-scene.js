import * as THREE from '/vendor/three.module.js';

const COLORS = { 'jose-isaias': '#d7c4a2', 'clara-prado': '#de8976', amanda: '#c78f99',
  'julia-alves': '#d6b76b', igor: '#63b6ad', guilherme: '#789ae3', 'jose-roberto': '#b6a0d4' };
const INK = '#071f22', LIME = '#d8ed91', COPPER = '#c7a383', ICE = '#e3efeb';
let host, canvas, renderer, scene, camera, sculpture, svg, ro, io, cleanup = [];
let attempted = false, paused = false, reduced = false, visible = true, raf = 0;
let start = 0, end = 0, last = -Infinity, pointerEnd = 0, px = 0, py = 0, dirty = true;
let accent = COLORS.guilherme, serial = 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const active = () => host && !paused && visible && !document.hidden;
function stop() { cancelAnimationFrame(raf); raf = 0; }
function detach() {
  stop(); ro?.disconnect(); io?.disconnect(); ro = io = null;
  cleanup.forEach(fn => fn()); cleanup = [];
  if (host) delete host.dataset.renderer;
}
function listen(target, name, fn) {
  target.addEventListener(name, fn, { passive: true });
  cleanup.push(() => target.removeEventListener(name, fn));
}
// Closed rectangular ribbon: one full twist, with an irregular recovered-metal contour.
function point(t, side, depth = 0) {
  const radius = 1.48 + .13 * Math.cos(3 * t), width = .39 + .07 * Math.sin(2 * t);
  const radial = radius + side * width * Math.cos(t) - depth * Math.sin(t);
  return [radial * Math.cos(t), radial * Math.sin(t),
    .25 * Math.sin(2 * t) + side * width * Math.sin(t) + depth * Math.cos(t)];
}
function ribbon() {
  const positions = [], indices = [], n = 160, corners = [[-1, -.035], [1, -.035], [1, .035], [-1, .035]];
  for (let i = 0; i <= n; i++) for (const [s, d] of corners) positions.push(...point(i / n * Math.PI * 2, s, d));
  const geometry = new THREE.BufferGeometry();
  for (let face = 0; face < 4; face++) {
    const offset = indices.length;
    for (let i = 0; i < n; i++) {
      const a = i * 4 + face, b = i * 4 + (face + 1) % 4, c = b + 4, d = a + 4;
      indices.push(a, b, d, b, c, d);
    }
    geometry.addGroup(offset, indices.length - offset, face % 2 ? 2 : face / 2);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
function releaseGPU() {
  if (canvas) canvas.removeEventListener('webglcontextlost', lost);
  const geometries = new Set(), materials = new Set();
  scene?.traverse(obj => {
    if (obj.geometry) geometries.add(obj.geometry);
    if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
  renderer = scene = camera = sculpture = null;
}
function lost(event) { event.preventDefault(); fallback(); }
function initialize() {
  if (attempted) return;
  attempted = true; canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true'); canvas.className = 'volta-orbit-canvas';
  try {
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!context || context.isContextLost()) return;
    renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
    renderer.setClearColor(INK, 0); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(INK, 7, 14);
    camera = new THREE.PerspectiveCamera(40, 700 / 420, .1, 40); camera.position.set(0, 0, 7.4);
    scene.add(new THREE.HemisphereLight(ICE, INK, 2));
    for (const [color, power, position] of [[LIME, 4, [-3, 4, 5]], [COPPER, 3, [4, -2, 3]], [ICE, 5, [0, 3, -4]]]) {
      const light = new THREE.DirectionalLight(color, power); light.position.set(...position); scene.add(light);
    }
    sculpture = new THREE.Group(); sculpture.scale.setScalar(1.12); scene.add(sculpture);
    const material = (color, metalness) => new THREE.MeshStandardMaterial({ color, metalness, roughness: .48, side: THREE.DoubleSide });
    const lime = material(LIME, .36), personal = material(accent, .48), copper = material(COPPER, .7), ice = material(ICE, .14);
    personal.name = 'persona';
    sculpture.add(new THREE.Mesh(ribbon(), [lime, personal, copper]));
    const edge = new THREE.LineBasicMaterial({ color: ICE, transparent: true, opacity: .42 });
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 161 }, (_, i) => new THREE.Vector3(...point(i / 160 * Math.PI * 2, side, .037)));
      sculpture.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), edge));
    }
    for (let i = 0; i < 11; i++) {
      const t = i * 2.39996, radius = 2.25 + .23 * Math.sin(i * 3);
      const geometry = i % 3 ? new THREE.IcosahedronGeometry(.14 + i % 4 * .035, 0) : new THREE.TetrahedronGeometry(.27, 0);
      const mesh = new THREE.Mesh(geometry, [personal, copper, ice, lime][i % 4]);
      mesh.position.set(Math.cos(t) * radius * 1.12, Math.sin(t) * radius * .76, Math.sin(i * 1.7) * 1.2 - .4);
      mesh.rotation.set(i * .7, i * .9, i * .4); mesh.scale.set(1.4, .64, 1);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edge)); sculpture.add(mesh);
    }
    canvas.addEventListener('webglcontextlost', lost);
  } catch { releaseGPU(); }
}
function makeSVG() {
  const id = `volta-orbit-${++serial}`, project = p => [350 + p[0] * 89 + p[2] * 24, 210 + p[1] * 76 - p[2] * 29];
  const xy = p => project(p).map(v => v.toFixed(2)).join(','), faces = [];
  for (let i = 0; i < 100; i++) {
    const t = i / 100 * Math.PI * 2, next = (i + 1) / 100 * Math.PI * 2;
    const points = [point(t, -1), point(t, 1), point(next, 1), point(next, -1)];
    faces.push({ z: points.reduce((sum, p) => sum + p[2], 0),
      shape: `<polygon points="${points.map(xy).join(' ')}" fill="url(#${id}-${Math.sin(t) > 0 ? 'lime' : 'metal'})"/>` });
  }
  faces.sort((a, b) => a.z - b.z);
  const edges = [-1, 1].map(side => `<polyline points="${Array.from({ length: 101 }, (_, i) => xy(point(i / 100 * Math.PI * 2, side))).join(' ')}" fill="none" stroke="${ICE}" stroke-opacity=".55" stroke-width=".8"/>`).join('');
  const fragments = Array.from({ length: 10 }, (_, i) => {
    const t = i * 2.39996, x = 350 + Math.cos(t) * (235 + i % 3 * 10), y = 210 + Math.sin(t) * 154, s = 9 + i % 4 * 3;
    return `<g transform="translate(${x} ${y}) rotate(${i * 37})"><path d="M ${-s} 0 L 0 ${-s} L ${s * 1.4} 0 L 2 ${s} Z" fill="${[accent, COPPER, ICE, LIME][i % 4]}"/><path d="M ${-s} 0 L 0 ${-s} L 2 ${s} Z" fill="${INK}" fill-opacity=".32"/><path d="M ${-s} 0 L 0 ${-s} L ${s * 1.4} 0" fill="none" stroke="${ICE}" stroke-width=".7" stroke-opacity=".6"/></g>`;
  }).join('');
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', '0 0 700 420'); node.setAttribute('width', '700'); node.setAttribute('height', '420');
  node.setAttribute('aria-hidden', 'true'); node.setAttribute('focusable', 'false'); node.setAttribute('class', 'volta-orbit-svg');
  node.innerHTML = `<defs><linearGradient id="${id}-lime" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${ICE}"/><stop offset=".35" stop-color="${LIME}"/><stop offset="1" stop-color="#547861"/></linearGradient><linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset=".52" stop-color="${COPPER}"/><stop offset="1" stop-color="#365c59"/></linearGradient><radialGradient id="${id}-haze"><stop stop-color="#1d5355" stop-opacity=".5"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient><filter id="${id}-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="${INK}" flood-opacity=".65"/></filter></defs><ellipse cx="350" cy="220" rx="320" ry="195" fill="url(#${id}-haze)"/><g data-sculpture="" filter="url(#${id}-shadow)">${fragments}${faces.map(f => f.shape).join('')}${edges}</g>`;
  return node;
}
function fallback() {
  stop(); releaseGPU(); canvas?.remove(); svg?.remove();
  if (!host) return;
  svg = makeSVG(); host.append(svg); host.dataset.renderer = 'svg'; resize();
}
function resize() {
  if (!host) return;
  const bounds = host.getBoundingClientRect(), width = Math.max(1, bounds.width || 700), height = Math.max(1, bounds.height || 420);
  if (renderer) {
    try {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
    } catch { fallback(); return; }
  } else if (svg) { svg.setAttribute('width', width); svg.setAttribute('height', height); }
  dirty = true; if (active()) { draw(performance.now()); schedule(); }
}
function draw(now) {
  const phase = reduced ? 0 : clamp((Math.min(now, end) - start) / 4800, 0, 1);
  const drift = Math.sin(phase * Math.PI) * .16;
  if (renderer) {
    sculpture.rotation.set(.35 + py + drift * .3, -.35 + px + drift, -.28 + drift * .3);
    try { renderer.render(scene, camera); } catch { fallback(); }
  } else if (svg) svg.querySelector('[data-sculpture]')?.setAttribute('transform', `translate(350 210) rotate(${(px + drift) * 18}) skewX(${py * 12}) translate(-350 -210)`);
  dirty = false;
}
function moving(now) { return !reduced && (now < end || now < pointerEnd); }
function schedule() {
  if (!raf && active() && moving(performance.now())) raf = requestAnimationFrame(tick);
}
function tick(now) {
  raf = 0; if (!active() || reduced) return;
  if (now - last >= 1000 / 24) {
    const decay = Math.exp(-Math.min(100, now - last) / 140); px *= decay; py *= decay;
    if (now >= pointerEnd) px = py = 0;
    last = now; draw(now);
  }
  if (moving(now)) schedule();
  else { px = py = 0; dirty = true; /* Final frame obeys the same 24fps cap. */
    if (now - last >= 1000 / 24) { draw(now); dirty = false; }
    else raf = requestAnimationFrame(finish);
  }
}
function finish(now) {
  raf = 0; if (!active() || reduced) return;
  if (now - last < 1000 / 24) { raf = requestAnimationFrame(finish); return; }
  last = now; draw(now); schedule();
}
function resume() {
  if (!active()) { stop(); return; }
  const now = performance.now();
  if (now >= pointerEnd) px = py = 0;
  if (dirty || reduced || !moving(now)) draw(now); schedule();
}
function mount(nextHost, { persona = 'guilherme', reducedMotion = false, paused: initialPause = false } = {}) {
  if (!(nextHost instanceof Element)) throw new TypeError('VoltaOrbit.mount requires a DOM host');
  detach(); svg?.remove(); svg = null; host = nextHost;
  host.querySelectorAll('.orbit-poster').forEach(node=>node.remove());
  accent = COLORS[persona] || COLORS.guilherme; paused = Boolean(initialPause); reduced = Boolean(reducedMotion);
  visible = !('IntersectionObserver' in window); px = py = 0; pointerEnd = 0;
  start = performance.now(); end = start + (reduced ? 0 : 4800); last = -Infinity;
  initialize();
  if (renderer) {
    scene.traverse(obj => (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => {
      if (m?.name === 'persona') m.color.set(accent);
    }));
    host.append(canvas); host.dataset.renderer = 'webgl';
  } else { svg = makeSVG(); host.append(svg); host.dataset.renderer = 'svg'; }
  resize(); draw(start);
  listen(host, 'pointermove', event => {
    if (!active() || reduced) return;
    const rect = host.getBoundingClientRect();
    px = clamp((event.clientX - rect.left) / Math.max(rect.width, 1) - .5, -.5, .5) * .45;
    py = clamp((event.clientY - rect.top) / Math.max(rect.height, 1) - .5, -.5, .5) * .3;
    pointerEnd = performance.now() + 900; schedule();
  });
  listen(document, 'visibilitychange', resume);
  if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(host); }
  else listen(window, 'resize', resize);
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); resume(); }); io.observe(host);
  }
  schedule(); return window.VoltaOrbit;
}
function pause(value) { paused = Boolean(value); if (paused) stop(); else resume(); }
function dispose() {
  detach(); releaseGPU(); canvas?.remove(); svg?.remove();
  host = canvas = svg = null; attempted = false; px = py = 0;
}
window.VoltaOrbit = { mount, pause, dispose };
window.dispatchEvent(new CustomEvent('volta-orbit-ready'));
