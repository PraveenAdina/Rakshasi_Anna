const thumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
const lh3 = (id, w) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
const full = id => `https://drive.google.com/uc?export=view&id=${id}`;

// Ordered fallbacks: thumbnail from Drive API -> Drive thumbnail -> googleusercontent -> original.
// Thumbnails are JPEG renditions, so HEIC photos and video posters show in every browser.
export function sources(p, w) {
  const out = [];
  if (p.thumb) out.push(p.thumb.replace(/=s\d+(-c)?$/, '=w' + w));
  out.push(thumb(p.id, w), lh3(p.id, w));
  if (p.kind === 'image') out.push(full(p.id));
  return out;
}

// Tries each source, then retries the whole list a few times with a delay (Google rate-limits bursts).
export function loadInto(img, list, onFail) {
  let n = 0, tries = 0;
  img.onerror = () => {
    if (++n < list.length) { img.src = list[n]; return; }
    if (++tries <= 3) {
      n = 0;
      setTimeout(() => { img.src = list[0] + (list[0].includes('?') ? '&' : '?') + 'r=' + tries; }, 1200 * tries + Math.random() * 1500);
    } else onFail();
  };
  img.src = list[0];
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let io;

export function renderGallery(root, photos, onOpen) {
  io?.disconnect();
  root.replaceChildren();
  io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) {
      const t = e.target; t.classList.add('in'); io.unobserve(t);
      setTimeout(() => { t.style.transitionDelay = '0s'; t.classList.add('settled'); }, 1500); // entrance over: enable tilt
    }
  }, { rootMargin: '0px 0px -6% 0px' });

  const frag = document.createDocumentFragment();
  photos.forEach((p, i) => {
    const fig = document.createElement('button');
    fig.className = 'ph'; fig.type = 'button';
    fig.setAttribute('aria-label', `Open ${p.title}`);
    fig.style.transitionDelay = reduce ? '0s' : `${(i % 8) * 70}ms`;
    fig.style.setProperty('--r', ((Math.random() - .5) * 3).toFixed(2) + 'deg');
    const box = document.createElement('div'); box.className = 'box shimmer';
    if (p.w && p.h) box.style.aspectRatio = `${p.w} / ${p.h}`;
    fig.append(box);

    if (p.kind === 'file' && !p.thumb) { // documents etc. with no preview
      box.classList.remove('shimmer'); box.classList.add('doc'); box.style.aspectRatio = '4 / 3';
      box.textContent = (p.name.split('.').pop() || 'file').toUpperCase() + ' · ' + p.title;
    } else {
      const img = document.createElement('img');
      img.alt = p.title; img.loading = 'lazy'; img.decoding = 'async';
      img.onload = () => {
        img.classList.add('ok'); box.classList.remove('shimmer');
        if (!p.w) box.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      };
      box.append(img);
      loadInto(img, sources(p, 800), () => {
        fig.classList.add('broken'); box.classList.remove('shimmer'); img.remove();
        box.textContent = 'This photo couldn’t load';
      });
      if (p.kind === 'video') { const b = document.createElement('span'); b.className = 'play'; b.textContent = '▶'; box.append(b); }
    }
    fig.addEventListener('click', () => onOpen(i, fig));
    frag.append(fig);
  });
  root.append(frag);
  root.querySelectorAll('.ph').forEach(el => io.observe(el));
}
