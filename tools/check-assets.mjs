#!/usr/bin/env node
/**
 * Проверка целостности ассетов.
 *
 * Игра грузит 27 текстур через loadTexture(`${base}/имя.png`). Если файл
 * переименовали или потеряли, Three.js не падает — материал молча становится
 * чёрным, и это замечают уже в игре. Скрипт ловит такое до запуска.
 *
 * Заодно показывает файлы, на которые никто не ссылается: репозиторий весит
 * 8 МБ, из них 7.8 МБ — текстуры, и знать, что из этого мёртвый груз, полезно.
 *
 *   node tools/check-assets.mjs
 *   node tools/check-assets.mjs --strict   # неиспользуемые файлы — тоже ошибка
 *
 * Зависимостей нет. Код возврата: 0 — всё на месте, 1 — есть проблемы.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'assets');

/** Файлы, которые лежат намеренно и не грузятся игрой. */
const INTENTIONALLY_UNUSED = new Set([
  'assets/textures/v2/texture_contact_sheet_v2.png', // обзорный лист всех текстур
]);

const SOURCES = ['game.js', 'index.html', 'styles.css'];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

function human(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.round(bytes / 1024)} КБ`;
}

const strict = process.argv.includes('--strict');

// 1. Что код просит загрузить.
const referenced = new Set();
const sourceText = SOURCES.filter((f) => existsSync(join(root, f)))
  .map((f) => readFileSync(join(root, f), 'utf8'))
  .join('\n');

// loadTexture(`${base}/grass.png`, ...) — base объявлен рядом константой.
const baseMatch = sourceText.match(/const\s+base\s*=\s*["'`]([^"'`]+)["'`]/);
const base = baseMatch ? baseMatch[1] : 'assets/textures/v2';

for (const m of sourceText.matchAll(/\$\{base\}\/([\w.-]+\.(?:png|jpg|jpeg|webp))/g)) {
  referenced.add(`${base}/${m[1]}`);
}
for (const m of sourceText.matchAll(/["'`](assets\/[\w./-]+\.(?:png|jpg|jpeg|webp|ttf|otf|mp3|ogg|wav))["'`]/g)) {
  referenced.add(m[1]);
}

// 2. Что реально лежит на диске.
const onDisk = new Map();
for (const path of walk(assetsDir)) {
  onDisk.set(relative(root, path).split('\\').join('/'), statSync(path).size);
}

console.log(`Ссылок в коде: ${referenced.size}. Файлов в assets/: ${onDisk.size}.`);

// 3. Ссылки без файлов — всегда ошибка.
const missing = [...referenced].filter((p) => !onDisk.has(p)).sort();
if (missing.length > 0) {
  console.error(`\nКод ссылается на отсутствующие файлы (${missing.length}):`);
  for (const path of missing) console.error(`  ! ${path}`);
}

// 4. Файлы без ссылок — вес без пользы.
const unused = [...onDisk.keys()]
  .filter((p) => !referenced.has(p) && !INTENTIONALLY_UNUSED.has(p))
  .sort((a, b) => onDisk.get(b) - onDisk.get(a));

if (unused.length > 0) {
  console.log(`\nНа эти файлы никто не ссылается (${unused.length}):`);
  let wasted = 0;
  for (const path of unused) {
    wasted += onDisk.get(path);
    console.log(`  ~ ${path} — ${human(onDisk.get(path))}`);
  }
  console.log(`  Итого лишнего веса: ${human(wasted)}`);
  console.log('  Если файл нужен намеренно — впишите его в INTENTIONALLY_UNUSED.');
}

const totalSize = [...onDisk.values()].reduce((a, b) => a + b, 0);
console.log(`\nВес assets/: ${human(totalSize)}.`);

const failed = missing.length > 0 || (strict && unused.length > 0);
if (!failed && missing.length === 0 && unused.length === 0) {
  console.log('Все ссылки разрешаются, лишних файлов нет.');
}
process.exit(failed ? 1 : 0);
