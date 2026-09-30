import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
const result = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('../src/lib/exercisedbComparison.ts', import.meta.url)), formats: ['es'], fileName: 'test' } } });
const chunk = (Array.isArray(result) ? result[0] : result).output.find(o => o.type === 'chunk');
const { joinComparison, eligible, uniqueGIFs, proMonthlyCost, readDBSelection } = await import(`data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`);
const source = { id: '001', name: 'Supino', group: 'Peitoral', missingVideo: true, missingImage: false };
const snapshot = { rows: [{ ...source, status: 'Correspondência forte', candidateId: 'abc', score: 95 }], exercises: [{ exerciseId: 'abc', name: 'bench press' }] };
test('changed or new Smart Fit records cannot inherit a previous strong match', () => {
  const rows = joinComparison([{ ...source, name: 'Supino inclinado' }, { ...source, id: 'new' }], snapshot);
  assert.ok(rows.every(r => r.stale && r.match.status === 'Revisar' && !r.exercise));
  assert.equal(eligible(rows, true).length, 0);
});
test('uncertainty and gaps are evaluated independently; GIF is only an alternative for video gaps', () => {
  const rows = joinComparison([source], snapshot);
  assert.equal(eligible(rows).length, 1);
  assert.equal(eligible(rows, false, true).length, 1);
  const uncertain = [{ ...rows[0], match: { ...rows[0].match, status: 'Revisar' } }];
  assert.equal(eligible(uncertain).length, 0);
  assert.equal(eligible(uncertain, true).length, 1);
  const imageOnly = [{ ...rows[0], source: { ...source, missingVideo: false, missingImage: true } }];
  assert.equal(eligible(imageOnly, false, true).length, 0);
});
test('reused GIFs are counted once and subscription only charges usage over the quota', () => {
  const rows = joinComparison([source], snapshot);
  assert.equal(uniqueGIFs([...rows, ...rows]), 1);
  assert.equal(proMonthlyCost(0), 25);
  assert.equal(proMonthlyCost(20000), 25);
  assert.equal(proMonthlyCost(30000), 35);
});
test('corrupt local selections do not break the UI', () => {
  assert.equal(readDBSelection('{').size, 0);
  assert.deepEqual([...readDBSelection('["abc",null,7,"../", "abc"]')], ['abc']);
});
test('full snapshot preserves every source ID, reconciles counts and uses actual ExerciseDB media', async () => {
  const data = JSON.parse(await readFile(new URL('../public/exercisedb-comparison.json', import.meta.url), 'utf8'));
  const base = JSON.parse(await readFile(new URL('../public/comparison.json', import.meta.url), 'utf8'));
  const idIndex = base.headers.indexOf('ID base');
  assert.deepEqual(data.rows.map(r => r.id), base.values.map(r => String(r[idIndex])));
  assert.equal(data.exercises.length, data.catalogTotal);
  assert.equal(new Set(data.exercises.map(e => e.exerciseId)).size, data.catalogTotal);
  assert.equal(Object.values(data.counts).reduce((a, b) => a + b, 0), data.rows.length);
  for (const row of data.rows) {
    if (row.status === 'Não encontrado') assert.equal(row.candidateId, null);
    else assert.ok(data.exercises.some(e => e.exerciseId === row.candidateId));
    if (row.status === 'Correspondência forte') assert.equal(row.score, 95);
  }
  assert.ok(data.exercises.every(e => e.gifUrl.startsWith('https://static.exercisedb.dev/media/')));
});
