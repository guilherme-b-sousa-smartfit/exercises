import { useEffect, useMemo, useState } from 'react';
import { useComparison } from './hooks/useComparison';
import { COMPARISON_SHEET_URL, coverageCounts, type ComparisonRow, type MatchStatus } from './lib/comparison';
import { budget, defaultPricing, itemsFor, keyFor, kinds, labels, readSelection, usd, type Item, type Kind, type MediaIndex } from './lib/budget';
import { Preview } from './components/Preview';
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const emptyIndex: MediaIndex = { checkedAt: '', assets: {} };
const storageKey = 'gymvisual-selection-v1';
const badge = (s: string) => s === 'Correspondência forte' || s === 'Sim — forte' ? 'badge-A' : s === 'Revisar' ? 'badge-C' : 'badge-vazio';
function Exercise({ row: r, index, selected, toggle }: { row: ComparisonRow; index: MediaIndex; selected: Set<string>; toggle: (key: string) => void }) {
  const [kind, setKind] = useState<Kind>('video');
  const [current, setCurrent] = useState<'image' | 'video'>('video');
  const media = r[kind], asset = index.assets[keyFor(kind, media.id)];
  const currentUrl = current === 'image' ? r.originalImage : r.originalVideo;
  return <article className="card exercise"><div className="corpo">
    <div className="tags"><span className={`badge ${badge(r.status)}`}>{r.status}</span><span className="badge">Índice {r.score}/100</span><span className="badge">{r.group}</span></div>
    <h2 className="nome">{r.name} <span className="id">#{r.id}</span></h2>
    <div className="before-after"><section><h3>Hoje · Smart Fit</h3><div className="media-tabs">{(['image','video'] as const).map(k => <button key={k} aria-pressed={current === k} onClick={() => setCurrent(k)}>{labels[k]}{(k === 'image' ? r.missingImage : r.missingVideo) ? ' · ausente' : ''}</button>)}</div><Preview key={`old:${current}:${currentUrl}`} src={currentUrl} poster={r.originalImage} type={current} label={`${r.name} atual`} link={current === 'video' ? r.originalExternalVideo : undefined} />{current === 'video' && r.originalExternalVideo && <a className="link" href={r.originalExternalVideo} target="_blank" rel="noreferrer">Vídeo externo atual ↗</a>}</section>
    <section><h3>Depois · Gym Visual <small>prévia</small></h3><div className="media-tabs">{kinds.map(k => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{labels[k]}</button>)}</div>
    <Preview key={`new:${kind}:${media.id}:${asset?.preview}`} src={asset?.preview || asset?.poster} type={asset?.preview ? asset.previewType ?? 'image' : 'image'} poster={asset?.poster} label={`${media.name} — ${labels[kind]}`} link={asset?.productUrl} />
    {asset && !asset.preview && kind !== 'image' && <small className="dica">Capa do produto; prévia reproduzível não localizada. Consulte o site.</small>}
    <p className="candidate-name">{media.name || 'Sem candidato encontrado'}</p><div className="tags"><span className={`badge ${badge(media.status)}`}>{media.status}</span>{media.id && <span className="badge">ID {media.id}</span>}</div>
    {asset ? <a className="link" href={asset.productUrl} target="_blank" rel="noreferrer">Ver produto e prévia oficial ↗</a> : media.id && <a className="link" href={`https://gymvisual.com/index.php?controller=search&search_query=${encodeURIComponent(media.id)}`} target="_blank" rel="noreferrer">Buscar ID no Gym Visual ↗</a>}
    </section></div>
    <div className="select-media">{kinds.map(k => <label key={k}><input type="checkbox" aria-label={`Selecionar ${labels[k]} para ${r.name} (${r.id})`} disabled={!r[k].id || r[k].status === 'Não encontrado'} checked={selected.has(keyFor(k, r[k].id))} onChange={() => toggle(keyFor(k, r[k].id))} />{labels[k]}{r[k].status === 'Revisar' ? ' · revisar' : ''}</label>)}</div>
    <details><summary>Por que este candidato?</summary>{asset && <p className="dica">{asset.verifiedId ? 'Referência do produto conferida com o ID do catálogo.' : 'Produto localizado pelo nome único em inglês no índice oficial do Gym Visual.'}</p>}<p className="comparison-reason">{r.reason}</p><p className="dica">O índice é heurístico, não uma probabilidade. A prévia permite conferir execução, equipamento e variação.</p><a className="link" href={r.sourceUrl} target="_blank" rel="noreferrer">Registro original ↗</a></details>
  </div></article>;
}
function Quote({ title, items, pricing, index }: { title: string; items: Item[]; pricing: typeof defaultPricing; index: MediaIndex }) {
  const result = budget(items, pricing, index);
  return <div className="quote"><span>{title}</span><strong>{usd(result.cents)}{result.unknown > 0 ? ' + pendências' : ''}</strong><small>{result.quantity} mídias únicas · {result.counts.video} vídeos · {result.counts.gif} GIFs · {result.counts.image} imagens</small>{result.unknown > 0 && <small className="price-warning">{result.unknown} sem preço calculado. Informe o valor nas regras do orçamento.</small>}</div>;
}
export const App = () => {
  const { rows, loading, error, source, reload } = useComparison();
  const [index, setIndex] = useState<MediaIndex>(emptyIndex);
  const [indexError, setIndexError] = useState('');
  const [search, setSearch] = useState(''); const [status, setStatus] = useState<MatchStatus | ''>('');
  const [group, setGroup] = useState(''); const [gapsOnly, setGapsOnly] = useState(false); const [selectedOnly, setSelectedOnly] = useState(false);
  const [limit, setLimit] = useState(12); const [formats, setFormats] = useState<Kind[]>(['video']); const [includeReview, setIncludeReview] = useState(false);
  const [pricing, setPricing] = useState(defaultPricing);
  const [selected, setSelected] = useState<Set<string>>(() => { try { return readSelection(localStorage.getItem(storageKey)); } catch { return new Set(); } });
  const [storageError, setStorageError] = useState('');
  useEffect(() => { const c = new AbortController(); fetch(`${import.meta.env.BASE_URL}gymvisual-media.json`, { signal: c.signal, cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setIndex).catch(() => { if (!c.signal.aborted) setIndexError('Índice de prévias indisponível. Os links de busca e o comparativo continuam disponíveis.'); }); return () => c.abort(); }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify([...selected])); } catch { setStorageError('A seleção está apenas nesta sessão: não foi possível salvá-la no navegador.'); } }, [selected]);
  const totals = useMemo(() => coverageCounts(rows), [rows]);
  const allItems = useMemo(() => itemsFor(rows, kinds, true), [rows]);
  const selectedItems = useMemo(() => allItems.filter(i => selected.has(i.key)), [allItems, selected]);
  const unavailableSelections = [...selected].filter(k => !allItems.some(i => i.key === k)).length;
  const groups = useMemo(() => [...new Set(rows.map(r => r.group))].sort(), [rows]);
  const filtered = useMemo(() => rows.filter(r => (!status || r.status === status) && (!group || r.group === group) && (!gapsOnly || r.missingImage || r.missingVideo) && (!selectedOnly || kinds.some(k => selected.has(keyFor(k, r[k].id)))) && normalize(`${r.id} ${r.name} ${r.group} ${kinds.map(k => `${r[k].name} ${r[k].id}`).join(' ')}`).includes(normalize(search.trim()))), [rows, status, group, gapsOnly, selectedOnly, selected, search]);
  const totalItems = useMemo(() => itemsFor(rows, formats, includeReview), [rows, formats, includeReview]);
  const missingItems = useMemo(() => itemsFor(rows, formats, includeReview, true), [rows, formats, includeReview]);
  const filteredItems = useMemo(() => itemsFor(filtered, formats, includeReview, gapsOnly), [filtered, formats, includeReview, gapsOnly]);
  const toggle = (key: string) => setSelected(old => { const next = new Set(old); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const add = (items: Item[]) => setSelected(old => new Set([...old, ...items.map(i => i.key)]));
  const exportCsv = () => {
    const costs = budget(selectedItems, pricing, index);
    const cells = [['Formato','ID Gym Visual','Nome','IDs Smart Fit','Correspondências','Preço estimado USD','Produto','Prévia'], ...selectedItems.map(i => [labels[i.kind],i.media.id,i.media.name,i.rows.map(r => r.id).join(' | '),i.rows.map(r => `${r.id}: ${r[i.kind].status}`).join(' | '), costs.prices[i.key] == null ? 'Preço pendente' : (costs.prices[i.key]! / 100).toFixed(2),index.assets[i.key]?.productUrl ?? '',index.assets[i.key]?.preview ?? index.assets[i.key]?.poster ?? ''])];
    const csv = '\uFEFF' + cells.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'})); const a = document.createElement('a'); a.href=url; a.download='selecao-gymvisual.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <main className="app">
    <header className="cabecalho"><h1>Smart Fit × Gym Visual</h1><p>Compare a execução atual com as prévias do catálogo e monte uma estimativa de compra.</p><div className="linha"><a className="link" href="#exercicios">Comparar exercícios ↓</a><a className="link" href="#orcamento">Simular custos ↓</a></div></header>
    {(error || indexError || storageError) && <div className="erro" role="alert">{[error,indexError,storageError].filter(Boolean).join(' ')}</div>}
    <div className="stats">{([['','Exercícios',totals.total],['Correspondência forte','Correspondência forte',totals.strong],['Revisar','Para revisar',totals.uncertain],['Não encontrado','Sem correspondência',totals.absent]] as const).map(([s,label,count]) => <button key={s} className={`stat ${status === s ? 'stat-ativo' : ''}`} onClick={() => {setStatus(s);setLimit(12);}}><strong className="stat-valor">{count}</strong><span className="stat-rotulo">{label}</span></button>)}</div>
    <section id="orcamento" className="budget-panel" aria-label="Simulador de custos"><h2>Simular compra <small>USD · mídias únicas</small></h2>
      <div className="linha">{kinds.map(k => <label key={k}><input type="checkbox" checked={formats.includes(k)} onChange={e => setFormats(old => e.target.checked ? [...old,k] : old.filter(f => f !== k))} />{labels[k]}</label>)}<label><input type="checkbox" checked={includeReview} onChange={e => setIncludeReview(e.target.checked)} />Incluir candidatos para revisão nos cenários e lotes</label></div>
      <div className="quotes"><Quote title="Total da base com candidato elegível" items={totalItems} pricing={pricing} index={index} /><Quote title="Somente mídias faltantes hoje" items={missingItems} pricing={pricing} index={index} /><Quote title="Minha seleção (todos os formatos marcados nos cards)" items={selectedItems} pricing={pricing} index={index} /></div>
      <p className="dica">Cenários usam os formatos acima e {includeReview ? 'incluem hipóteses que precisam de revisão' : 'apenas correspondências fortes'}. IDs repetidos custam uma vez. GIFs são uma alternativa às lacunas de vídeo; selecionar ambos soma os dois. Exercícios sem candidato não estão orçados. {totals.missingImage} imagens e {totals.missingVideo} vídeos faltam na base atual.</p>
      <div className="linha"><button className="botao" disabled={!totalItems.length} onClick={() => add(totalItems)}>Adicionar total elegível</button><button className="botao" disabled={!missingItems.length} onClick={() => add(missingItems)}>Adicionar faltantes</button><button className="botao" disabled={!filteredItems.length} onClick={() => add(filteredItems)}>Adicionar filtrados ({filteredItems.length})</button><button className="botao" disabled={!selectedItems.length} onClick={exportCsv}>Exportar seleção CSV</button><button className="link" disabled={!selected.size} onClick={() => setSelected(new Set())}>Limpar seleção</button></div>
      {selectedItems.some(i => i.rows.some(r => r[i.kind].status === 'Revisar')) && <p className="price-warning">A seleção inclui candidatos para revisão. Confira a execução antes de comprar.</p>}
      {unavailableSelections > 0 && rows.length > 0 && <p className="price-warning">{unavailableSelections} seleções salvas não existem nesta análise e foram excluídas do orçamento.</p>}
      <details className="pricing"><summary>Preços e regras do orçamento</summary><p>Pela <a className="link" href="https://gymvisual.com/content/6-price-rules" target="_blank" rel="noreferrer">tabela oficial do Gym Visual</a>: GIF US$ 0,90 a partir de 10; vídeo US$ 6 a partir de 5; imagem US$ 0,75 a partir de 10. Abaixo desses mínimos: US$ 3,60/GIF, US$ 10/vídeo e US$ 3/imagem, ou o preço avulso lido no produto. Algumas páginas de produto mostram outros mínimos; confira a cotação final. Valores editáveis para simular uma negociação.</p><div className="linha">{kinds.map(k => <div key={k}><label>{labels[k]} · USD/unidade com desconto <input type="number" min="0" step="0.01" placeholder="Não informado" value={pricing[`${k}Cents`] == null ? '' : pricing[`${k}Cents`]!/100} onChange={e => setPricing(p => ({...p,[`${k}Cents`]:k === 'image' && e.target.value === '' ? null : Math.max(0,Math.round(Number(e.target.value)*100))}))} /></label><label>Quantidade mínima · {labels[k]} <input type="number" min="1" step="1" value={pricing[`${k}Min`]} onChange={e => setPricing(p => ({...p,[`${k}Min`]: Math.max(1,Math.floor(Number(e.target.value)))}))} /></label></div>)}</div><p className="dica">Regras consultadas em 23/09/2026. Desconto por formato e aplicado a todas as unidades ao atingir o mínimo, sem impostos, câmbio ou descontos de pacotes. A seleção não efetua compra. Prévia pública não é o arquivo adquirido.</p></details>
    </section>
    <div id="exercicios" className="toolbar"><div className="linha"><input className="busca" aria-label="Buscar exercício ou ID" placeholder="Nome em português, inglês ou ID…" value={search} onChange={e => {setSearch(e.target.value);setLimit(12);}} /><button className="botao" disabled={loading} onClick={reload}>{loading ? 'Lendo…' : 'Recarregar planilha'}</button></div><div className="linha"><select className="botao" aria-label="Grupo muscular" value={group} onChange={e => {setGroup(e.target.value);setLimit(12);}}><option value="">Todos os grupos</option>{groups.map(g => <option key={g}>{g}</option>)}</select><label><input type="checkbox" checked={gapsOnly} onChange={e => {setGapsOnly(e.target.checked);setLimit(12);}} />Somente lacunas atuais</label><label><input type="checkbox" checked={selectedOnly} onChange={e => {setSelectedOnly(e.target.checked);setLimit(12);}} />Somente selecionados</label><button className="link" onClick={() => {setSearch('');setStatus('');setGroup('');setGapsOnly(false);setSelectedOnly(false);setLimit(12);}}>Limpar filtros</button></div><p className="dica">{filtered.length} exercícios · {source || 'Carregando…'} · <a className="link" href={COMPARISON_SHEET_URL} target="_blank" rel="noreferrer">Abrir planilha ↗</a></p></div>
    <div className="comparison-grid visual-grid">{filtered.slice(0,limit).map(r => <Exercise key={r.id} row={r} index={index} selected={selected} toggle={toggle} />)}</div>
    {!filtered.length && !loading && <p className="vazio">Nenhum exercício corresponde aos filtros.</p>}
    {filtered.length > limit && <button className="botao load-more" onClick={() => setLimit(n => n+12)}>Mostrar mais 12 ({Math.min(limit,filtered.length)} de {filtered.length})</button>}
  </main>;
};
