import { useState } from 'react';
export function Preview({ src, poster, type, label, link }: { src?: string; poster?: string; type: 'image' | 'video'; label: string; link?: string }) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  return <div className="preview">
    {!src || failed ? <div className="preview-empty">{failed ? 'A prévia não carregou.' : 'Prévia não disponível.'}{link && <a href={link} target="_blank" rel="noreferrer">Abrir no site ↗</a>}</div> : type === 'video' ? playing ? <video aria-label={label} src={src} poster={poster} controls autoPlay playsInline preload="metadata" onError={() => setFailed(true)} /> : <button className="play-preview" onClick={() => setPlaying(true)} aria-label={`Reproduzir ${label}`}>{poster && <img loading="lazy" src={poster} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />}<span>▶ Reproduzir vídeo</span></button> : <a className="preview-zoom" href={src} target="_blank" rel="noreferrer" title="Abrir imagem em tamanho maior"><img loading="lazy" src={src} alt={label} onError={() => setFailed(true)} /></a>}
  </div>;
}
