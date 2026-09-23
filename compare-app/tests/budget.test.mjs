import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
async function load(path) {
  const result = await build({ configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry:fileURLToPath(new URL(path,import.meta.url)),formats:['es'],fileName:'test'}} });
  return import(`data:text/javascript;base64,${Buffer.from((Array.isArray(result)?result[0]:result).output.find(o=>o.type==='chunk').code).toString('base64')}`);
}
const { budget, defaultPricing, itemsFor, readSelection } = await load('../src/lib/budget.ts');
const { parseComparison } = await load('../src/lib/comparison.ts');
const snapshot = JSON.parse(await readFile(new URL('../public/comparison.json',import.meta.url),'utf8'));
const rows = parseComparison([snapshot.headers,...snapshot.values]);
const index = {assets:{}};
const items = (kind,n) => Array.from({length:n},(_,i)=>({key:`${kind}:${i}`,kind,media:{id:String(i)},rows:[]}));
test('official category discount boundaries include the minimum quantity',()=>{
  for (const [kind,min,price] of [['gif',10,90],['video',5,600],['image',10,75]]) {
    assert.equal(budget(items(kind,min-1),defaultPricing,index).cents,(min-1)*({gif:360,video:1000,image:300}[kind]));
    assert.equal(budget(items(kind,min),defaultPricing,index).cents,min*price);
    assert.equal(budget(items(kind,min+1),defaultPricing,index).cents,(min+1)*price);
  }
});
test('verified retail prices apply below discount minimum and unknown images stay pending',()=>{
  const result=budget([...items('video',1),...items('image',1)],{...defaultPricing,imageCents:null},{assets:{'video:0':{price:1000}}});
  assert.equal(result.cents,1000);assert.equal(result.unknown,1);assert.equal(result.prices['image:0'],null);
  assert.equal(budget(items('image',1),{...defaultPricing,imageCents:150,imageMin:1},index).cents,150);
});
test('same asset covering multiple source rows is only billed once',()=>{
  const row=rows.find(r=>r.video.status==='Sim — forte');
  const eligible=itemsFor([row,{...row,id:'another'}],['video']);
  assert.equal(eligible.length,1);assert.equal(eligible[0].rows.length,2);
  assert.equal(budget([eligible[0],eligible[0]],defaultPricing,index).quantity,1);
});
test('bulk defaults exclude uncertainty and missing filter applies to the chosen format',()=>{
  const row=rows.find(r=>r.video.status==='Sim — forte');
  const fixture={...row,missingImage:true,missingVideo:false,video:{...row.video,status:'Revisar'},image:{...row.image,id:'sample',status:'Sim — forte'}};
  assert.equal(itemsFor([fixture],['video']).length,0);
  assert.equal(itemsFor([fixture],['video'],true).length,1);
  assert.equal(itemsFor([fixture],['video'],true,true).length,0);
  assert.equal(itemsFor([fixture],['image'],false,true).length,1);
});
test('saved selections handle corrupt storage and preserve zero-padded IDs',()=>{
  assert.deepEqual([...readSelection('["video:000112","gif:000113","bad",null,4,"image:../"]')],['video:000112','gif:000113']);
  assert.equal(readSelection('{').size,0);assert.equal(readSelection('{}').size,0);
});
test('existing image and video URLs survive the spreadsheet parser',()=>{
  for(const row of rows){const raw=snapshot.values.find(r=>String(r[0])===row.id);assert.equal(row.originalImage,String(raw[snapshot.headers.indexOf('Imagem atual (URL informada)')]??'').trim());assert.equal(row.originalVideo,String(raw[snapshot.headers.indexOf('Vídeo atual (URL informada)')]??'').trim());}
});
