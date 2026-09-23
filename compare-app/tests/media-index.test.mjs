import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(new URL('../public/gymvisual-media.json', import.meta.url),'utf8'));
const comparison = JSON.parse(await readFile(new URL('../../out/comparativo/comparison.json', import.meta.url),'utf8'));
const wanted = new Set(comparison.rows.flatMap(row => Object.entries(row.media).filter(([,m])=>m.id).map(([kind,m])=>`${kind}:${m.id}`)));
test('public previews belong to candidate IDs and the correct product category',()=>{
  assert.equal(data.requested,wanted.size);
  for(const [key,a] of Object.entries(data.assets)) {
    assert.ok(wanted.has(key),key);assert.equal(key,`${a.kind}:${a.id}`);
    const product=new URL(a.productUrl);assert.equal(product.origin,'https://gymvisual.com');
    assert.ok(product.pathname.startsWith({image:'/illustrations/',gif:'/animated-gifs/',video:'/videos/'}[a.kind]),key);
    assert.ok(a.verifiedId || a.matchMethod==='unique-english-name',key);
    if(a.preview){const url=new URL(a.preview);assert.equal(url.origin,'https://gymvisual.com');assert.ok(!url.pathname.startsWith('/download/'));}
    if(a.previewType==='video'){assert.equal(a.kind,'video');assert.equal(a.verifiedId,true);assert.ok(a.preview.includes('/img/vid/'));assert.ok(new URL(a.preview).pathname.split('/').at(-1).startsWith(a.id));}
  }
});
test('known leading-zero video reference is preserved, not replaced with product-page ID',()=>{
  const asset=data.assets['video:003112'];assert.ok(asset);assert.equal(asset.id,'003112');assert.equal(asset.previewType,'video');assert.ok(asset.preview.includes('003112'));assert.notEqual(new URL(asset.productUrl).pathname.split('/').at(-1).split('-')[0],asset.id);
});
