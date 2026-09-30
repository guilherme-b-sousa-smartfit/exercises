import {useEffect,useMemo,useRef,useState} from 'react';
import {reviewFields,type ReviewFields,type ReviewRow,type useReviewSheet} from '../hooks/useReviewSheet';
import {Preview} from './Preview';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function playable(raw:string):{src?:string;type:'video'|'embed';link?:string}{
 if(!raw)return {type:'video'};
 try{const u=new URL(raw);if(!['https:','http:'].includes(u.protocol))return {type:'video'};
 const host=u.hostname.replace(/^www\./,'');
 if(['youtube.com','youtu.be','youtube-nocookie.com'].includes(host)){const id=host==='youtu.be'?u.pathname.slice(1):u.pathname.startsWith('/embed/')||u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:u.searchParams.get('v');if(id&&/^[\w-]{11}$/.test(id))return {src:`https://www.youtube-nocookie.com/embed/${id}`,type:'embed',link:raw};return {type:'video',link:raw};}
 if(host==='gymvisual.com'&&!u.pathname.startsWith('/img/vid/'))return {type:'video',link:raw};
 return {src:raw,type:'video',link:raw};
 }catch{return {type:'video'};}
}
type Draft={base:ReviewFields;values:ReviewFields};
export function SimpleComparison({comparison}:{comparison:ReturnType<typeof useReviewSheet>}){
 const [query,setQuery]=useState(''),[min,setMin]=useState(0),[max,setMax]=useState(100),[limit,setLimit]=useState(12);
 const [drafts,setDrafts]=useState<Record<number,Draft>>({}),[saving,setSaving]=useState<Record<number,boolean>>({}),[messages,setMessages]=useState<Record<number,{text:string;error:boolean}>>({});
 const [password,setPassword]=useState(''),[loginOpen,setLoginOpen]=useState(false),[loginError,setLoginError]=useState(''),[loggingIn,setLoggingIn]=useState(false);
 const sentinel=useRef<HTMLDivElement>(null),saveLocks=useRef(new Set<number>());
 const dirty=Object.keys(drafts).length>0;
 useEffect(()=>{const protect=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',protect);return()=>window.removeEventListener('beforeunload',protect);},[dirty]);
 const rows=useMemo(()=>{const terms=normalize(query).split(' ').filter(Boolean);return comparison.rows.filter(r=>r.score>=min&&r.score<=max&&terms.every(t=>normalize(`${r.name} ${r.gymNamePt} ${r.gymName} ${r.replacementTitle}`).includes(t))).sort((a,b)=>Number(a.validated)-Number(b.validated)||a.order-b.order);},[comparison.rows,query,min,max]);
 useEffect(()=>setLimit(12),[query,min,max]);
 useEffect(()=>{if(limit>=rows.length)return;const observer=new IntersectionObserver(([e])=>{if(e.isIntersecting)setLimit(n=>Math.min(n+12,rows.length));},{rootMargin:'1200px'});if(sentinel.current)observer.observe(sentinel.current);return()=>observer.disconnect();},[limit,rows.length]);
 const edit=(row:ReviewRow,patch:Partial<ReviewFields>)=>{if(row.id===null)return;setDrafts(ds=>{const d=ds[row.id!]||{base:reviewFields(row),values:reviewFields(row)};return {...ds,[row.id!]:{...d,values:{...d.values,...patch}}};});};
 const save=async(row:ReviewRow,patch:Partial<ReviewFields>={})=>{if(row.id===null||saveLocks.current.has(row.id))return;const id=row.id,d=drafts[id]||{base:reviewFields(row),values:reviewFields(row)},values={...d.values,...patch};saveLocks.current.add(id);setDrafts(ds=>({...ds,[id]:{...d,values}}));setSaving(s=>({...s,[id]:true}));setMessages(s=>({...s,[id]:{text:'Salvando na planilha…',error:false}}));
  try{await comparison.save(id,d.base,values);setDrafts(ds=>{const next={...ds};delete next[id];return next;});setMessages(s=>({...s,[id]:{text:'Salvo na planilha',error:false}}));}
  catch(e){setMessages(s=>({...s,[id]:{text:e instanceof Error?e.message:'Falha ao salvar.',error:true}}));}
  finally{saveLocks.current.delete(id);setSaving(s=>({...s,[id]:false}));}
 };
 const discard=(id:number)=>{setDrafts(ds=>{const next={...ds};delete next[id];return next;});setMessages(s=>{const next={...s};delete next[id];return next;});void comparison.reload();};
 return <section aria-label="Comparação GymVisual">
  <div className="review-access"><span>{comparison.canEdit?'Revisão liberada':'Visualização da planilha'}</span><div><button type="button" onClick={()=>void comparison.reload()}>Atualizar</button>{comparison.canEdit?<button type="button" onClick={()=>void comparison.logout().catch(e=>setLoginError(e.message))}>Sair da revisão</button>:<button type="button" onClick={()=>setLoginOpen(v=>!v)}>Entrar para revisar</button>}</div></div>
  {loginOpen&&!comparison.canEdit&&<form className="review-login" onSubmit={async e=>{e.preventDefault();setLoggingIn(true);setLoginError('');try{await comparison.login(password);setPassword('');setLoginOpen(false);}catch(e){setLoginError(e instanceof Error?e.message:'Falha ao entrar.');}finally{setLoggingIn(false);}}}><label>Senha de revisão<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button disabled={loggingIn}>{loggingIn?'Entrando…':'Entrar'}</button></form>}
  {loginError&&<p role="alert" className="erro">{loginError}</p>}
  <div className="similarity-filter"><label className="exercise-search">Buscar exercício<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busque por parte do título" autoComplete="off" spellCheck={false}/></label><div className="similarity-heading"><strong>Similaridade</strong><output>{min}% – {max}%</output></div><div className="range-controls"><label>De {min}%<input aria-label="Similaridade mínima" type="range" min="0" max="100" value={min} onChange={e=>setMin(Math.min(Number(e.target.value),max))}/></label><label>Até {max}%<input aria-label="Similaridade máxima" type="range" min="0" max="100" value={max} onChange={e=>setMax(Math.max(Number(e.target.value),min))}/></label></div><small>{rows.length} exercícios · Ordem da planilha; validados no fim.</small></div>
  {comparison.error&&<p role="alert" className="erro">{comparison.error} {comparison.rows.length>0?'Exibindo a última leitura; atualize antes de revisar.':''}</p>}
  {comparison.loading&&<p role="status">Carregando a planilha…</p>}
  <div className="simple-grid">{rows.slice(0,limit).map(row=>{const id=row.id,d=id===null?undefined:drafts[id],values=d?.values||reviewFields(row),busy=id!==null&&saving[id],message=id===null?undefined:messages[id];const smart=playable(row.smartVideo),original=playable(row.gymVideo),replacement=playable(values.replacementVideo);return <article className={`simple-card ${row.validated?'is-validated':''}`} key={id??`unlinked-${row.order}`} data-review-id={id??undefined}>
   <header><div><small>Linha {row.rowNumber}{row.validated?' · Validado':''}</small><h2>{row.name}</h2></div><strong className="similarity-score" title="Estimativa de equivalência registrada na planilha">{Math.round(row.score)}%<small>similaridade</small></strong></header>
   <div className="before-after"><section><h3>Smart Fit</h3><Preview {...smart} label={row.name}/></section><section><h3>{values.replacementVideo?'Vídeo substituto':'GymVisual'}</h3><Preview {...(values.replacementVideo?replacement:original)} label={values.replacementTitle||row.gymNamePt||row.gymName}/></section></div>
   <div className="candidate-titles"><p className="title-pt">{row.gymNamePt||'Sem candidato identificado'}</p><p className="title-en" lang="en">{row.gymName}</p>{values.replacementVideo&&<><p className="replacement-title">Substituto: {values.replacementTitle||'Sem título informado'}</p>{original.link&&<a href={original.link} target="_blank" rel="noreferrer">Ver vídeo GymVisual original ↗</a>}</>}</div>
   <fieldset className="review-fields" disabled={!comparison.canEdit||!!busy||id===null||!!comparison.error}><legend>Revisão do professor</legend><label className="validated-control"><input type="checkbox" checked={values.validated} onChange={e=>void save(row,{validated:e.target.checked})}/>Validado</label><label>Comentários<textarea rows={2} maxLength={5000} value={values.comments} onChange={e=>edit(row,{comments:e.target.value})} placeholder="Observações sobre a comparação"/></label><label>Título do vídeo substituto<input type="text" maxLength={500} value={values.replacementTitle} onChange={e=>edit(row,{replacementTitle:e.target.value})}/></label><label>Vídeo substituto<input type="url" maxLength={2048} value={values.replacementVideo} onChange={e=>edit(row,{replacementVideo:e.target.value})} placeholder="https://…"/></label><div className="review-actions"><button type="button" onClick={()=>void save(row)} disabled={!d||!!busy}>{busy?'Salvando…':'Salvar revisão'}</button>{d&&id!==null&&<button type="button" className="secondary" onClick={()=>discard(id)}>Descartar alterações</button>}</div></fieldset>
   {!comparison.canEdit&&<small>Entre para validar, comentar ou substituir o vídeo.</small>}{id===null&&<p className="erro">Exercício novo sem vínculo de revisão. Atualize a integração.</p>}{message&&<p role={message.error?'alert':'status'} className={message.error?'erro':'save-status'}>{message.text}</p>}{d&&!busy&&!message?.error&&<small>Alterações ainda não salvas.</small>}
  </article>;})}</div>
  <div ref={sentinel} className="scroll-sentinel" role="status">{!comparison.loading&&(rows.length===0?'Nenhum exercício encontrado. Ajuste a busca ou a porcentagem.':limit<rows.length?'Carregando mais exercícios…':`${rows.length} exercícios exibidos`)}</div>
 </section>;
}
