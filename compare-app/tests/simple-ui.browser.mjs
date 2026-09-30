import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:5173';
const password=fs.readFileSync('.env.review.local','utf8').split('\n').find(x=>x.startsWith('REVIEW_PASSWORD=')).slice(16);
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
let original,changed=false;
const fields=r=>({validated:r.validated,comments:r.comments,replacementTitle:r.replacementTitle,replacementVideo:r.replacementVideo});
async function read(){return page.evaluate(async()=>{const r=await fetch('/api/reviews');if(!r.ok)throw Error('read failed');return r.json();});}
try{
 await page.goto(base);await page.locator('.simple-card').first().waitFor();
 const initial=await read();assert.equal(initial.rows.length,1574);
 const expected=[...initial.rows].sort((a,b)=>Number(a.validated)-Number(b.validated)||a.order-b.order);
 assert.equal(await page.locator('.simple-card').first().getAttribute('data-review-id'),String(expected[0].id));
 assert.equal(await page.locator('nav[aria-label=Bibliotecas] a').count(),1);
 assert.equal(await page.locator('input[type=range]').count(),2);
 assert(await page.locator('.review-fields').first().isDisabled());
 const unauthorized=await page.evaluate(async()=>{const r=await fetch('/api/reviews',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});return r.status;});assert.equal(unauthorized,401);
 const count=await page.locator('.simple-card').count();await page.locator('.scroll-sentinel').scrollIntoViewIfNeeded();await page.waitForFunction(n=>document.querySelectorAll('.simple-card').length>n,count);
 await page.getByLabel('Buscar exercício').fill('MÁQUINA lomb');await page.waitForTimeout(200);const names=await page.locator('.simple-card h2').allTextContents();assert(names.length>0);
 await page.getByLabel('Buscar exercício').fill(' maquina  LOMB ');await page.waitForTimeout(200);assert.deepEqual(await page.locator('.simple-card h2').allTextContents(),names);
 await page.getByLabel('Buscar exercício').fill('');await page.getByLabel('Similaridade mínima').fill('70');await page.getByLabel('Similaridade máxima').fill('80');await page.waitForTimeout(200);assert((await page.locator('.similarity-score').allTextContents()).every(s=>parseInt(s)>=70&&parseInt(s)<=80));await page.getByLabel('Similaridade mínima').fill('0');await page.getByLabel('Similaridade máxima').fill('100');
 await page.getByRole('button',{name:'Entrar para revisar'}).click();await page.getByLabel('Senha de revisão').fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByText('Revisão liberada').waitFor();
 original=initial.rows.find(r=>!r.validated&&r.smartVideo&&r.gymVideo&&!r.comments&&!r.replacementVideo&&r.id);assert(original);
 await page.getByLabel('Buscar exercício').fill(original.name);const card=page.locator(`[data-review-id="${original.id}"]`);await card.waitFor();
 assert.equal(await card.locator('.title-pt').textContent(),original.gymNamePt);assert.equal(await card.locator('.title-en').textContent(),original.gymName);
 const marker=`Verificação de integração ${Date.now()}`;
 await card.getByLabel('Comentários',{exact:true}).fill(marker);await card.getByLabel('Título do vídeo substituto',{exact:true}).fill('Vídeo substituto — verificação');await card.getByLabel('Vídeo substituto',{exact:true}).fill(original.gymVideo);
 await card.getByRole('button',{name:'Salvar revisão'}).click();changed=true;await card.getByText('Salvo na planilha',{exact:true}).waitFor();
 let saved=(await read()).rows.find(r=>r.id===original.id);assert.equal(saved.comments,marker);assert.equal(saved.replacementVideo,original.gymVideo);
 await card.getByLabel('Validado',{exact:true}).check();await card.getByText('Salvo na planilha',{exact:true}).waitFor();
 saved=(await read()).rows.find(r=>r.id===original.id);assert.equal(saved.validated,true);
 await page.getByLabel('Buscar exercício').fill('');await page.waitForTimeout(150);assert.notEqual(await page.locator('.simple-card').first().getAttribute('data-review-id'),String(original.id));
 await page.reload();await page.locator('.simple-card').first().waitFor();await page.getByLabel('Buscar exercício').fill(original.name);await card.waitFor();assert.equal(await card.getByLabel('Comentários',{exact:true}).inputValue(),marker);assert(await card.getByLabel('Validado',{exact:true}).isChecked());
 await card.locator('video').first().scrollIntoViewIfNeeded();await page.waitForTimeout(3000);const playback=await card.locator('video').first().evaluate(v=>({autoplay:v.autoplay,muted:v.muted,playing:!v.paused,time:v.currentTime}));assert(playback.autoplay&&playback.muted);
 await page.screenshot({path:'../out/comparativo/review-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'../out/comparativo/review-mobile.png'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log({liveRead:true,order:true,search:true,infiniteScroll:true,login:true,savedToSheet:true,validated:true,reloadedPersistence:true,replacement:true,playback,errors});
}finally{
 if(changed&&original){const current=(await read()).rows.find(r=>r.id===original.id);const result=await page.evaluate(async({id,base,patch})=>{const r=await fetch('/api/reviews',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,base,patch})});return {status:r.status,body:await r.json()};},{id:original.id,base:fields(current),patch:fields(original)});assert.equal(result.status,200);console.log('Test review restored to original values.');}
 await browser.close();
}
