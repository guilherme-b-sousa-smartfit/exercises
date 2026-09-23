/** Public product previews only. Never requests downloads/cart/checkout or paid files.
 * Run from repository root: node matching/fetch_gymvisual_previews.mjs
 * Requires Playwright (compare-app dev dependency) and its Chromium browser.
 * Resumes verified records from the output JSON. IDs must match product SKU exactly.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '../compare-app/node_modules/playwright/index.mjs');
const output = 'compare-app/public/gymvisual-media.json';
const base = 'https://gymvisual.com';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;|&#39;/g,"'").trim();
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g,'');
const attr = (s, key) => decode(s?.match(new RegExp(`\\b${key}=["']([^"']*)["']`))?.[1] ?? '');
async function get(url) {
  const response = await context.request.get(url, { timeout: 20000 });
  if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
  const text = await response.text();
  if (text.includes('<title> 403')) throw new Error('Forbidden');
  return text;
}
const comparison = JSON.parse(readFileSync('out/comparativo/comparison.json','utf8'));
const wanted = new Map();
for (const row of comparison.rows) for (const [kind,media] of Object.entries(row.media)) if (media.id) wanted.set(`${kind}:${media.id}`, { ...media, kind });
let previous; try { previous=JSON.parse(readFileSync(output,'utf8')); } catch { previous={assets:{}}; }
const index = { checkedAt: new Date().toISOString(), source: `${base}/sitemap.xml`, requested: wanted.size, assets: Object.fromEntries(Object.entries(previous.assets).filter(([key,a]) => wanted.has(key) && (a.verifiedId || a.matchMethod === 'unique-english-name'))), unresolved: [] };
const save = () => writeFileSync(output, JSON.stringify(index));
const sitemap = process.env.GYM_SITEMAP ? readFileSync(process.env.GYM_SITEMAP,'utf8') : await get(`${base}/sitemap.xml`);
const lookup = new Map();
for (const xml of sitemap.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
  const url = decode(xml.match(/<loc>([\s\S]*?)<\/loc>/)?.[1] ?? '');
  const kind = url.includes('/videos/') ? 'video' : url.includes('/animated-gifs/') ? 'gif' : url.includes('/illustrations/') ? 'image' : '';
  if (!kind) continue;
  const name = decode(xml.match(/<image:title>([\s\S]*?)<\/image:title>/)?.[1] ?? '');
  const key = `${kind}:${norm(name)}`;lookup.set(key,[...(lookup.get(key)??[]),{url,poster:decode(xml.match(/<image:loc>([\s\S]*?)<\/image:loc>/)?.[1] ?? '')}]);
}
function parse(html, productUrl, media) {
  const skuTag=html.match(/<[^>]+itemprop=["']sku["'][^>]*>/)?.[0];
  const id=attr(skuTag,'content');
  if (id !== media.id) return null;
  const poster=attr(html.match(/<img\b[^>]*id=["']bigpic["'][^>]*>/)?.[0],'src');
  const video=attr(html.match(/<video\b[^>]*>/)?.[0],'src');
  const priceString=attr(html.match(/<[^>]*id=["']our_price_display["'][^>]*>/)?.[0],'content');
  const preview=video || poster;
  if (!preview) return null;
  return { id,kind:media.kind,name:media.name,productUrl,poster:poster?new URL(poster,base).href:undefined,preview:new URL(preview,base).href,previewType:video?'video':'image',price:priceString && Number.isFinite(Number(priceString))?Math.round(Number(priceString)*100):undefined,verifiedId:true };
}
async function resolve(media) {
  const urls = lookup.get(`${media.kind}:${norm(media.name)}`) ?? [];
  for (const {url} of urls) { const asset=parse(await get(url),url,media);if(asset)return asset; }
  const html=await get(`${base}/index.php?controller=search&search_query=${encodeURIComponent(media.id)}`);
  const anchors=[...html.matchAll(/<a\b([^>]*class=["'][^"']*product-reference[^"']*["'][^>]*)>([\s\S]*?)<\/a>/g)];
  for(const [,tag,text] of anchors) {
    if(text.replace(/[\[\]\s]/g,'')!==media.id)continue;
    const url=attr(tag,'href'); const asset=parse(await get(url),url,media);if(asset)return asset;
  }
  return null;
}
// The public sitemap exposes real image/GIF URLs and exact English titles.
// Seed only unique title matches; ambiguous names require reference verification.
for(const [key,media] of wanted) {
  if(index.assets[key]?.verifiedId) continue;
  const hits=lookup.get(`${media.kind}:${norm(media.name)}`)??[];
  if(hits.length===1 && hits[0].poster) index.assets[key]={id:media.id,kind:media.kind,name:media.name,productUrl:hits[0].url,poster:hits[0].poster,...(media.kind!=='video'?{preview:hits[0].poster,previewType:'image'}:{}),matchMethod:'unique-english-name'};
}
save();
const queue=[...wanted].filter(([key,media])=>!index.assets[key] || (media.kind==='video' && index.assets[key].previewType!=='video')).sort((a,b)=>Number(b[1].status==='confirmed')-Number(a[1].status==='confirmed'));let completed=0;
console.log(`Seeded ${Object.keys(index.assets).length}/${wanted.size}; resolving ${queue.length} product pages.`);
async function worker() {
  while(queue.length) {
    const [key,media]=queue.shift();let asset, failure='Product/reference not resolved';
    for(let attempt=0;attempt<2;attempt++) {try{asset=await resolve(media);break;}catch(e){failure=e.message;}}
    if(asset) index.assets[key]=asset;else index.unresolved.push({key,name:media.name,reason:failure});
    completed++;if(completed%25===0){save();console.log(`Processed ${completed}; mapped ${Object.keys(index.assets).length}/${wanted.size}; unresolved ${index.unresolved.length}`);}
  }
}
try { await Promise.all(Array.from({length:Math.min(8, Math.max(1, Number(process.env.GYM_CONCURRENCY)||4))},worker));save();console.log(`Done: ${Object.keys(index.assets).length}/${wanted.size} verified; ${index.unresolved.length} unresolved.`); } finally { await browser.close(); }
