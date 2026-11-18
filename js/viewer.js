import { sources, loadInto } from './gallery.js';

const $ = id => document.getElementById(id);
const lb = $('lb'), img = $('lb-img'), frame = $('lb-frame'), spin = lb.querySelector('.lb-spin');
let photos = [], idx = 0, opener = null, tx = null, token = 0;

export const setPhotos = list => { photos = list; };

function show(i, dir = 0) {
  idx = (i + photos.length) % photos.length;
  const p = photos[idx], t = ++token;
  const swap = () => {
    if (t !== token) return;
    img.className = ''; img.alt = p.title; frame.removeAttribute('src');
    const embed = p.kind !== 'image'; // videos and documents play in Drive's own viewer
    lb.classList.toggle('vid', embed);
    if (embed) { frame.src = `https://drive.google.com/file/d/${p.id}/preview`; spin.style.display = 'none'; }
    else {
      spin.style.display = '';
      img.onload = () => { if (t === token) { img.classList.add('ok'); spin.style.display = 'none'; } };
      loadInto(img, sources(p, 2000), () => { spin.style.display = 'none'; });
      [idx + 1, idx - 1].forEach(j => {
        const q = photos[(j + photos.length) % photos.length];
        if (q.kind === 'image') new Image().src = sources(q, 2000)[0];
      });
    }
    $('lb-name').textContent = p.name;
    $('lb-pos').textContent = `${idx + 1} of ${photos.length}`;
  };
  if (dir && img.classList.contains('ok')) { img.className = dir > 0 ? 'ok out-l' : 'ok out-r'; setTimeout(swap, 220); } else swap();
}

export function openViewer(i, from) {
  opener = from; lb.hidden = false; document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => lb.classList.add('open'));
  show(i); $('lb-close').focus();
  addEventListener('keydown', onKey);
}
function close() {
  lb.classList.remove('open'); removeEventListener('keydown', onKey);
  frame.removeAttribute('src'); // stops video playback
  setTimeout(() => { if (!lb.classList.contains('open')) { lb.hidden = true; img.removeAttribute('src'); img.className = ''; } }, 400);
  document.body.style.overflow = ''; opener?.focus({ preventScroll: true });
}
function onKey(e) {
  if (e.key === 'Escape') close();
  else if (e.key === 'ArrowRight') show(idx + 1, 1);
  else if (e.key === 'ArrowLeft') show(idx - 1, -1);
}
$('lb-close').onclick = close;
$('lb-next').onclick = () => show(idx + 1, 1);
$('lb-prev').onclick = () => show(idx - 1, -1);
lb.addEventListener('click', e => { if (e.target.classList.contains('lb-stage')) close(); });
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
  if (tx == null) return; const d = e.changedTouches[0].clientX - tx; tx = null;
  if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1), d < 0 ? 1 : -1);
});
