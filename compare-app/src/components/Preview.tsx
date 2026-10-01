import { useEffect, useRef, useState } from 'react';
const resolvedCache=new Map<string,{src:string;type:'video'|'embed'}>();
export function Preview({ src, poster, type, label, link }: { src?: string; poster?: string; type: 'image' | 'video' | 'embed'; label: string; link?: string }) {
  const [resolved,setResolved]=useState<{src:string;type:'video'|'embed'}|null>(null);
  const [lookupError,setLookupError]=useState('');
  const [retry,setRetry]=useState(0);
  let product='';try{const u=new URL(link||'');if(!src&&['gymvisual.com','www.gymvisual.com'].includes(u.hostname)&&/^\/videos\/\d+-.*\.html$/.test(u.pathname))product=`https://gymvisual.com${u.pathname}`;}catch{/* Direct media or blank input. */}
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(()=>{setResolved(null);setLookupError('');if(!product)return;const cached=resolvedCache.get(product);if(cached){setResolved(cached);return;}if(!active)return;const c=new AbortController();const timer=setTimeout(async()=>{try{const r=await fetch(`/api/gymvisual-preview?url=${encodeURIComponent(product)}`,{signal:c.signal});const data=await r.json();if(!r.ok)throw new Error(data.error||'Prévia indisponível.');if(!c.signal.aborted){resolvedCache.set(product,data);setResolved(data);}}catch(e){if(!c.signal.aborted)setLookupError(e instanceof Error?e.message:'Não foi possível carregar a prévia.');}},500);return()=>{clearTimeout(timer);c.abort();};},[product,active,retry]);
  if(product){src=resolved?.src;type=resolved?.type||'video';}
  useEffect(() => { setFailed(false); }, [src,product]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '150px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (active) void video.current?.play().catch(() => {}); else video.current?.pause(); }, [active, src]);
  let embedSrc = src;
  if (src && type === 'embed') {
    try { const url = new URL(src); url.searchParams.set('autoplay', '1'); url.searchParams.set('mute', '1'); url.searchParams.set('playsinline', '1'); embedSrc = url.href; } catch { embedSrc = src; }
  }
  return <div ref={container} className="preview">
    {!src || failed ? <div className="preview-empty">{failed ? 'Vídeo indisponível.' : product?(lookupError||'Carregando vídeo do GymVisual…'):'Sem prévia disponível.'}{product&&lookupError&&<button type="button" onClick={()=>setRetry(n=>n+1)}>Tentar novamente</button>}{link && <a href={link} target="_blank" rel="noreferrer">Abrir origem ↗</a>}</div> : type === 'video' ? <video ref={video} aria-label={label} src={active ? src : undefined} poster={poster} controls autoPlay muted loop playsInline preload="none" onError={() => setFailed(true)} /> : type === 'embed' ? active && <iframe title={label} src={embedSrc} allow="autoplay; fullscreen" allowFullScreen /> : <img loading="lazy" src={src} alt={label} onError={() => setFailed(true)} />}
  </div>;
}
