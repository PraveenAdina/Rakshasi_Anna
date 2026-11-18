# Our Memories

A warm, animated memory-book website. Photos live in one Google Drive folder; a tiny read-only Google Apps Script lists them; GitHub Pages hosts the static site. Add photos to Drive → press **Refresh** on the site. No code changes, no redeploys.

## How it works (and what is public)

```
Visitor's browser ──► GitHub Pages (static HTML/CSS/JS)
        │
        ├──► Apps Script Web App  → JSON list of image IDs/names/sizes (read-only, one folder)
        └──► drive.google.com/thumbnail?id=…  → the actual pictures
```
- The Apps Script runs as **you**, but only reads the one folder ID you configure. Visitors never get your account, tokens or other folders.
- Images are delivered by Google directly, so the folder must be shared **“Anyone with the link – Viewer”**. That makes the photos in that folder viewable by anyone who has a file link; nothing else in your Drive is exposed.
- No secrets live in GitHub. The Web App URL and folder ID are not credentials. (Folder ID sits in Apps Script, not in the repo.)

## Setup

### 1. Drive folder
1. Create a folder (e.g. `Our Memories`) and upload photos (JPG, PNG, WebP, HEIC, GIF…).
2. Right-click → **Share** → General access: **Anyone with the link** → **Viewer**.
3. Copy the folder ID from the URL: `drive.google.com/drive/folders/<FOLDER_ID>`.

### 2. Apps Script
1. Go to [script.new](https://script.new). Name it `Our Memories API`.
2. Replace `Code.gs` with `google-apps-script/Code.gs` and paste your folder ID into `FOLDER_ID`.
3. Project Settings → tick **Show "appsscript.json" manifest file**, then replace its contents with `google-apps-script/appsscript.json`.
4. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone**. Authorize (read-only Drive scope).
5. Copy the Web App URL (ends in `/exec`). Open it in a browser: you should see JSON with your photos.
   After editing the script later, use **Deploy → Manage deployments → Edit → New version**.

### 3. Website config
Edit `js/config.js` and paste the `/exec` URL.

### 4. GitHub Pages
1. Create a public repo named `our-memories`, upload everything in this folder (keep the structure).
2. **Settings → Pages → Deploy from a branch → `main` / root → Save.**
3. Open `https://USERNAME.github.io/our-memories/`. All asset paths are relative, so the project URL works.

## Photo order, subfolders
Sorted by the photo's EXIF date (falls back to upload date), oldest first. Flip `NEWEST_FIRST` in `Code.gs` for newest first. Only the folder's direct images are listed (no subfolders).

## Design notes
- Masonry uses CSS columns. Each frame gets the photo's real aspect ratio from Drive metadata, so layout doesn't jump; `object-fit: contain` is used, never `cover`.
- Grid loads 800px renditions lazily; lightbox loads 2000px and preloads neighbours. Image URL fallbacks: Drive thumbnail → googleusercontent → original file.
- Respects `prefers-reduced-motion`. Keyboard: ← → Esc. Swipe works on touch screens.
- Large libraries: all photos are listed (never omitted); images are lazy-loaded.

## Test status
Not verifiable without your folder/deployment: Drive API listing, public image delivery, refresh with new uploads, GitHub Pages deployment. Use this checklist after setup: open the `/exec` URL → JSON ok; open site → photos appear; upload a photo → Refresh → count increases; open an incognito window to confirm images load for non-owners.
