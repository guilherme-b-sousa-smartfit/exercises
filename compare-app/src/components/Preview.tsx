import { useEffect, useRef, useState } from 'react';
export function Preview({ src, poster, type, label, link }: { src?: string; poster?: string; type: 'image' | 'video' | 'embed'; label: string; link?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
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
    {!src || failed ? <div className="preview-empty">{failed ? 'Vídeo indisponível.' : 'Sem prévia disponível.'}{link && <a href={link} target="_blank" rel="noreferrer">Abrir origem ↗</a>}</div> : type === 'video' ? <video ref={video} aria-label={label} src={active ? src : undefined} poster={poster} controls autoPlay muted loop playsInline preload="none" onError={() => setFailed(true)} /> : type === 'embed' ? active && <iframe title={label} src={embedSrc} allow="autoplay; fullscreen" allowFullScreen /> : <img loading="lazy" src={src} alt={label} onError={() => setFailed(true)} />}
  </div>;
}
