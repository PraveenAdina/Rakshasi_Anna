import { APPS_SCRIPT_URL } from './config.js';
import { renderAlbum } from './album.js';
import { openViewer, setPhotos } from './viewer.js';
import { cursor, sparkles } from './effects.js';

const $ = id => document.getElementById(id);
const gal = $('gallery'), skel = $('skeleton'), state = $('state'), status = $('status'), btn = $('refresh'), toast = $('toast');
let loading = false, toastT;

skel.append(Object.assign(document.createElement('div'), { className: 'sk sk-book' }));

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
  status.textContent = 'Opening the album…';
  try {
    const photos = await fetchPhotos();
    setPhotos(photos); skel.hidden = true;
    if (!photos.length) {
      gal.replaceChildren(); showState('The album is waiting', 'No photos yet. Add images to your Google Drive folder, then press refresh.');
      $('count').textContent = ''; status.textContent = 'Nothing here yet';
    } else {
      state.hidden = true; gal.hidden = false;
      renderAlbum(gal, photos, openViewer);
      const n = `${photos.length} ${photos.length === 1 ? 'memory' : 'memories'}`;
      $('count').textContent = n; status.textContent = n;
      if (manual) say(`Refreshed — ${n} loaded`);
    }
  } catch (e) {
    const msg = e.message === 'setup' ? 'The Apps Script URL isn’t set yet. Add it to js/config.js.'
      : e.name === 'AbortError' ? 'Google Drive took too long to answer. Check your connection and try again.'
      : 'Couldn’t reach Google Drive. Make sure the Web App is deployed with access set to “Anyone”.';
    if (gal.children.length) say(msg, true);
    else showState('We couldn’t open the album', msg, true);
  } finally { loading = false; btn.classList.remove('spin'); btn.disabled = false; }
}

btn.addEventListener('click', () => load(true));
cursor(); sparkles();
load();
