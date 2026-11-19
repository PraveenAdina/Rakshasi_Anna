import { sources, loadInto } from './gallery.js';
import { SISTER_NAME, FROM_NAME, NOTE } from './personal.js';

const SIZES = [4, 3, 4, 4, 3, 2];          // photos per page, cycled for a collage feel
const mq = matchMedia('(max-width: 760px)'); // phones show one page at a time
let lastPage = 0, sound = false, ac = null, shown = false, undo = [];

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const month = d => { const t = new Date(d); return isNaN(t) ? '' : t.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); };

function swish() { // soft paper sound, only if the visitor switched sound on
  if (!sound) return;
  ac ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  const n = ac.sampleRate * .35, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = .7; g.gain.value = .3;
  s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
}

function cell(p, gi, onOpen) {
  const c = el('div', 'pp'), b = el('button', 'pic');
  b.type = 'button'; b.setAttribute('aria-label', `Open ${p.title}`);
  const h = Math.sin((gi + 1) * 12.9898) * 43758.5453; // stable "random" tilt per photo
  b.style.setProperty('--r', ((h - Math.floor(h) - .5) * 5).toFixed(1) + 'deg');
  b._ar = p.w && p.h ? p.w / p.h : .75;
  if (p.kind === 'file' && !p.thumb) { b.classList.add('doc'); b._ar = 1.33; b.textContent = (p.name.split('.').pop() || 'file').toUpperCase() + ' · ' + p.title; }
  else {
    const img = el('img'); img.alt = p.title; img.decoding = 'async'; img._p = p; b.append(img);
    if (p.kind === 'video') b.append(el('span', 'play', '▶'));
  }
  b.addEventListener('click', e => { e.stopPropagation(); onOpen(gi, b); });
  c.append(b); return c;
}

function photoPage(items, num, onOpen) {
  const pg = el('div', 'pg paper', `<span class="pg-date">${month(items[0].p.date)}</span><div class="lay"></div><span class="pg-num">${num}</span>`);
  const n = items.length;
  pg.querySelector('.lay').className = 'lay lay-' + (n === 2 ? (items.every(({ p }) => p.w > p.h) ? '2r' : '2c') : n);
  items.forEach(({ p, gi }) => pg.querySelector('.lay').append(cell(p, gi, onOpen)));
  return pg;
}

// Sizes each photo frame to hug its photo inside its grid cell (never crops, never overflows the page)
function fitPic(pic) {
  const c = pic.parentElement, cw = c.clientWidth - 24, ch = c.clientHeight - 24, ar = pic._ar || .75;
  if (cw <= 0 || ch <= 0) return;
  const w = Math.max(10, Math.min(cw, ch * ar));
  pic.style.width = w.toFixed(1) + 'px'; pic.style.height = (w / ar).toFixed(1) + 'px';
}

function loadImg(img) {
  const p = img._p, pic = img.parentElement;
  img.onload = () => { img.classList.add('ok'); if (!p.w) { pic._ar = img.naturalWidth / img.naturalHeight; fitPic(pic); } };
  loadInto(img, sources(p, 700), () => { img.remove(); pic.classList.add('doc'); pic.append('couldn’t load'); });
}

export function renderAlbum(root, photos, onOpen) {
  undo.forEach(f => f()); undo = [];
  const single = mq.matches;
  const pages = [];
  for (let i = 0, k = 0; i < photos.length; k++) {
    const n = Math.min(SIZES[k % SIZES.length], photos.length - i);
    pages.push(photos.slice(i, i + n).map((p, j) => ({ p, gi: i + j }))); i += n;
  }
  const M = pages.length;

  const C = [
    () => el('div', 'pg cover', `<div class="cv-in"><span>❦</span><h2>Our Memories</h2><p>a little album of us</p><small>${photos.length} memories</small></div><em class="cv-hint">tap to open</em>`),
    () => { const e = el('div', 'pg endpaper', '<div class="plate"><p>for</p><h3></h3><p class="by"></p></div>'); e.querySelector('h3').textContent = SISTER_NAME; e.querySelector('.by').textContent = `with love, ${FROM_NAME} ♡`; return e; },
    ...pages.map((it, n) => () => photoPage(it, n + 1, onOpen))
  ];
  if (!single && C.length % 2) C.push(() => el('div', 'pg paper'));
  const nL = single ? C.length : C.length / 2;

  const stage = el('div', 'stage' + (shown ? '' : ' enter')), wrap = el('div', 'book-wrap'), book = el('div', 'book' + (single ? ' single' : ''));
  const base = el('div', 'base paper'), end = el('div', 'pg end', '<span>❦</span><h3></h3><div class="lines"></div><p class="sign"></p><button type="button" class="ab" data-a="home">Back to the beginning</button>');
  end.querySelector('h3').textContent = `Dear ${SISTER_NAME},`;
  NOTE.forEach(t => { const q = el('p'); q.textContent = t; end.querySelector('.lines').append(q); });
  end.querySelector('.sign').textContent = `With love, ${FROM_NAME} ♡`;
  base.append(end);
  book.append(base);
  const leaves = [];
  for (let j = 0; j < nL; j++) {
    const leaf = el('div', 'leaf'), front = el('div', 'face front');
    front.append(C[single ? j : 2 * j]()); leaf.append(front); leaf.front = front;
    if (!single) { const back = el('div', 'face back'); back.append(C[2 * j + 1]()); leaf.append(back); leaf.back = back; }
    leaves.push(leaf); book.append(leaf);
  }
  wrap.append(book); stage.append(wrap);

  const ui = el('div', 'album-ui', '<button type="button" class="ab" data-a="prev">‹ Prev</button><input type="range" min="0" value="0" aria-label="Jump to page"><span class="lab"></span><button type="button" class="ab" data-a="next">Next ›</button><button type="button" class="ab snd" data-a="snd" aria-pressed="false" title="Page-turn sound">🔇</button>');
  const slider = ui.querySelector('input'), lab = ui.querySelector('.lab');
  slider.max = nL;

  let idx = 0, jt = 0;
  const label = n => {
    if (single) return n === 0 ? 'Cover' : n === 1 ? 'Inside cover' : n - 1 <= M ? `Page ${n - 1} of ${M}` : 'The end';
    if (n === 0) return 'Cover'; if (n === nL) return 'The end';
    const a = [2 * n - 2, 2 * n - 1].filter(x => x >= 1 && x <= M);
    return a.length === 2 ? `Pages ${a[0]}–${a[1]} of ${M}` : a.length ? `Page ${a[0]} of ${M}` : 'Inside cover';
  };
  const hydrate = () => {
    for (let j = Math.max(0, idx - 2); j <= Math.min(nL - 1, idx + 3); j++) {
      if (leaves[j].ld) continue; leaves[j].ld = 1; leaves[j].querySelectorAll('img').forEach(loadImg);
    }
  };
  const setIdx = n => {
    idx = n; lastPage = single ? n : n * 2;
    leaves.forEach((l, j) => {
      l.classList.toggle('flip', j < n); l.style.setProperty('--z', j < n ? j + 1 : nL - j);
      l.front.inert = j !== n; if (l.back) l.back.inert = j !== n - 1;
    });
    base.inert = n !== nL; // the closing page is only reachable once you get there
    wrap.classList.toggle('closed', !single && n === 0);
    slider.value = n; lab.textContent = label(n);
    ui.querySelector('[data-a=prev]').disabled = n === 0; ui.querySelector('[data-a=next]').disabled = n === nL;
    hydrate();
  };
  const turn = d => {
    const n = Math.max(0, Math.min(nL, idx + d)); if (n === idx) return;
    const l = leaves[d > 0 ? idx : n]; l.classList.add('turning'); setTimeout(() => l.classList.remove('turning'), 1150);
    swish(); setIdx(n);
  };
  const jump = t => { clearInterval(jt); jt = setInterval(() => { if (idx === t) return clearInterval(jt); turn(t > idx ? 1 : -1); }, 130); };

  setIdx(Math.min(nL, single ? lastPage : Math.round(lastPage / 2)));
  root.replaceChildren(stage, ui); shown = true;
  const fitAll = () => book.querySelectorAll('.pic').forEach(fitPic);
  fitAll(); const ro = new ResizeObserver(fitAll); ro.observe(book); undo.push(() => ro.disconnect());

  book.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    const x = (e.clientX - book.getBoundingClientRect().left) / book.getBoundingClientRect().width;
    turn(single ? (x < .35 ? -1 : 1) : (x < .5 && idx > 0 ? -1 : 1));
  });
  base.addEventListener('click', e => { if (e.target.closest('[data-a=home]')) jump(0); });
  ui.addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'prev') turn(-1); else if (a === 'next') turn(1);
    else if (a === 'snd') { sound = !sound; e.target.textContent = sound ? '🔈' : '🔇'; e.target.setAttribute('aria-pressed', sound); swish(); }
  });
  slider.addEventListener('input', () => jump(+slider.value));

  let tx = null;
  book.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', e => { if (tx == null) return; const d = e.changedTouches[0].clientX - tx; tx = null; if (Math.abs(d) > 50) turn(d < 0 ? 1 : -1); });

  const key = e => {
    if (!document.getElementById('lb').hidden || document.activeElement === slider) return;
    if (e.key === 'ArrowRight') turn(1); else if (e.key === 'ArrowLeft') turn(-1);
  };
  const rebuild = () => renderAlbum(root, photos, onOpen);
  document.addEventListener('keydown', key); mq.addEventListener('change', rebuild);
  undo.push(() => document.removeEventListener('keydown', key), () => mq.removeEventListener('change', rebuild), () => clearInterval(jt));
}
