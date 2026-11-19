const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = a => a[(Math.random() * a.length) | 0];
const COL = ['#f4a6c0', '#f7c6a8', '#cdb8f0', '#a9d4f5', '#ffe08a'];

/* soft particles: sparkles + hearts on one canvas */
const cv = $('fx'), c = cv.getContext('2d');
let P = [], raf = 0, last = 0, W = 0, H = 0;
function size() { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); }
addEventListener('resize', size); size();
function heart(x, y, s) {
  c.beginPath(); c.moveTo(x, y + s * .35);
  c.bezierCurveTo(x - s, y - s * .3, x - s * 1.1, y + s * .7, x, y + s * 1.2);
  c.bezierCurveTo(x + s * 1.1, y + s * .7, x + s, y - s * .3, x, y + s * .35); c.fill();
}
function spark(x, y, r) {
  c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * .3 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  c.closePath(); c.fill();
}
function add(p) { if (reduce || P.length > 200) return; p.t = 0; P.push(p); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function tick(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now; c.clearRect(0, 0, W, H);
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; if (p.t >= p.life) { P.splice(i, 1); continue; }
    const k = 1 - p.t / p.life; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
    c.globalAlpha = Math.min(1, k * 1.6); c.fillStyle = p.c;
    p.h ? heart(p.x + Math.sin(p.t * 4 + p.w) * 6, p.y, p.s) : spark(p.x, p.y, p.s * k);
  }
  c.globalAlpha = 1; raf = P.length ? requestAnimationFrame(tick) : (c.clearRect(0, 0, W, H), 0);
}
const sparkle = (x, y) => add({ x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-20, 20), vy: rand(-10, 25), g: 20, life: rand(.5, .9), s: rand(4, 8), c: pick(COL) });
const hearts = (x, y, n = 4) => { for (let i = 0; i < n; i++) add({ h: 1, x: x + rand(-20, 20), y, vx: rand(-20, 20), vy: -rand(50, 110), g: 0, life: rand(1.2, 2), s: rand(5, 9), c: pick(COL), w: rand(0, 6) }); };

/* sparkle trail (desktop) + little hearts on tap */
export function sparkles() {
  if (reduce) return;
  if (fine) { let l = 0; addEventListener('pointermove', e => { const n = performance.now(); if (n - l < 60) return; l = n; sparkle(e.clientX, e.clientY); }, { passive: true }); }
  addEventListener('pointerdown', e => { hearts(e.clientX, e.clientY, 3); for (let i = 0; i < 4; i++) sparkle(e.clientX, e.clientY); }, { passive: true });
}

/* soft cursor ring (desktop) */
export function cursor() {
  if (!fine || reduce) return;
  const ring = Object.assign(document.createElement('div'), { className: 'cur-ring', ariaHidden: 'true' });
  const dot = Object.assign(document.createElement('div'), { className: 'cur-dot', ariaHidden: 'true' });
  document.body.append(ring, dot); document.body.classList.add('has-cursor');
  let x = -100, y = -100, rx = x, ry = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; ring.classList.add('on'); dot.classList.add('on'); }, { passive: true });
  document.addEventListener('pointerover', e => {
    ring.classList.toggle('hover', !!e.target.closest('a,button,input,.lb-stage img'));
    ring.classList.toggle('photo', !!e.target.closest('.pic'));
  });
  document.addEventListener('pointerdown', () => ring.classList.add('press'));
  document.addEventListener('pointerup', () => ring.classList.remove('press'));
  document.documentElement.addEventListener('pointerleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); });
  (function loop() { rx += (x - rx) * .18; ry += (y - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
}
