import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const source = readFileSync(join(root, 'main.js'), 'utf8');
const dictionarySource = source.match(/const COPY = (\{[\s\S]*?\n\});\nconst PIECE_NAME/);
assert.ok(dictionarySource, 'translation dictionary should be present');
const copy = runInNewContext(`(${dictionarySource[1]})`);

test('all static Xiangqi UI strings have Chinese and English translations', () => {
  const keys = new Set([...html.matchAll(/data-i18n(?:-aria|-placeholder)?="([^"]+)"/g)].map((match) => match[1]));
  for (const key of keys) {
    assert.equal(typeof copy.zh[key], 'string', `missing Chinese translation for ${key}`);
    assert.equal(typeof copy.en[key], 'string', `missing English translation for ${key}`);
  }
  assert.deepEqual(Object.keys(copy.zh).sort(), Object.keys(copy.en).sort());
});

test('translated placeholders accept the same variables', () => {
  for (const key of Object.keys(copy.zh)) {
    const variables = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    assert.deepEqual(variables(copy.en[key]), variables(copy.zh[key]), key);
  }
});

test('language preference uses the shared Jev games key', () => {
  assert.match(source, /const LANGUAGE_STORAGE_KEY = 'jev-games-language'/);
  assert.match(html, /id="languageToggle"/);
});
