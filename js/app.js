import { APPS_SCRIPT_URL } from './config.js';
import { renderGallery } from './gallery.js';
import { openViewer, setPhotos } from './viewer.js';
import { intro, cursor, magic } from './effects.js';

const $ = id => document.getElementById(id);
const gal = $('gallery'), skel = $('skeleton'), state = $('state'), status = $('status');
const btn = $('refresh'), toast = $('toast');
let loading = false, toastT;

const pc = $('particles'); // hero particles: cheap CSS-only motion
for (let i = 0; i < 16; i++) {
  const s = document.createElement('i');
  s.style.cssText = `--x:${Math.random() * 100}%;--s:${3 + Math.random() * 6}px;--d:${14 + Math.random() * 14}s;--l:-${Math.random() * 20}s;--dx:${(Math.random() - .5) * 120}px`;
  pc.append(s);
}

const hs = [220, 320, 260, 380, 240, 300, 340, 250];
skel.append(...Array.from({ length: 12 }, (_, i) => Object.assign(document.createElement('div'), { className: 'sk', style: `height:${hs[i % 8]}px` })));

function say(msg, err = false) {
  toast.textContent = msg; toast.classList.toggle('err', err); toast.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 3500);
}
function showState(title, text, retry) {
  state.hidden = false; gal.hidden = true; skel.hidden = true;
  state.innerHTML = `<h3></h3><p></p>${retry ? '<button type="button">Try again</button>' : ''}`;
  state.querySelector('h3').textContent = title; state.querySelector('p').textContent = text;
  state.querySelector('button')?.addEventListener('click', () => load(true));
}

async function fetchPhotos() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.startsWith('PASTE')) throw new Error('setup');
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(`${APPS_SCRIPT_URL}?t=${Date.now()}`, { signal: ctl.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'script');
    return d.photos;
  } finally { clearTimeout(t); }
}

async function load(manual = false) {
  if (loading) return; loading = true;
  btn.classList.add('spin'); btn.disabled = true;
  if (!gal.children.length) { skel.hidden = false; state.hidden = true; }
  status.textContent = manual ? 'Looking for new memories…' : 'Opening the album…';
  try {
    const photos = await fetchPhotos();
    setPhotos(photos); skel.hidden = true;
    if (!photos.length) {
      gal.replaceChildren(); showState('The album is waiting', 'No photos yet. Add images to your Google Drive folder, then press Refresh.');
      $('count').textContent = ''; status.textContent = 'Nothing here yet';
    } else {
      state.hidden = true; gal.hidden = false;
      renderGallery(gal, photos, openViewer);
      const n = `${photos.length} ${photos.length === 1 ? 'memory' : 'memories'}`;
      $('count').textContent = n; status.textContent = n + ', kept safe';
      if (manual) say(`Refreshed — ${n} loaded`);
    }
  } catch (e) {
    const msg = e.message === 'setup' ? 'The Apps Script URL isn’t set yet. Add it to js/config.js.'
      : e.name === 'AbortError' ? 'Google Drive took too long to answer. Check your connection and try again.'
      : 'Couldn’t reach Google Drive. Make sure the Web App is deployed with access set to “Anyone”.';
    if (gal.children.length) { say(msg, true); status.textContent = 'Showing the last loaded photos'; }
    else { showState('We couldn’t load the photos', msg, true); status.textContent = 'Something went wrong'; }
  } finally { loading = false; btn.classList.remove('spin'); btn.disabled = false; }
}

btn.addEventListener('click', () => load(true));

const nav = $('nav'), menu = $('menu'), burger = $('burger'), totop = $('totop');
addEventListener('scroll', () => {
  nav.classList.toggle('solid', scrollY > 40); totop.classList.toggle('show', scrollY > 700);
}, { passive: true });
burger.addEventListener('click', () => {
  const o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
totop.addEventListener('click', () => scrollTo({ top: 0 }));

intro(); cursor(); magic();
load();
