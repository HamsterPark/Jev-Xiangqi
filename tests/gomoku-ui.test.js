import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'gomoku.html'), 'utf8');
const source = readFileSync(join(root, 'gomoku.js'), 'utf8');
const dictionarySource = source.match(/const COPY = (\{[\s\S]*?\n\});\n\nlet language/);
assert.ok(dictionarySource, 'Gomoku translation dictionary should be present');
const copy = runInNewContext(`(${dictionarySource[1]})`);

test('Gomoku UI has Chinese and English text for every static label', () => {
  const keys = new Set([...html.matchAll(/data-i18n(?:-aria|-placeholder)?="([^"]+)"/g)]
    .map((match) => match[1]));
  for (const key of keys) {
    assert.equal(typeof copy.zh[key], 'string', `missing Chinese translation for ${key}`);
    assert.equal(typeof copy.en[key], 'string', `missing English translation for ${key}`);
  }
  assert.deepEqual(Object.keys(copy.zh).sort(), Object.keys(copy.en).sort());
  assert.match(source, /const LANGUAGE_KEY = 'jev-games-language'/);
});

test('Gomoku page exposes only the desktop key bridge and links to both other games', () => {
  assert.match(html, /href="\.\/index\.html"/);
  assert.match(html, /href="\.\/race\.html"/);
  assert.match(source, /function hasBridge\(\)/);
  assert.match(source, /bridge\?\.startGomoku/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /localStorage\.setItem\([^\n]*apiKey/);
});
