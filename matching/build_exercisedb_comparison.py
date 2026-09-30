"""Compare every Smart Fit ID directly to ExerciseDB; GymVisual decisions are never reused."""
import collections, datetime, json
from build_comparison import ROOT, canonical, family, differences
from title_similarity import TitleIndex

BODY = {'Pernas': {'upper legs', 'lower legs'}, 'MMII': {'upper legs', 'lower legs'}, 'Dorsal': {'back'}, 'Lombar': {'back', 'waist', 'upper legs'}, 'Ombro': {'shoulders', 'back'}, 'Peitoral': {'chest', 'upper arms'}, 'Bíceps': {'upper arms', 'lower arms'}, 'Tríceps': {'upper arms', 'chest'}, 'Abdômen': {'waist'}, 'Cardio': {'cardio', 'upper legs'}}
EQUIPMENT_NAMES = {'leverage machine': 'Leverage machine', 'smith machine': 'Smith machine', 'ez barbell': 'Barbell'}

def prepare(exercises):
    return [{**e, '_canon': canonical(e['name']), '_family': family(canonical(e['name'])), 'equipment': ', '.join(EQUIPMENT_NAMES.get(v, v) for v in e['equipments'])} for e in exercises]

def match(name, group, catalog, title_index=None):
    query = canonical(name, True)
    fam = family(query)
    if group in {'Hit', 'Aulas'}:
        return {'status': 'Não encontrado', 'score': 0, 'candidateId': None, 'reason': 'Aula ou protocolo específico: uma demonstração isolada não confirma equivalência.', 'query': query}
    pool = {i: e['_canon'] for i, e in enumerate(catalog) if not fam or e['_family'] == fam}
    title_index = title_index or TitleIndex({i:e['_canon'] for i,e in enumerate(catalog)})
    choices = []
    for _, similarity, i in title_index.search(query, pool if fam else ()):
        e = catalog[i]
        if not set(query.split()) & set(e['_canon'].split()): continue
        dif = differences(query, e)
        family_conflict=bool(fam and family(e['_canon']) and fam != family(e['_canon']))
        if family_conflict: dif.append('família de movimento divergente')
        bodyok = group not in BODY or bool(BODY[group] & set(e['bodyParts']))
        if not bodyok: dif.append('grupo muscular divergente: ' + group + ' × ' + ', '.join(e['bodyParts']))
        exact = query == e['_canon'] and bodyok and not dif and '+' not in name
        score = 95 if exact else min(84, max(0, round(similarity - 4 * len(dif) - (20 if not bodyok else 0) - (18 if any(d.startswith('equipamento:') for d in dif) else 0))))
        if family_conflict: score=min(score,45)
        reason = '; '.join(dif) or ('Nome equivalente após tradução e normalização, sem diferença explícita.' if exact else 'Nome semelhante; execução e variante precisam de revisão.')
        if '+' in name: reason = 'Sequência combinada: conferir todos os movimentos e transições. ' + reason
        choices.append({'status': 'Correspondência forte' if exact else 'Revisar', 'score': score, 'candidateId': e['exerciseId'], 'reason': reason, 'query': query})
    choices.sort(key=lambda c: (c['status'] == 'Correspondência forte', c['score']), reverse=True)
    if not choices or choices[0]['score'] < 52:
        return {'status': 'Não encontrado', 'score': 0, 'candidateId': None, 'reason': 'Não localizado pelo método de comparação de nomes, equipamento, grupo e variantes. Isso não comprova ausência no catálogo.', 'query': query}
    return choices[0]

def build():
    data = json.loads((ROOT / 'out/comparativo/exercisedb-catalog.json').read_text())
    snapshot = json.loads((ROOT / 'compare-app/public/comparison.json').read_text())
    h = snapshot['headers']
    catalog = prepare(data['exercises'])
    title_index=TitleIndex({i:e['_canon'] for i,e in enumerate(catalog)})
    rows = []
    for values in snapshot['values']:
        def value(key): return str(values[h.index(key)]).strip()
        eid, name, group = value('ID base'), value('Exercício base'), value('Grupo base')
        rows.append({'id': eid, 'name': name, 'group': group, **match(name, group, catalog, title_index)})
    assert len(rows) == len({r['id'] for r in rows})
    result = {'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'catalogFetchedAt': data['fetchedAt'], 'source': data['source'], 'attribution': data['attribution'], 'baseGeneratedAt': snapshot['generatedAt'], 'catalogTotal': len(catalog), 'counts': dict(collections.Counter(r['status'] for r in rows)), 'exercises': data['exercises'], 'rows': rows}
    (ROOT / 'compare-app/public/exercisedb-comparison.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
    print(json.dumps(result['counts'], ensure_ascii=False))

if __name__ == '__main__': build()
