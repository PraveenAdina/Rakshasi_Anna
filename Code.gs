/**
 * Our Memories — read-only photo list for one Drive folder.
 * Deploy as Web App: Execute as "Me", Who has access "Anyone".
 * Returns only metadata (id, name, size, dates) of images in FOLDER_ID. No writes, no other folders.
 */
const FOLDER_ID = '1ISu9LDkL1wqGJkSg4Ku9OQ2C3w05Doba';
const NEWEST_FIRST = false; // false = oldest memories first

function doGet() {
  try {
    const photos = listPhotos_();
    return json_({ ok: true, count: photos.length, generated: new Date().toISOString(), photos: photos });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Could not read the photo folder.' });
  }
}

function listPhotos_() {
  const q = "'" + FOLDER_ID + "' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false";
  const fields = 'nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,thumbnailLink,imageMediaMetadata(width,height,rotation,time),videoMediaMetadata(width,height))';
  const out = []; let token = '';
  do {
    const url = 'https://www.googleapis.com/drive/v3/files?pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true'
      + '&q=' + encodeURIComponent(q) + '&fields=' + encodeURIComponent(fields)
      + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Drive API ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 200));
    const data = JSON.parse(res.getContentText());
    (data.files || []).forEach(function (f) {
      const m = f.imageMediaMetadata || {};
      let w = m.width || 0, h = m.height || 0;
      if (m.rotation % 2 === 1) { const t = w; w = h; h = t; } // thumbnails come back already rotated
      const v = f.videoMediaMetadata || {};
      if (!w && v.width) { w = v.width; h = v.height; }
      const kind = f.mimeType.indexOf('image/') === 0 ? 'image' : f.mimeType.indexOf('video/') === 0 ? 'video' : 'file';
      out.push({
        id: f.id, name: f.name, title: f.name.replace(/\.[^.]+$/, ''), mime: f.mimeType, kind: kind,
        thumb: f.thumbnailLink || '', w: w, h: h, modified: f.modifiedTime,
        date: normalizeExif_(m.time) || f.createdTime
      });
    });
    token = data.nextPageToken || '';
  } while (token);
  out.sort(function (a, b) {
    const d = a.date < b.date ? -1 : a.date > b.date ? 1 : a.name.localeCompare(b.name, undefined, { numeric: true });
    return NEWEST_FIRST ? -d : d;
  });
  return out;
}

function normalizeExif_(t) { // "2024:05:01 14:22:10" -> ISO-like string
  if (!t) return '';
  const m = /^(\d{4}):(\d\d):(\d\d) (\d\d:\d\d:\d\d)/.exec(t);
  return m ? m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] : '';
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
