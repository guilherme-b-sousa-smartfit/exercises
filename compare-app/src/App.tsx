import { useMemo, useState } from 'react';
import { useComparison } from './hooks/useComparison';
import { CATALOG_URL, COMPARISON_SHEET_URL, coverageCounts, type CatalogMedia, type MatchStatus } from './lib/comparison';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const percent = (n: number, total: number) => total ? `${(n / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '0%';
const badge = (status: string) => status === 'Correspondência forte' || status === 'Sim — forte' ? 'badge-A' : status === 'Revisar' ? 'badge-C' : 'badge-vazio';
function Media({ label, item }: { label: string; item: CatalogMedia }) {
  return <div className="catalog-media"><div className="linha"><strong>{label}</strong><span className={`badge ${badge(item.status)}`}>{item.status}</span></div>
    {item.name && <p>{item.name}</p>}
    {item.id && <small>ID {item.id} · {item.reference}</small>}
  </div>;
}
export const App = () => {
  const { rows, loading, error, source, reload } = useComparison();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MatchStatus | ''>('');
  const [group, setGroup] = useState('');
  const [format, setFormat] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [limit, setLimit] = useState(60);
  const totals = useMemo(() => coverageCounts(rows), [rows]);
  const groups = useMemo(() => [...new Set(rows.map(r => r.group))].sort(), [rows]);
  const filtered = useMemo(() => rows.filter(r => {
    if (status && r.status !== status) return false;
    if (group && r.group !== group) return false;
    if (gapsOnly && !r.missingImage && !r.missingVideo) return false;
    if (format === 'image' && r.image.status !== 'Sim — forte') return false;
    if (format === 'video' && r.video.status !== 'Sim — forte') return false;
    if (format === 'gif' && r.gif.status !== 'Sim — forte') return false;
    return normalize(`${r.id} ${r.name} ${r.group} ${r.image.name} ${r.video.name} ${r.gif.name} ${r.image.id} ${r.video.id} ${r.gif.id}`).includes(normalize(search.trim()));
  }), [rows, status, group, gapsOnly, format, search]);
  const setResult = (value: MatchStatus | '') => { setStatus(value); setLimit(60); };
  return <main className="app">
    <header className="cabecalho"><h1>Cobertura do catálogo Gym Visual</h1><p>Comparação por exercício da base Smart Fit, antes da compra. Vídeos, imagens e GIFs são avaliados separadamente.</p></header>
    {error && <div className="erro" role="alert">{error}</div>}
    <div className="stats">
      {([
        ['', 'Exercícios da base', totals.total],
        ['Correspondência forte', 'Correspondência forte', totals.strong],
        ['Revisar', 'Precisam de revisão', totals.uncertain],
        ['Não encontrado', 'Não encontrados', totals.absent],
      ] as const).map(([value, label, count]) => <button key={value} className={`stat ${status === value ? 'stat-ativo' : ''} ${value === 'Correspondência forte' ? 'stat-ok' : value === 'Revisar' ? 'stat-aviso' : ''}`} onClick={() => setResult(value)}><span className="stat-valor">{count}</span><span className="stat-rotulo">{label} · {percent(count, totals.total)}</span></button>)}
    </div>
    <section className="purchase-summary" aria-label="Cobertura por formato"><p><strong>Com correspondência forte:</strong> {totals.video} vídeos · {totals.image} imagens · {totals.gif} GIFs.</p><p><strong>Lacunas atuais:</strong> potencial de completar {totals.fillImage} de {totals.missingImage} imagens e {totals.fillVideo} de {totals.missingVideo} vídeos ausentes.</p><p className="dica">“Forte” indica equivalência pelos nomes e metadados, sem inspeção visual. Candidatos para revisão não contam como cobertura garantida. O índice é uma regra de confiança, não uma probabilidade.</p></section>
    <div className="toolbar">
      <div className="linha"><input className="busca" aria-label="Buscar exercício ou ID" placeholder="Buscar nome em português, inglês ou ID…" value={search} onChange={e => { setSearch(e.target.value); setLimit(60); }} /><button className="botao" disabled={loading} onClick={reload}>{loading ? 'Lendo…' : 'Recarregar planilha'}</button></div>
      <div className="linha"><select className="botao" aria-label="Grupo muscular" value={group} onChange={e => { setGroup(e.target.value); setLimit(60); }}><option value="">Todos os grupos</option>{groups.map(g => <option key={g}>{g}</option>)}</select><select className="botao" aria-label="Formato com correspondência forte" value={format} onChange={e => { setFormat(e.target.value); setLimit(60); }}><option value="">Todos os formatos</option><option value="video">Vídeo — forte</option><option value="image">Imagem — forte</option><option value="gif">GIF — forte</option></select><label><input type="checkbox" checked={gapsOnly} onChange={e => { setGapsOnly(e.target.checked); setLimit(60); }} /> Somente lacunas atuais</label><button className="link" onClick={() => { setSearch(''); setStatus(''); setGroup(''); setFormat(''); setGapsOnly(false); setLimit(60); }}>Limpar filtros</button></div>
      <div className="linha rodape-toolbar"><span className="dica">{source || 'Carregando comparação…'} · {filtered.length} resultados. Recarregar lê a análise publicada.</span><a className="link" href={COMPARISON_SHEET_URL} target="_blank" rel="noreferrer">Comparativo completo</a><a className="link" href={CATALOG_URL} target="_blank" rel="noreferrer">Catálogo pago</a></div>
    </div>
    {!rows.length && loading ? <p className="vazio">Lendo o comparativo…</p> : !filtered.length ? <p className="vazio">Nenhum exercício corresponde aos filtros.</p> : <div className="comparison-grid">{filtered.slice(0, limit).map(r => <article className="card" key={r.id}><div className="corpo"><div className="tags"><span className={`badge ${badge(r.status)}`}>{r.status}</span><span className="badge">Confiança {r.confidence.toLowerCase()} · índice {r.score}/100</span><span className="badge">{r.group}</span></div><h2 className="nome">{r.name} <span className="id">#{r.id}</span></h2><p className="comparison-reason">{r.reason}</p><Media label="Vídeo" item={r.video} /><Media label="Imagem" item={r.image} /><Media label="GIF" item={r.gif} /><div className="tags">{r.missingImage && <span className="badge badge-aviso">Falta imagem na base</span>}{r.missingVideo && <span className="badge badge-aviso">Falta vídeo na base</span>}</div><div className="linha"><a className="link" href={r.sourceUrl} target="_blank" rel="noreferrer">Registro original</a><a className="link" href={r.catalogUrl} target="_blank" rel="noreferrer">Consultar catálogo pelos IDs</a></div></div></article>)}</div>}
    {filtered.length > limit && <button className="botao load-more" onClick={() => setLimit(v => v + 60)}>Mostrar mais 60 ({Math.min(limit, filtered.length)} de {filtered.length})</button>}
  </main>;
};
