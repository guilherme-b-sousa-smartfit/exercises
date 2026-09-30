import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = JSON.parse(await readFile(new URL('../public/comparison.json',import.meta.url),'utf8'));
for (const provider of ['musclewiki','exerciseapi']) {
  test(`${provider}: partial sample keeps all source rows and references real text-only candidates`,async()=>{
    const text = await readFile(new URL(`../public/${provider}-comparison.json`,import.meta.url),'utf8');
    const data = JSON.parse(text);
    assert.equal(data.complete,false);
    assert.equal(data.rows.length,base.values.length);
    assert.equal(new Set(data.rows.map(r=>r.id)).size,base.values.length);
    const ids = new Set(data.exercises.map(e=>e.id));
    const source = new Map(base.values.map(r=>[String(r[base.headers.indexOf('ID base')]).trim(),String(r[base.headers.indexOf('Exercício base')]).trim()]));
    for(const r of data.rows){
      assert.equal(r.name,source.get(r.id));
      if(r.candidateId!==null) assert.ok(ids.has(r.candidateId));
      if(r.status==='Correspondência forte') assert.ok(r.score>=90 && r.candidateId!==null);
    }
    for (const e of data.exercises) assert.ok(Object.keys(e).every(k=>['id','name','category','equipment','primaryMuscles','source'].includes(k)));
    assert.ok(!text.includes('mw_'));
    assert.ok(!text.includes('.mp4'));
  });
}
