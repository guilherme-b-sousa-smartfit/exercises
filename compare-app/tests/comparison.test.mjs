import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
const built = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('../src/lib/comparison.ts', import.meta.url)), formats: ['es'], fileName: 'comparison' } } });
const { parseComparison, coverageCounts } = await import(`data:text/javascript;base64,${Buffer.from((Array.isArray(built) ? built[0] : built).output.find(o => o.type === 'chunk').code).toString('base64')}`);
const data = JSON.parse(await readFile(new URL('../public/comparison.json', import.meta.url), 'utf8'));
const rows = parseComparison([data.headers, ...data.values]);

test('all source records survive and counts reconcile', () => {
  const counts = coverageCounts(rows);
  assert.equal(rows.length, 1574);
  assert.equal(new Set(rows.map(r => r.id)).size, 1574);
  assert.equal(counts.total, counts.strong + counts.uncertain + counts.absent);
  assert.equal(counts.missingImage, 89);
  assert.equal(counts.missingVideo, 85);
  assert.equal(counts.fillImage, 17);
  assert.equal(counts.fillVideo, 22);
});
test('paid catalog coverage does not require media URLs', () => {
  const row = rows.find(r => r.id === '5750');
  assert.equal(row.status, 'Correspondência forte');
  assert.ok(row.video.id.startsWith('00'));
  assert.equal(row.video.status, 'Sim — forte');
});
test('GIF coverage is independent of video and uncertainty is not strong coverage', () => {
  const fixture = { ...rows[0], status: 'Revisar', image: { status: 'Não encontrado' }, video: { status: 'Revisar' }, gif: { status: 'Sim — forte' } };
  const counts = coverageCounts([fixture]);
  assert.equal(counts.video, 0);
  assert.equal(counts.strong, 0);
  assert.equal(counts.gif, 1);
});
test('preserves separate IDs with the same name', () => {
  assert.equal(rows.find(r => r.id === '7249').name, rows.find(r => r.id === '7259').name);
});
test('rejects HTML, missing headers, duplicate IDs and invalid statuses', () => {
  assert.throws(() => parseComparison([['<html>login</html>']]));
  assert.throws(() => parseComparison([data.headers, data.values[0], data.values[0]]), /duplicado/);
  const row = [...data.values[0]]; row[3] = 'garantido';
  assert.throws(() => parseComparison([data.headers, row]), /Resultado inválido/);
});
test('parsing depends on header names, not column order', () => {
  const result = parseComparison([[...data.headers].reverse(), [...data.values[0]].reverse()]);
  assert.deepEqual(result[0], rows[0]);
});
