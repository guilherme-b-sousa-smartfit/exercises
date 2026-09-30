"""Text-only de/para against a Portuguese demo sample, never complete catalog coverage."""
import collections, datetime, json
from build_comparison import ROOT, canonical, family, differences, norm
from title_similarity import TitleIndex

CATEGORIES = {'barra de pesos': 'Barbell', 'halteres': 'Dumbbell', 'cabos': 'Cable', 'maquina': 'Leverage machine', 'maquinas': 'Leverage machine', 'maquina smith': 'Smith machine', 'faixa': 'Band', 'band': 'Band', 'kettlebells': 'Kettlebell', 'kettlebell': 'Kettlebell', 'trx': 'Suspension', 'peso corporal': 'Body weight'}

def match(name, group, exercises, title_index=None):
    query = canonical(name, True)
    fam = family(query)
    if group in {'Aulas', 'Hit'}:
        return {'status': 'Não encontrado', 'candidateId': None, 'score': 0, 'reason': 'Aula ou protocolo não pode ser confirmado por uma demonstração isolada.'}
    pool = {i: e['_canon'] for i, e in enumerate(exercises) if not fam or family(e['_canon']) == fam}
    title_index = title_index or TitleIndex({i:e['_canon'] for i,e in enumerate(exercises)})
    choices = []
    for _, sim, i in title_index.search(query, pool if fam else ()):
        e = exercises[i]
        dif = differences(query, e)
        family_conflict=bool(fam and family(e['_canon']) and fam != family(e['_canon']))
        if family_conflict: dif.append('família de movimento divergente')
        exact = query == e['_canon'] and not dif and '+' not in name
        score = 95 if exact else min(84, max(0, round(sim - len(dif)*5 - (18 if any(d.startswith('equipamento:') for d in dif) else 0))))
        if family_conflict: score=min(score,45)
        reason = '; '.join(dif) or ('Nome equivalente após normalização dos termos em português; conferir execução.' if exact else 'Semelhança textual; equipamento e execução precisam de revisão.')
        if '+' in name: reason = 'Sequência combinada: conferir todos os movimentos. ' + reason
        choices.append({'status': 'Correspondência forte' if exact else 'Revisar', 'candidateId': e['id'], 'score': score, 'reason': reason})
    choices.sort(key=lambda c: (c['status'] == 'Correspondência forte', c['score']), reverse=True)
    if not choices or choices[0]['score'] < 60:
        return {'status': 'Não encontrado', 'candidateId': None, 'score': 0, 'reason': 'Não localizado nesta amostra da demo. A cobertura no catálogo completo permanece desconhecida.'}
    return choices[0]

def build():
    data = json.loads((ROOT/'out/comparativo/musclewiki-demo.json').read_text())
    base = json.loads((ROOT/'compare-app/public/comparison.json').read_text())
    catalog = [{**e, '_canon': canonical(e['name'], True), 'equipment': CATEGORIES.get(norm(e['category']), e['category'])} for e in data['exercises']]
    h=base['headers']
    title_index=TitleIndex({i:e['_canon'] for i,e in enumerate(catalog)})
    rows=[]
    for r in base['values']:
        eid, name, group = [str(r[h.index(k)]).strip() for k in ['ID base', 'Exercício base', 'Grupo base']]
        rows.append({'id': eid, 'name': name, 'group': group, **match(name, group, catalog, title_index)})
    result={**data, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'rows': rows, 'counts':dict(collections.Counter(r['status'] for r in rows))}
    # Metadata only: never persist API keys, streaming URLs, video, images, or instructions.
    (ROOT/'compare-app/public/musclewiki-comparison.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
    print(json.dumps({'sample':len(catalog), **result['counts']},ensure_ascii=False))
if __name__=='__main__': build()
