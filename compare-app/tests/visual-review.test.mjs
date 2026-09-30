import { test } from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const [data, assets, reviews, scores]=await Promise.all([read('../../out/comparativo/comparison.json'),read('../public/gymvisual-media.json'),read('../public/visual-reviews.json'),read('../public/video-scores.json')]);
test('video percentage belongs to the displayed candidate, preserving every source ID',()=>{
 assert.equal(Object.keys(scores).length,data.rows.length);
 for(const r of data.rows){assert.equal(scores[r.id].candidateId,r.media.video.id);assert.equal(scores[r.id].score,r.media.video.score);assert.equal(scores[r.id].name,r.name);}
});
test('visual reviews are bound to actual source and candidate videos, with bounded scores',()=>{
 const rows=new Map(data.rows.map(r=>[r.id,r]));
 for(const [id,v] of Object.entries(reviews)){
  const row=rows.get(id);assert.ok(row,id);
  assert.equal(v.name,row.name);assert.equal(v.candidateId,row.media.video.id);
  assert.equal(v.source,row.originalVideo);assert.equal(v.target,assets.assets[`video:${v.candidateId}`]?.preview);
  assert.ok(v.sourceFrame && v.targetFrame && v.reason);
  assert.ok(Number.isInteger(v.score) && v.score>=0 && v.score<=100);
 }
});
