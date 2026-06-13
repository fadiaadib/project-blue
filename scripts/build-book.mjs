#!/usr/bin/env node
/* Build bound-book PDFs (EN + AR) from index.html.
 *
 *   EN  → Paged.js (pagedjs-cli): cover, table of contents with live page
 *         numbers, page-number folios, running header, chapter-per-page.
 *   AR  → native Chrome via puppeteer-core. Paged.js drops content in RTL
 *         (it breaks on any computed right-to-left direction), so Arabic is
 *         rendered by Chrome's own print engine, with folios + a running
 *         header supplied through print header/footer templates and a clean
 *         cover (rendered without chrome, then merged).
 *
 * Usage:  node scripts/build-book.mjs
 * Requires: Google Chrome; network (Google Fonts); poppler (pdfunite).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = new URL('..', import.meta.url).pathname;
const src = readFileSync(join(ROOT, 'index.html'), 'utf8');
const bookCss = readFileSync(join(ROOT, 'print/book.css'), 'utf8');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const SECTIONS = [
  ['opening-hypothesis', 'Opening Hypothesis', 'الفرضية الافتتاحية'],
  ['vision', 'Vision — Alfa in 2028', 'الرؤية — ألفا في 2028'],
  ['strategic-choice', 'The Strategic Choice', 'الاختيار الاستراتيجي'],
  ['execution-architecture', 'Execution Architecture', 'هندسة التنفيذ'],
  ['evidence-reasoning', 'Evidence & Reasoning', 'الأدلّة والاستدلال'],
  ['people-sponsorship', 'People & Sponsorship', 'الأفراد والرعاية'],
  ['risks-metrics', 'Risks, Metrics, Calibration', 'المخاطر والمقاييس والمعايرة'],
  ['phase-1-playbook', 'Phase 1 Playbook', 'كتيّب المرحلة الأولى'],
  ['references', 'References', 'المراجع'],
];

const tocHtml = `<nav class="book-toc">
  <h2><span class="lang-en">Contents</span><span class="lang-ar">المحتويات</span></h2>
  <div class="toc-rule"></div>
  <ol>
      ${SECTIONS.map(([id, en, ar], i) => {
        const num = String(i + 1).padStart(2, '0');
        return `<li><a href="#${id}"><span class="num">${num}</span>` +
          `<span class="t"><span class="lang-en">${en}</span><span class="lang-ar">${ar}</span></span>` +
          `<span class="leader"></span></a></li>`;
      }).join('\n      ')}
  </ol>
</nav>`;

const runHead = `<div class="run-head" aria-hidden="true">` +
  `<span class="lang-en">AI Adoption Strategy · Alfa Electronics</span>` +
  `<span class="lang-ar">استراتيجية تبنّي الذكاء الاصطناعي · ألفا للإلكترونيات</span></div>`;

function buildHtml(lang, { includeRunHead, chromeSafe }) {
  // Chrome (the AR path) now renders @page margin boxes, which would double up
  // with puppeteer's header/footer templates — strip them for that build.
  const css = chromeSafe ? bookCss.replace(/@(top|bottom)-center\s*\{[^}]*\}/g, '') : bookCss;
  let h = src
    .replace('<html lang="en" dir="ltr">',
      `<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<script>[\s\S]*?<\/script>/g, '')          // static build, no app JS
    .replace('</head>', `<style>\n${css}\n</style>\n</head>`)
    .replace('</header>', `</header>\n${tocHtml}`);
  if (includeRunHead) h = h.replace('</body>', `${runHead}\n</body>`);
  const tmp = join(tmpdir(), `book-${lang}.html`);
  writeFileSync(tmp, h);
  return tmp;
}

/* ── English: Paged.js ─────────────────────────────────────────── */
function buildEN() {
  const html = buildHtml('en', { includeRunHead: true, chromeSafe: false });
  const out = join(ROOT, 'print/AI-Adoption-Strategy-EN-book.pdf');
  console.log('Building EN book (Paged.js) →', out);
  execFileSync('npx', ['-y', 'pagedjs-cli', html, '-o', out], {
    stdio: 'inherit',
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: '1', PUPPETEER_EXECUTABLE_PATH: CHROME },
  });
}

/* ── Arabic: native Chrome print ───────────────────────────────── */
async function buildAR() {
  const html = buildHtml('ar', { includeRunHead: false, chromeSafe: true }); // folio/header via templates
  const out = join(ROOT, 'print/AI-Adoption-Strategy-AR-book.pdf');
  console.log('Building AR book (Chrome) →', out);

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('file://' + html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  const header = `<div style="font-family:'IBM Plex Sans Arabic',sans-serif;font-size:8px;` +
    `color:#9B968F;width:100%;text-align:center;direction:rtl;padding:0 14mm;">` +
    `استراتيجية تبنّي الذكاء الاصطناعي · ألفا للإلكترونيات</div>`;
  const footer = `<div style="font-size:9px;color:#9B968F;width:100%;text-align:center;">` +
    `<span class="pageNumber"></span></div>`;

  const cover = await page.pdf({
    format: 'A4', printBackground: false, pageRanges: '1',
    margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
  });
  const body = await page.pdf({
    format: 'A4', printBackground: false, pageRanges: '2-',
    displayHeaderFooter: true, headerTemplate: header, footerTemplate: footer,
    margin: { top: '18mm', bottom: '16mm', left: '16mm', right: '16mm' },
  });
  await browser.close();

  const cp = join(tmpdir(), 'ar-cover.pdf'), bp = join(tmpdir(), 'ar-body.pdf');
  writeFileSync(cp, cover); writeFileSync(bp, body);
  execFileSync('pdfunite', [cp, bp, out]);
}

buildEN();
await buildAR();
console.log('Done.');
