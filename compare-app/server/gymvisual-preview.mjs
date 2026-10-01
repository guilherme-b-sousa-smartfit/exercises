const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export function productUrl(raw){let u;try{u=new URL(raw);}catch{throw fail('Informe um link de vídeo do GymVisual.');}if(!['http:','https:'].includes(u.protocol)||!['gymvisual.com','www.gymvisual.com'].includes(u.hostname)||u.port||u.username||u.password||!/^\/videos\/\d+-[a-z0-9-]+\.html$/i.test(u.pathname))throw fail('Use uma página de vídeo do GymVisual.');return `https://gymvisual.com${u.pathname}`;}
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#039;/g,"'");
export function extractPreview(html,page){
 const attr=(tag,key)=>decode(tag.match(new RegExp(`\\b${key}\\s*=\\s*["']([^"']+)["']`,'i'))?.[1]||'');
 for(const tag of html.match(/<(?:video|source|iframe)\b[^>]*>/gi)||[]){
  const raw=attr(tag,'src');if(!raw)continue;let u;try{u=new URL(raw,page);}catch{continue;}
  if(u.protocol!=='https:'||u.username||u.password||u.port)continue;
  if(/^<iframe/i.test(tag)){
   if(['www.youtube.com','youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(u.hostname)&&/^\/embed\/[\w-]{11}$/.test(u.pathname))return {src:`https://www.youtube-nocookie.com${u.pathname}`,type:'embed',link:page};
  }else if(['gymvisual.com','www.gymvisual.com'].includes(u.hostname)&&u.pathname.startsWith('/img/')&&/\.mp4$/i.test(u.pathname))return {src:u.href,type:'video',link:page};
 }
 throw fail('Esta página não disponibilizou uma prévia de vídeo. Abra o link original para conferir.',404);
}
const cache=new Map(),pending=new Map();
export async function resolvePreview(raw){const page=productUrl(raw);const saved=cache.get(page);if(saved&&saved.expires>Date.now())return saved.value;if(pending.has(page))return pending.get(page);
 const task=(async()=>{let response;try{response=await fetch(page,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html'}});}catch{throw fail('Não foi possível consultar o GymVisual agora. Tente novamente.',502);}if(!response.ok)throw fail('O GymVisual não liberou a prévia agora. Abra o link original ou tente novamente.',502);
 const reader=response.body.getReader();let html='',size=0;const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2000000){await reader.cancel();throw fail('Resposta do GymVisual maior que o esperado.',502);}html+=decoder.decode(value,{stream:true});}html+=decoder.decode();
 const value=extractPreview(html,page);if(cache.size>=500)cache.delete(cache.keys().next().value);cache.set(page,{value,expires:Date.now()+3600000});return value;})();pending.set(page,task);try{return await task;}finally{pending.delete(page);}}
