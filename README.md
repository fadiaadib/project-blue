# Alfa Electronics — AI Adoption Strategy Brief

Executive strategy brief for Alfa Electronics' AI adoption initiative.

Single-file HTML, no build step, deployable to any static host.

---

## Viewing locally

Open `index.html` in any modern browser. No server required.

## Language toggle

- Top-right corner of every page: **`عربي`** / **`EN`**
- One click flips text, typography, and layout direction (LTR ↔ RTL)
- Selection persists per-device via `localStorage`
- Default language: English

## Printing / PDF export

Three options, quickest to most polished. The page carries a tuned print
stylesheet (A4, sidebar/zoom-toolbar/grain hidden, each section on a new page,
the financial dashboard reflowed to fit one page, Arabic draft-translation
caveat kept).

### 1. Browser print (quick)

`Cmd+P` (macOS) / `Ctrl+P` (Windows) → **Save as PDF**. Choose **A4**, margins
**Default**, and **uncheck "Headers and footers"**. The active on-screen
language is what prints — switch to Arabic first for an Arabic PDF.

### 2. Headless Chrome (clean, reproducible single PDF)

Applies the print stylesheet deterministically — no dialog settings to get
wrong. `--force-prefers-reduced-motion` settles the count-up/reveal animations
before the snapshot:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --force-prefers-reduced-motion \
  --no-pdf-header-footer --virtual-time-budget=4000 \
  --print-to-pdf="print/AI-Adoption-Strategy-EN.pdf" "file://$PWD/index.html"
```

### 3. Bound "book" build (cover, contents, page numbers)

Book-grade PDFs with a cover, a table of contents, page-number folios, a
running header, and chapter-per-page pagination:

```bash
npm install          # one-time: installs puppeteer-core (drives your system Chrome)
npm run build:book   # writes print/AI-Adoption-Strategy-{EN,AR}-book.pdf
```

- **English** renders with [Paged.js](https://pagedjs.org) — its TOC carries
  live page numbers.
- **Arabic** renders with native Chrome: Paged.js drops content in
  right-to-left layout, so Chrome's own print engine handles the RTL book, with
  folios + running header supplied via print templates.
- Requires Google Chrome installed and network access (Google Fonts).
- Pre-built PDFs are committed under [`print/`](print/).

---

## Deployment

### Option A — GitHub Pages

1. Rename the brief file to `index.html` if not already named that
2. Repo **Settings → Pages → Source**: deploy from branch `main`, folder `/ (root)`
3. The brief is live at `https://<username>.github.io/<repo-name>/`

### Option B — Cloudflare Pages or Netlify

Better if you need private hosting on a free tier. Both auto-deploy from a private GitHub repo on every push.

### Privacy notes

- The HTML includes `noindex, nofollow` meta tags — search engines will not index it
- The GitHub repo's visibility is separate from the deployed page's accessibility
- GitHub Pages from a private repo requires a paid GitHub plan (Pro / Team / Enterprise)
- For full privacy without paying GitHub: use Cloudflare Pages or Netlify deploying from a private repo

---

## Updating the content

The strategy content's source of truth lives in Notion (see project lead for links). The HTML brief is a rendered artifact, regenerated when sections evolve.

To update an existing section:

1. Locate the relevant `<section>` block in `index.html`
2. Edit the `.lang-en` and `.lang-ar` content blocks inside it
3. Commit and push — your host rebuilds automatically within a minute

To add a new section's full content (replacing a placeholder card):

1. Find the placeholder section (`.placeholder-section`) for that section ID
2. Replace it with the structured content blocks, following the pattern from the Opening Hypothesis section: `<h2>`, `<p>`, `<ul class="body-list">`, `<p class="pullquote">`, etc.
3. Provide both `.lang-en` and `.lang-ar` versions

---

## File structure

Single-file HTML. All CSS and JavaScript are inline. External dependencies:

- **Google Fonts** loaded from `fonts.googleapis.com`:
  - Inter (English sans)
  - Crimson Pro (English serif)
  - IBM Plex Sans Arabic (Arabic sans)
  - Markazi Text (Arabic serif)

No build tooling is needed to view or deploy the brief — open the file, edit,
push. (The optional book-PDF build under [`scripts/`](scripts/) uses Node +
`puppeteer-core`; see **Printing / PDF export**.)

---

## Status

- **Version:** v1
- **Date:** June 2026
- **Status:** Draft — for review by the strategic readership
- **Arabic translation:** AI-prepared draft. Pending native-reader review before final delivery.
