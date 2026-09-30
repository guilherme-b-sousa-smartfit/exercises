import { useEffect, useMemo, useState } from 'react';
import type { useComparison } from '../hooks/useComparison';
import type { MatchStatus } from '../lib/comparison';
import { eligible, joinComparison, proMonthlyCost, readDBSelection, uniqueGIFs, type DBComparison, type DBSnapshot } from '../lib/exercisedbComparison';
import { Preview } from './Preview';
import { PAID_URL } from './Platforms';
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const usd = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
const selectionKey = 'exercisedb-selection-v1';
function ExerciseDBCard({ row, selected, toggle }: { row: DBComparison; selected: Set<string>; toggle: (id: string) => void }) {
  const { source: s, match: m, exercise: e } = row;
  const [current, setCurrent] = useState<'image' | 'video'>('video');
  const url = current === 'image' ? s.originalImage : s.originalVideo;
  return <article className="card exercise"><div className="corpo">
    <div className="tags"><span className={`badge ${m.status === 'Correspondência forte' ? 'badge-A' : m.status === 'Revisar' ? 'badge-C' : 'badge-vazio'}`}>{m.status}</span><span className="badge">Índice {m.score}/100</span><span className="badge">{s.group}</span>{row.stale && <span className="badge badge-C">Análise pendente</span>}</div>
    <h2 className="nome">{s.name} <span className="id">#{s.id}</span></h2>
    <div className="before-after"><section><h3>Hoje · Smart Fit</h3><div className="media-tabs">{(['image', 'video'] as const).map(k => <button key={k} aria-pressed={current === k} onClick={() => setCurrent(k)}>{k === 'image' ? 'Imagem' : 'Vídeo'}{(k === 'image' ? s.missingImage : s.missingVideo) ? ' · ausente' : ''}</button>)}</div>
      <Preview key={`${s.id}:${current}:${url}`} src={url} poster={s.originalImage} type={current} label={`${s.name} atual`} link={current === 'video' ? s.originalExternalVideo : undefined} />{current === 'video' && s.originalExternalVideo && <a className="link" href={s.originalExternalVideo} target="_blank" rel="noreferrer">Vídeo externo atual ↗</a>}
    </section><section><h3>Depois · ExerciseDB <small>GIF 180p</small></h3><div className="media-tabs"><button aria-pressed="true">GIF</button><button disabled title="A API gratuita oferece apenas GIFs">Imagem · pago</button><button disabled title="Vídeo não está incluído na API V1 gratuita">Vídeo · indisponível</button></div>
      <Preview key={e?.exerciseId || 'absent'} src={e?.gifUrl} type="image" label={e?.name || 'Sem candidato ExerciseDB'} />
      <p className="candidate-name">{e?.name || 'Sem candidato encontrado'}</p>{e && <><div className="tags"><span className="badge">ID {e.exerciseId}</span>{e.equipments.map(v => <span key={v} className="badge">{v}</span>)}</div><p className="dica">Principal: {e.targetMuscles.join(', ')} · Secundários: {e.secondaryMuscles.join(', ') || 'Não informados'}</p></>}
    </section></div>
    <div className="select-media"><label><input type="checkbox" disabled={!e} checked={!!e && selected.has(e.exerciseId)} aria-label={`Selecionar GIF ExerciseDB para ${s.name} (${s.id})`} onChange={() => e && toggle(e.exerciseId)} />GIF{m.status === 'Revisar' ? ' · revisar' : ''}</label><span className="dica">Imagem e vídeo não incluídos na versão gratuita.</span></div>
    <details><summary>Por que este candidato?</summary><p className="comparison-reason">{m.reason}</p><p className="dica">Comparação direta entre o nome Smart Fit e o catálogo ExerciseDB. Índice heurístico, não probabilidade nem revisão visual. {m.query && `Termos normalizados: ${m.query}.`}</p><a className="link" href={s.sourceUrl} target="_blank" rel="noreferrer">Registro original ↗</a></details>
    {e && <details><summary>Instruções ExerciseDB ({e.instructions.length})</summary><ol>{e.instructions.map((step, i) => <li key={i}>{step.replace(/^Step:\s*\d+\s*/i, '')}</li>)}</ol></details>}
  </div></article>;
}
function Scenario({ title, rows, cost }: { title: string; rows: DBComparison[]; cost: number }) {
  return <div className="quote"><span>{title}</span><strong>{usd(uniqueGIFs(rows) ? cost : 0)}</strong><small>{uniqueGIFs(rows)} GIFs únicos · {rows.length} exercícios Smart Fit · 0 vídeos · 0 imagens</small><small>{cost ? 'Estimativa mensal do plano; não é compra por GIF.' : 'API gratuita · protótipos e uso não comercial.'}</small></div>;
}
export function ExerciseDB({ comparison }: { comparison: ReturnType<typeof useComparison> }) {
  const { rows: sourceRows, loading: sourceLoading, error: sourceError, source, reload } = comparison;
  const [snapshot, setSnapshot] = useState<DBSnapshot>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MatchStatus | ''>('');
  const [group, setGroup] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [limit, setLimit] = useState(12);
  const [includeReview, setIncludeReview] = useState(false);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [requests, setRequests] = useState(20000);
  const [selected, setSelected] = useState<Set<string>>(() => { try { return readDBSelection(localStorage.getItem(selectionKey)); } catch { return new Set(); } });
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    const c = new AbortController(); setLoading(true); setError('');
    fetch(`${import.meta.env.BASE_URL}exercisedb-comparison.json`, { signal: c.signal, cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('Comparação ExerciseDB indisponível.'); return r.json(); }).then((data: DBSnapshot) => {
      if (!Array.isArray(data.rows) || !Array.isArray(data.exercises) || data.exercises.length !== data.catalogTotal) throw new Error('Comparação ExerciseDB inválida.');
      if (!c.signal.aborted) setSnapshot(data);
    }).catch(err => { if (!c.signal.aborted) setError(err instanceof Error ? err.message : 'Falha ao carregar a comparação.'); }).finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [revision]);
  useEffect(() => { try { localStorage.setItem(selectionKey, JSON.stringify([...selected])); } catch { setStorageError('Não foi possível salvar a seleção no navegador; ela permanece nesta sessão.'); } }, [selected]);
  const rows = useMemo(() => snapshot ? joinComparison(sourceRows, snapshot) : [], [sourceRows, snapshot]);
  const totals = useMemo(() => ({ total: rows.length, strong: rows.filter(r => r.match.status === 'Correspondência forte').length, review: rows.filter(r => r.match.status === 'Revisar').length, absent: rows.filter(r => r.match.status === 'Não encontrado').length }), [rows]);
  const groups = useMemo(() => [...new Set(rows.map(r => r.source.group))].sort(), [rows]);
  const filtered = useMemo(() => rows.filter(r => (!status || r.match.status === status) && (!group || r.source.group === group) && (!gapsOnly || r.source.missingImage || r.source.missingVideo) && (!selectedOnly || !!r.exercise && selected.has(r.exercise.exerciseId)) && normalize(`${r.source.id} ${r.source.name} ${r.source.group} ${r.exercise?.name || ''} ${r.exercise?.exerciseId || ''} ${r.exercise?.equipments.join(' ') || ''}`).includes(normalize(search.trim()))), [rows, status, group, gapsOnly, selectedOnly, selected, search]);
  const allEligible = useMemo(() => eligible(rows, includeReview), [rows, includeReview]);
  const missingEligible = useMemo(() => eligible(rows, includeReview, true), [rows, includeReview]);
  const filteredEligible = useMemo(() => eligible(filtered, includeReview, gapsOnly), [filtered, includeReview, gapsOnly]);
  const selectedRows = useMemo(() => rows.filter(r => r.exercise && selected.has(r.exercise.exerciseId)), [rows, selected]);
  const staleCount = rows.filter(r => r.stale).length;
  const unavailableSelections = [...selected].filter(id => !rows.some(r => r.exercise?.exerciseId === id)).length;
  const cost = plan === 'free' ? 0 : proMonthlyCost(requests);
  const toggle = (id: string) => setSelected(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const add = (items: DBComparison[]) => setSelected(old => new Set([...old, ...items.flatMap(r => r.exercise ? [r.exercise.exerciseId] : [])]));
  const exportCsv = () => {
    const unique = [...new Map(selectedRows.filter(r => r.exercise).map(r => [r.exercise!.exerciseId, r.exercise!])).values()];
    const cells = [['ID ExerciseDB', 'Nome', 'IDs Smart Fit', 'Correspondências', 'GIF', 'Fonte', 'Plano simulado', 'Custo mensal do plano USD (não somar por linha)'], ...unique.map(e => [e.exerciseId, e.name, selectedRows.filter(r => r.exercise?.exerciseId === e.exerciseId).map(r => r.source.id).join(' | '), selectedRows.filter(r => r.exercise?.exerciseId === e.exerciseId).map(r => `${r.source.id}: ${r.match.status}`).join(' | '), e.gifUrl, 'AscendAPI https://ascendapi.com', plan, cost.toFixed(2)])];
    const csv = '\uFEFF' + cells.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'selecao-exercisedb.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <section aria-label="Comparação ExerciseDB">
    <header className="cabecalho"><h2>Smart Fit × ExerciseDB</h2><p>Compare a execução atual com os GIFs do catálogo e estime os custos de acesso.</p><div className="linha"><a className="link" href="#exercisedb-exercicios">Comparar exercícios ↓</a><a className="link" href="#exercisedb-orcamento">Simular custos ↓</a></div></header>
    {(error || sourceError || storageError) && <div className="erro" role="alert">{[error, sourceError, storageError].filter(Boolean).join(' ')}{error && <button className="botao" onClick={() => setRevision(n => n + 1)}>Tentar novamente</button>}</div>}
    {staleCount > 0 && <p className="price-warning">{staleCount} registros novos ou alterados aguardam nova análise. Eles estão em “Para revisar” e fora dos cenários elegíveis.</p>}
    <div className="stats">{([['', 'Exercícios', totals.total], ['Correspondência forte', 'Correspondência forte', totals.strong], ['Revisar', 'Para revisar', totals.review], ['Não encontrado', 'Sem correspondência', totals.absent]] as const).map(([s, label, count]) => <button key={s} className={`stat ${status === s ? 'stat-ativo' : ''}`} onClick={() => { setStatus(s); setLimit(12); }}><strong className="stat-valor">{loading || sourceLoading ? '…' : count}</strong><span className="stat-rotulo">{label}</span></button>)}</div>
    <section id="exercisedb-orcamento" className="budget-panel" aria-label="Simulador de custos ExerciseDB"><h2>Simular acesso <small>USD · GIFs únicos · assinatura mensal</small></h2>
      <div className="linha"><label><input type="checkbox" checked readOnly />GIF</label><label><input type="checkbox" disabled />Imagem · não incluída no gratuito</label><label><input type="checkbox" disabled />Vídeo · não incluído no gratuito</label><label><input type="checkbox" checked={includeReview} onChange={e => setIncludeReview(e.target.checked)} />Incluir candidatos para revisão nos cenários e lotes</label></div>
      <div className="linha plan-options"><label>Plano para simular <select className="botao" aria-label="Plano ExerciseDB" value={plan} onChange={e => setPlan(e.target.value as 'free' | 'pro')}><option value="free">Gratuito · US$ 0 · não comercial</option><option value="pro">PRO · US$ 25/mês + excedentes</option></select></label>{plan === 'pro' && <label>Requisições estimadas / mês <input className="botao" aria-label="Requisições por mês" type="number" min="0" step="1000" value={requests} onChange={e => setRequests(Math.max(0, Math.ceil(Number(e.target.value) || 0)))} /></label>}</div>
      <div className="quotes"><Scenario title="Total da base com candidato elegível" rows={allEligible} cost={cost} /><Scenario title="Somente mídias faltantes hoje" rows={missingEligible} cost={cost} /><Scenario title="Minha seleção" rows={selectedRows} cost={cost} /></div>
      <p className="dica">{includeReview ? 'Inclui candidatos para revisão' : 'Somente correspondências fortes'}. GIFs são uma alternativa aos vídeos faltantes; não contam como imagem ou vídeo adquirido. {rows.filter(r => r.source.missingImage).length} imagens e {rows.filter(r => r.source.missingVideo).length} vídeos faltam na base atual. IDs ExerciseDB repetidos contam uma vez.</p>
      <p className="dica">Os três cenários são alternativas e não devem ser somados. O plano PRO custa US$ 25/mês com 20.000 requisições; excedentes a US$ 0,001/requisição. O volume é uma hipótese editável, não deriva da quantidade de GIFs. A cobertura mostrada é do catálogo gratuito; IDs e cobertura do catálogo pago exigem nova validação.</p>
      <div className="linha"><button className="botao" disabled={!allEligible.length} onClick={() => add(allEligible)}>Adicionar total elegível</button><button className="botao" disabled={!missingEligible.length} onClick={() => add(missingEligible)}>Adicionar faltantes</button><button className="botao" disabled={!filteredEligible.length} onClick={() => add(filteredEligible)}>Adicionar filtrados ({uniqueGIFs(filteredEligible)})</button><button className="botao" disabled={!selectedRows.length} onClick={exportCsv}>Exportar seleção CSV</button><button className="link" disabled={!selected.size} onClick={() => setSelected(new Set())}>Limpar seleção</button></div>
      {selectedRows.some(r => r.match.status === 'Revisar') && <p className="price-warning">A seleção inclui candidatos para revisão. Confira execução, equipamento e variante.</p>}
      {unavailableSelections > 0 && snapshot && <p className="price-warning">{unavailableSelections} GIFs salvos não estão presentes nesta análise e não entram no cenário.</p>}
      <details className="pricing"><summary>Preços e regras de acesso</summary><p>Gratuito: 1.500 exercícios com GIFs 180p, sem chave; protótipos e uso não comercial, com crédito obrigatório à AscendAPI. A API tem limites estritos sem cota numérica publicada na documentação OSS. Uso comercial exige plano pago.</p><p>PRO: assinatura mensal, imagens e GIFs 360p/480p e catálogo de 2.000+ exercícios. Não há compra por mídia neste modelo. Consulta em 24/09/2026; sem impostos ou câmbio.</p><a className="link" href={PAID_URL} target="_blank" rel="noreferrer">Preços oficiais RapidAPI ↗</a> · <a className="link" href="https://oss.exercisedb.dev/docs" target="_blank" rel="noreferrer">Condições da API gratuita ↗</a> · <a className="link" href="#plataformas">Comparar plataformas e custos</a></details>
    </section>
    <div id="exercisedb-exercicios" className="toolbar"><div className="linha"><input className="busca" aria-label="Buscar exercício ou ID ExerciseDB" placeholder="Nome em português, inglês ou ID…" value={search} onChange={e => { setSearch(e.target.value); setLimit(12); }} /><button className="botao" disabled={loading || sourceLoading} onClick={() => { reload(); setRevision(n => n + 1); }}>{loading || sourceLoading ? 'Lendo…' : 'Recarregar comparação'}</button></div><div className="linha"><select className="botao" aria-label="Grupo muscular ExerciseDB" value={group} onChange={e => { setGroup(e.target.value); setLimit(12); }}><option value="">Todos os grupos</option>{groups.map(g => <option key={g}>{g}</option>)}</select><label><input type="checkbox" checked={gapsOnly} onChange={e => { setGapsOnly(e.target.checked); setLimit(12); }} />Somente lacunas atuais</label><label><input type="checkbox" checked={selectedOnly} onChange={e => { setSelectedOnly(e.target.checked); setLimit(12); }} />Somente selecionados</label><button className="link" onClick={() => { setSearch(''); setStatus(''); setGroup(''); setGapsOnly(false); setSelectedOnly(false); setLimit(12); }}>Limpar filtros</button></div><p className="dica">{filtered.length} exercícios · {source || 'Carregando base…'}</p><p className="dica">{snapshot ? `Catálogo completo: ${snapshot.catalogTotal} exercícios ExerciseDB · coletado em ${new Date(snapshot.catalogFetchedAt).toLocaleDateString('pt-BR')} · análise gerada em ${new Date(snapshot.generatedAt).toLocaleDateString('pt-BR')}.` : 'Carregando análise ExerciseDB…'} Recarregar relê a análise salva; não refaz as correspondências.</p></div>
    <div className="comparison-grid visual-grid">{filtered.slice(0, limit).map(r => <ExerciseDBCard key={r.source.id} row={r} selected={selected} toggle={toggle} />)}</div>
    {!filtered.length && !loading && !sourceLoading && !error && <p className="vazio">Nenhum exercício corresponde aos filtros.</p>}
    {filtered.length > limit && <button className="botao load-more" onClick={() => setLimit(n => n + 12)}>Mostrar mais 12 ({Math.min(limit, filtered.length)} de {filtered.length})</button>}
    <footer className="dica">Dados e GIFs por <a className="link" href="https://ascendapi.com" target="_blank" rel="noreferrer">AscendAPI</a> · <a className="link" href="https://oss.exercisedb.dev/docs" target="_blank" rel="noreferrer">Documentação e condições de uso</a></footer>
  </section>;
}
