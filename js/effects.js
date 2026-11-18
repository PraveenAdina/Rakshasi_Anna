import { SISTER_NAME, FROM_NAME, NOTE } from './personal.js';

const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const rand = (a, b) => Math.random() * (b - a) + a;
const pick = a => a[(Math.random() * a.length) | 0];
const COL = ['#f4a6c0', '#f7c6a8', '#cdb8f0', '#a9d4f5', '#ffe08a'];

/* ── soft particles: sparkles + hearts on one canvas ── */
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
function add(p) { if (reduce || P.length > 260) return; p.t = 0; P.push(p); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
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
const hearts = (x, y, n = 5) => { for (let i = 0; i < n; i++) add({ h: 1, x: x + rand(-20, 20), y, vx: rand(-20, 20), vy: -rand(50, 110), g: 0, life: rand(1.2, 2), s: rand(5, 9), c: pick(COL), w: rand(0, 6) }); };

/* ── loading cover: progress bar, then the cover opens (once per session) ── */
export function intro() {
  const el = $('intro'), root = document.documentElement;
  if (!root.classList.contains('intro-on') || !el) { el?.remove(); document.body.classList.add('ready'); return; }
  try { sessionStorage.setItem('om-seen', '1'); } catch {}
  const msgs = [[0, 'Dusting off the album…'], [30, 'Finding the happy ones…'], [62, 'Tucking in the little moments…'], [90, 'Almost there…']];
  const msg = $('introMsg'), t0 = performance.now(), dur = 2800; let m = -1;
  (function f(now) {
    const t = Math.min((now - t0) / dur, 1), v = (1 - Math.pow(1 - t, 2)) * 100;
    el.style.setProperty('--p', v.toFixed(1) + '%');
    for (let k = msgs.length - 1; k >= 0; k--) if (v >= msgs[k][0]) { if (k !== m) { m = k; msg.textContent = msgs[k][1]; } break; }
    if (t < 1) return requestAnimationFrame(f);
    msg.textContent = 'Here we go ♡';
    setTimeout(() => { el.classList.add('open'); hearts(W / 2, H / 2, 8); }, 450);
    setTimeout(() => document.body.classList.add('ready'), 800);
    setTimeout(() => el.remove(), 2200);
  })(t0);
}

/* ── cursor ring (desktop) ── */
export function cursor() {
  if (!fine || reduce) return;
  const ring = Object.assign(document.createElement('div'), { className: 'cur-ring', ariaHidden: 'true' });
  const dot = Object.assign(document.createElement('div'), { className: 'cur-dot', ariaHidden: 'true' });
  document.body.append(ring, dot); document.body.classList.add('has-cursor');
  let x = -100, y = -100, rx = x, ry = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; ring.classList.add('on'); dot.classList.add('on'); }, { passive: true });
  document.addEventListener('pointerover', e => {
    ring.classList.toggle('hover', !!e.target.closest('a,button,.lb-stage img'));
    ring.classList.toggle('photo', !!e.target.closest('.ph'));
  });
  document.addEventListener('pointerdown', () => ring.classList.add('press'));
  document.addEventListener('pointerup', () => ring.classList.remove('press'));
  document.documentElement.addEventListener('pointerleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); });
  (function loop() { rx += (x - rx) * .18; ry += (y - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
}

/* ── everything else: sparkle trail, drifting hearts, photo tilt, hero parallax, the note ── */
export function magic() {
  /* the note */
  $('noteTo').textContent = `Dear ${SISTER_NAME},`;
  $('noteBody').innerHTML = NOTE.map((t, i) => `<p style="--i:${i}"></p>`).join('');
  [...$('noteBody').children].forEach((p, i) => { p.textContent = NOTE[i]; });
  $('noteSign').textContent = `With love, ${FROM_NAME} ♡`;
  const env = $('envelope'), paper = $('paper'), wrap = $('envWrap'); let opened = false;
  env.addEventListener('click', () => {
    if (opened) return; opened = true; env.classList.add('open');
    const r = env.getBoundingClientRect(); hearts(r.left + r.width / 2, r.top + r.height / 2, 10);
    setTimeout(() => {
      wrap.classList.add('gone'); paper.hidden = false; paper.classList.add('show');
      setTimeout(() => paper.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 250);
    }, reduce ? 100 : 1500);
  });
  if (reduce) return;

  /* sparkle trail + heart burst on tap */
  if (fine) { let l = 0; addEventListener('pointermove', e => { const n = performance.now(); if (n - l < 60) return; l = n; sparkle(e.clientX, e.clientY); }, { passive: true }); }
  addEventListener('pointerdown', e => { hearts(e.clientX, e.clientY, 4); for (let i = 0; i < 5; i++) sparkle(e.clientX, e.clientY); }, { passive: true });

  /* hearts and petals drifting up the hero, only while it is on screen */
  const layer = $('heroFloat'), hero = $('hero'); let tm = 0;
  const spawn = () => {
    if (document.hidden || layer.childElementCount > 14) return;
    const s = document.createElement('span'); s.className = 'fl'; s.textContent = pick(['♡', '✿', '✦', '❀', '♥']);
    const d = rand(9, 15);
    s.style.cssText = `left:${rand(2, 96)}%;font-size:${rand(14, 30)}px;color:${pick(COL)};--dur:${d}s;--dx:${rand(-60, 60)}px`;
    layer.append(s); setTimeout(() => s.remove(), d * 1000);
  };
  new IntersectionObserver(([e]) => { clearInterval(tm); tm = e.isIntersecting ? setInterval(spawn, 900) : 0; }).observe(hero);

  /* gentle 3D tilt on photos */
  if (fine) {
    const g = $('gallery'); let cur = null;
    g.addEventListener('pointermove', e => {
      const el = e.target.closest('.ph.settled');
      if (cur && cur !== el) { cur.style.setProperty('--rx', '0deg'); cur.style.setProperty('--ry', '0deg'); }
      cur = el; if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 8).toFixed(1) + 'deg');
      el.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 8).toFixed(1) + 'deg');
    }, { passive: true });
    g.addEventListener('pointerleave', () => { cur?.style.setProperty('--rx', '0deg'); cur?.style.setProperty('--ry', '0deg'); cur = null; });
  }

  /* hero drifts and fades as you scroll */
  const inner = hero.querySelector('.hero-inner'); let tk = false;
  addEventListener('scroll', () => {
    if (tk || scrollY > innerHeight) return; tk = true;
    requestAnimationFrame(() => { tk = false; inner.style.transform = `translateY(${scrollY * .25}px)`; inner.style.opacity = Math.max(0, 1 - scrollY / (innerHeight * .8)); });
  }, { passive: true });
}
