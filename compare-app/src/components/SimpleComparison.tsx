import { useEffect, useMemo, useRef, useState } from 'react';
import type { useComparison } from '../hooks/useComparison';
import type { MediaIndex } from '../lib/budget';
import { Preview } from './Preview';
type Review = { name: string; candidateId: string; source: string; target: string; score: number; reason: string };
type VideoScores = Record<string, { candidateId: string; name: string; score: number }>;
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function SimpleComparison({ comparison }: { comparison: ReturnType<typeof useComparison> }) {
  const [index, setIndex] = useState<MediaIndex>();
  const [query, setQuery] = useState('');
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [scores, setScores] = useState<VideoScores>({});
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [min, setMin] = useState(0), [max, setMax] = useState(100), [limit, setLimit] = useState(12);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function read(file: string) { const r = await fetch(`${import.meta.env.BASE_URL}${file}`, { signal: controller.signal }); if (!r.ok) throw new Error('Não foi possível carregar esta comparação.'); return r.json(); }
    (async () => {
        const [media, visual, videoScores] = await Promise.all([read('gymvisual-media.json'), read('visual-reviews.json'), read('video-scores.json')]);
        setIndex(media); setReviews(visual); setScores(videoScores);
      setReady(true);
    })().catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  const rows = useMemo(() => {
    const terms = normalizeSearch(query).split(' ').filter(Boolean);
    return comparison.rows.map(source => {
        const asset = index?.assets[`video:${source.video.id}`];
        const saved = scores[source.id];
        const score = saved?.candidateId === source.video.id && saved.name === source.name ? saved.score : 0;
        const review = reviews[source.id];
        const valid = review && review.name === source.name && review.candidateId === source.video.id && review.source === source.originalVideo && review.target === asset?.preview;
        return { source, name: source.video.name, src: asset?.preview, poster: asset?.poster, type: asset?.previewType ?? 'video', score: valid ? review.score : score, visual: Boolean(valid), reason: valid ? review.reason : '', link: asset?.productUrl };
    }).filter(r => r.score >= min && r.score <= max && terms.every(term => normalizeSearch(`${r.source.name} ${r.name || ''}`).includes(term)));
  }, [comparison.rows, index, reviews, scores, min, max, query]);
  useEffect(() => { setLimit(12); }, [min, max, query]);
  useEffect(() => {
    if (limit >= rows.length) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setLimit(n => Math.min(n + 12, rows.length)); }, { rootMargin: '1200px' });
    if (sentinel.current) observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [limit, rows.length]);
  return <section aria-label="Comparação GymVisual">
    <div className="similarity-filter"><label className="exercise-search">Buscar exercício<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque por parte do título" autoComplete="off" spellCheck={false} /></label><div className="similarity-heading"><strong>Similaridade</strong><output aria-live="polite">{min}% – {max}%</output></div><div className="range-controls"><label>De {min}%<input aria-label="Similaridade mínima" type="range" min="0" max="100" value={min} onChange={e => setMin(Math.min(Number(e.target.value), max))} /></label><label>Até {max}%<input aria-label="Similaridade máxima" type="range" min="0" max="100" value={max} onChange={e => setMax(Math.max(Number(e.target.value), min))} /></label></div><small>{rows.length} exercícios · Estimativa de equivalência; “frames revisados” indica conferência visual.</small></div>
    {(error || comparison.error) && <p role="alert" className="erro">{error || comparison.error}</p>}
    {comparison.loading || !ready && !error ? <p role="status">Carregando comparações…</p> : null}
    <div className="simple-grid">{ready && rows.slice(0, limit).map(r => <article className="simple-card" key={r.source.id}><header><div><small>#{r.source.id}</small><h2>{r.source.name}</h2></div><strong className="similarity-score" title={r.reason || 'Estimativa baseada nos títulos e metadados'}>{r.score}%<small>{r.visual ? 'frames revisados' : 'pelos títulos'}</small></strong></header><div className="before-after"><section><h3>Smart Fit</h3><Preview src={r.source.originalVideo} poster={r.source.originalImage} type="video" label={r.source.name} link={r.source.originalExternalVideo} /></section><section><h3>GymVisual</h3><Preview src={r.src} poster={r.poster} type={r.type} label={r.name || 'Sem candidato'} link={r.link} /></section></div><p className="candidate-name">{r.name || 'Sem candidato identificado'}</p></article>)}</div>
    <div ref={sentinel} className="scroll-sentinel" role="status">{ready && (rows.length === 0 ? 'Nenhum exercício encontrado. Ajuste a busca ou a porcentagem.' : limit < rows.length ? 'Carregando mais exercícios…' : `${rows.length} exercícios exibidos`)}</div>

  </section>;
}
