import { ExerciseAPICosts } from './ExerciseAPICosts';
import { useEffect, useMemo, useState } from 'react';
import type { useComparison } from '../hooks/useComparison';
import type { MatchStatus } from '../lib/comparison';
export const muscleWikiPlans = [
  { name: 'BASIC', price: 0, quota: 500, detail: 'Somente Playground; sem API direta.' },
  { name: 'TESTING', price: 10, quota: 1000, detail: 'API direta em inglês; exercícios e vídeos.' },
  { name: 'GROWTH', price: 39.99, quota: 30000, detail: 'API em 14 idiomas, incluindo pt-br.' },
  { name: 'PROFESSIONAL', price: 99.99, quota: 100000, detail: 'Inclui rotinas, treinos e mapas musculares.' },
  { name: 'ENTERPRISE', price: 199.99, quota: 300000, detail: 'Recursos completos e maior cota.' },
];
type Entry = { id: string | number; name: string; category: string; primaryMuscles: string[] };
type Match = { id: string; name: string; group: string; status: MatchStatus; candidateId: string | number | null; score: number; reason: string };
type Snapshot = { fetchedAt: string; complete: false; exercises: Entry[]; rows: Match[] };
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const usd = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
export function MuscleWiki({ comparison, provider = 'musclewiki' }: { comparison: ReturnType<typeof useComparison>; provider?: 'musclewiki' | 'exerciseapi' }) {
  const isMW = provider === 'musclewiki';
  const title = isMW ? 'MuscleWiki' : 'ExerciseAPI';
  const language = isMW ? 'Português (BR)' : 'Inglês (nomes originais)';
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MatchStatus | ''>('');
  const [group, setGroup] = useState('');
  const [gapsOnly, setGapsOnly] = useState(false);
  const [limit, setLimit] = useState(50);
  const [planName, setPlanName] = useState('GROWTH');
  const [calls, setCalls] = useState(1000);
  const plan = muscleWikiPlans.find(p => p.name === planName)!;
  useEffect(() => {
    const c = new AbortController(); setError('');
    fetch(`${import.meta.env.BASE_URL}${provider}-comparison.json`, { signal: c.signal, cache: 'no-store' }).then(r => { if (!r.ok) throw new Error('De/para indisponível.'); return r.json(); }).then((value: Snapshot) => {
      if (!Array.isArray(value.rows) || !Array.isArray(value.exercises) || value.complete !== false) throw new Error('Formato da análise inválido.');
      if (!c.signal.aborted) setData(value);
    }).catch(err => { if (!c.signal.aborted) setError(err instanceof Error ? err.message : 'Não foi possível carregar a análise.'); });
    return () => c.abort();
  }, [revision, provider]);
  const rows = useMemo(() => {
    if (!data) return [];
    const matches = new Map(data.rows.map(r => [r.id, r]));
    const catalog = new Map(data.exercises.map(e => [e.id, e]));
    return comparison.rows.map(source => {
      const saved = matches.get(source.id);
      const stale = !saved || saved.name !== source.name || saved.group !== source.group;
      const match: Match = stale ? { id: source.id, name: source.name, group: source.group, status: 'Revisar', score: 0, candidateId: null, reason: 'Registro novo ou alterado; regenerar o de/para.' } : saved;
      return { source, match, candidate: match.candidateId !== null ? catalog.get(match.candidateId) : undefined };
    });
  }, [data, comparison.rows]);
  const strong = rows.filter(r => r.match.status === 'Correspondência forte').length;
  const review = rows.filter(r => r.match.status === 'Revisar').length;
  const absent = rows.filter(r => r.match.status === 'Não encontrado').length;
  const groups = [...new Set(rows.map(r => r.source.group))].sort();
  const filtered = rows.filter(r => (!status || r.match.status === status) && (!group || r.source.group === group) && (!gapsOnly || r.source.missingImage || r.source.missingVideo) && normalize(`${r.source.id} ${r.source.name} ${r.candidate?.id ?? ''} ${r.candidate?.name || ''}`).includes(normalize(search.trim())));
  const exportCsv = () => {
    const cells = [['ID Smart Fit', 'Nome Smart Fit', 'ID plataforma', 'Nome plataforma', 'Resultado na amostra', 'Índice heurístico', 'Motivo'], ...filtered.map(r => [r.source.id, r.source.name, r.candidate?.id ?? '', r.candidate?.name ?? '', r.match.status === 'Não encontrado' ? 'Não localizado na amostra' : r.match.status, r.match.score, r.match.reason])];
    const csv = '\uFEFF' + cells.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `depara-${provider}-amostra.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return <section aria-label={`Comparação ${title}`}>
    <header className="cabecalho"><h2>Smart Fit × {title}</h2><p>De/para dos nomes da base atual com os exercícios da demo pública · {language}.</p></header>
    {(error || comparison.error) && <div className="erro" role="alert">{error || comparison.error}{error && <button className="botao" onClick={() => setRevision(n => n + 1)}>Tentar novamente</button>}</div>}
    <div className="purchase-summary"><p><strong>Cobertura observada na amostra: {rows.length ? `${strong} de ${rows.length} (${(strong / rows.length * 100).toFixed(1).replace('.', ',')}%)` : 'carregando…'}.</strong></p><p>{data?.exercises.length ?? '…'} nomes únicos obtidos da demo. {isMW ? 'A demo retorna exercícios aleatórios, sem listagem completa.' : 'A amostra reúne buscas por movimentos e categorias; não representa o catálogo inteiro.'} {review} candidatos precisam de revisão; {absent} não foram localizados na amostra. A cobertura do catálogo completo permanece desconhecida.</p><p className="dica">“Correspondência forte” indica equivalência textual, sem revisão visual. Os itens não localizados na amostra podem existir no catálogo completo.</p><a className="link" href={isMW ? 'https://api.musclewiki.com/#demo' : 'https://exerciseapi.dev/#demo'} target="_blank" rel="noreferrer">Abrir demo {isMW ? '· selecione Português (BR)' : ''} ↗</a></div>
    <div className="stats">{([['', 'Exercícios Smart Fit', rows.length], ['Correspondência forte', 'Correspondência forte', strong], ['Revisar', 'Para revisar', review], ['Não encontrado', 'Não localizados na amostra', absent]] as const).map(([s, label, count]) => <button key={s} className={`stat ${status === s ? 'stat-ativo' : ''}`} onClick={() => { setStatus(s); setLimit(50); }}><strong className="stat-valor">{data && !comparison.loading ? count : '…'}</strong><span className="stat-rotulo">{label}</span></button>)}</div>
    {isMW ? <section className="budget-panel" aria-label="Custos MuscleWiki"><h2>Planos e custos <small>USD · mensal · consulta em 24/09/2026</small></h2><div className="linha"><label>Plano <select className="botao" value={planName} aria-label="Plano MuscleWiki" onChange={e => setPlanName(e.target.value)}>{muscleWikiPlans.map(p => <option key={p.name}>{p.name}</option>)}</select></label><label>Chamadas estimadas / mês <input className="botao" type="number" min="0" value={calls} aria-label="Chamadas MuscleWiki por mês" onChange={e => setCalls(Math.max(0, Math.ceil(Number(e.target.value) || 0)))} /></label></div><div className="quotes"><div className="quote"><span>Assinatura mensal</span><strong>{usd(plan.price)}</strong><small>{plan.detail}</small></div><div className="quote"><span>Cota incluída</span><strong>{plan.quota.toLocaleString('pt-BR')}</strong><small>Chamadas/mês. Não é preço por exercício.</small></div><div className="quote"><span>Volume estimado: {calls.toLocaleString('pt-BR')} chamadas</span><strong>{calls > plan.quota ? 'Excede a cota' : 'Dentro da cota'}</strong><small>Sem cobrança de excedentes: a API bloqueia com HTTP 429 ao atingir o limite.</small></div></div><p className="dica">BASIC: US$ 0, somente Playground. TESTING: US$ 10/1.000 chamadas, inglês. GROWTH: US$ 39,99/30.000, inclui pt-br. PROFESSIONAL: US$ 99,99/100.000. ENTERPRISE: US$ 199,99/300.000. Anual: 25% de desconto, cobrado antecipadamente. Uso comercial incluído nos planos pagos.</p><p className="dica">A chave informada está no plano BASIC e foi recusada para acesso direto. Este de/para usa somente a demo pública, sem autenticação. Não contratamos plano nem carregamos vídeos.</p><a className="link" href="https://api.musclewiki.com/pricing" target="_blank" rel="noreferrer">Preços oficiais ↗</a> · <a className="link" href="https://api.musclewiki.com/documentation" target="_blank" rel="noreferrer">Documentação ↗</a></section> : <ExerciseAPICosts />}
    <div className="toolbar"><div className="linha"><input className="busca" aria-label={`Buscar depara ${title}`} placeholder={`Nome Smart Fit, nome ${title} ou ID…`} value={search} onChange={e => { setSearch(e.target.value); setLimit(50); }} /><select className="botao" aria-label={`Grupo muscular ${title}`} value={group} onChange={e => { setGroup(e.target.value); setLimit(50); }}><option value="">Todos os grupos</option>{groups.map(g => <option key={g}>{g}</option>)}</select><label><input type="checkbox" checked={gapsOnly} onChange={e => { setGapsOnly(e.target.checked); setLimit(50); }} />Somente lacunas atuais</label></div><div className="linha"><button className="botao" disabled={!filtered.length} onClick={exportCsv}>Exportar de/para CSV</button><button className="link" onClick={() => { setSearch(''); setStatus(''); setGroup(''); setGapsOnly(false); setLimit(50); }}>Limpar filtros</button><span className="dica">{filtered.length} registros · {language} · {data ? new Date(data.fetchedAt).toLocaleDateString('pt-BR') : 'Carregando…'}</span></div></div>
    <div className="table-scroll platforms"><table><thead><tr><th>Smart Fit · hoje</th><th>{title} · {language}</th><th>Resultado na amostra</th></tr></thead><tbody>{filtered.slice(0, limit).map(r => <tr key={r.source.id}><td><strong>{r.source.name}</strong><p className="dica">#{r.source.id} · {r.source.group}</p></td><td>{r.candidate ? <><strong>{r.candidate.name}</strong><p className="dica">#{r.candidate.id} · {r.candidate.category}</p></> : r.match.status === 'Revisar' ? 'De/para pendente de atualização' : 'Não localizado na amostra'}</td><td><span className={`badge ${r.match.status === 'Correspondência forte' ? 'badge-A' : 'badge-C'}`}>{r.match.status === 'Não encontrado' ? 'Cobertura desconhecida' : r.match.status}</span><details><summary>Justificativa · {r.match.score}/100</summary><p>{r.match.reason}</p></details></td></tr>)}</tbody></table></div>
    {!filtered.length && data && <p className="vazio">Nenhum exercício corresponde aos filtros.</p>}{filtered.length > limit && <button className="botao load-more" onClick={() => setLimit(n => n + 50)}>Mostrar mais 50 ({limit} de {filtered.length})</button>}
    {isMW && <footer className="dica">Exercise data and videos provided by <a className="link" href="https://musclewiki.com" target="_blank" rel="noreferrer">MuscleWiki.com</a>. Esta seção exibe somente nomes e metadados textuais.</footer>}
  </section>;
}
