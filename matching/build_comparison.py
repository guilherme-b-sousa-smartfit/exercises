"""Reproducible, conservative comparison of Smart Fit rows against all Gym Visual tabs.
Scores are rule scores, NOT calibrated probabilities. Media availability means catalog listing.
No Gym Visual media URLs are inferred. Source IDs and row identities are preserved.
"""
from __future__ import annotations
import argparse, collections, json, re, unicodedata
from pathlib import Path
from rapidfuzz import fuzz, process

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'out/comparativo'
TABS = {'Videos': 'video', 'Illustrations': 'image', 'Animated GIFs': 'gif'}
STATUS = {'confirmed': 'Correspondência forte', 'uncertain': 'Revisar', 'absent': 'Não encontrado'}

def norm(s):
    return re.sub(r'\s+', ' ', ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if not unicodedata.combining(c))).strip()

# Longest phrases are replaced first; execution qualifiers are retained.
PHRASES = {
'flexao de bracos':'push up', 'flexao de braco':'push up', 'flexao aberta':'wide push up',
'flexao diamante':'diamond push up', 'flexao tocando ombro':'push up shoulder tap',
'cadeira extensora':'lever leg extension', 'cadeira flexora':'lever seated leg curl',
'mesa flexora':'lever lying leg curl', 'cadeira abdutora':'lever seated hip abduction',
'cadeira adutora':'lever seated hip adduction', 'flexao do joelho':'leg curl',
'flexao de joelho':'leg curl', 'flexao nortica':'nordic hamstring curl',
'elevacao pelvica':'hip thrust', 'levantamento terra':'deadlift',
'elevacao frontal':'front raise', 'elevacao lateral':'lateral raise',
'crucifixo inverso':'reverse fly', 'remada alta articulada':'lever high row','remada alta articulado':'lever high row','remada alta':'upright row', 'remada cavalinho':'t bar row',
'remada serrote':'one arm bent over row', 'remada baixa':'seated row',
'rosca martelo':'hammer curl', 'rosca scott':'preacher curl', 'rosca concentrada':'concentration curl',
'rosca punho supinada':'wrist curl', 'rosca punho pronada':'reverse wrist curl', 'rosca direta':'biceps curl', 'rosca simultanea':'biceps curl', 'biceps maquina':'lever biceps curl', 'rosca 45 graus':'incline curl', 'rosca martelo 45 graus':'incline hammer curl', 'abdominal escalador':'mountain climber', 'remada cavalinho':'t bar row', 'triceps graviton':'assisted triceps dip', 'triceps polia':'cable triceps pushdown', 'supino reto':'flat bench press',
'barra fixa':'pull up', 'barra w':'ez barbell', 'barra romana':'neutral grip barbell',
'barra h':'neutral grip barbell', 'barra reta':'barbell',
'gluteo 4 apoios':'kneeling hip extension', 'gluteo coice':'hip kickback',
'gluteo polia':'cable hip extension', 'triceps testa':'lying triceps extension',
'polia testa':'cable lying triceps extension', 'triceps frances':'overhead triceps extension',
'polia frances':'cable overhead triceps extension', 'triceps coice':'triceps kickback',
'polia corda':'cable rope', 'triceps banco':'bench dip', 'triceps paralela':'triceps dip',
'abdominal infra suspensao':'hanging leg raise', 'abdominal infra paralela':'captains chair leg raise',
'abdominal com roda':'wheel rollout', 'abdominal canivete':'v up', 'abdominal remador':'sit up',
'abdominal bicicleta':'bicycle crunch', 'abdominal tesoura':'scissor kicks',
'abdominal twist':'russian twist', 'abdominal curto':'crunch',
'abdominal supra reto':'crunch', 'abdominal supra':'crunch',
'abdominal infra':'leg raise', 'abdominal obliquo':'side crunch',
'rotacao de tronco':'twist', 'rotacao tronco':'twist',
'flexao de quadril':'hip flexion', 'extensao de quadril':'hip extension',
'abducao de quadril':'hip abduction', 'aducao de quadril':'hip adduction',
'flexao lateral de tronco':'side bend', 'inclinacao lateral':'side bend',
'manguito polia interno':'cable shoulder internal rotation',
'manguito polia externo':'cable shoulder external rotation',
'moinho de vento':'windmill', 'volta ao mundo':'around world',
'levantamento turco':'turkish get up', 'bom dia':'good morning',
'cachorro baixo':'downward dog', 'pose da crianca':'child pose',
'saudacao ao sol':'sun salutation', 'toque de escapula':'scapular push up',
'circunducao de ombro':'arm circles', 'circundacao de ombro':'arm circles',
'circunducao de punho':'wrist circles', 'circundacao de tornozelo':'ankle circles',
'rotacao interna e externa de quadril':'hip internal external rotation',
'cross over':'cable crossover', 'salto grupado':'tuck jump', 'agachamento no bosu':'bosu ball squat', 'prancha isometrica':'plank', 'rolinho de joelhos':'kneeling rollout', 'kneeling roll out':'kneeling rollout',
'roll out':'rollout', 'em pe':'standing', 'de joelhos':'kneeling',
'6 apoios':'quadruped', '4 apoios':'quadruped', 'no chao':'floor',
'na rua':'outdoor', 'deitado':'lying', 'decubito lateral':'side lying',
'escada de agilidade':'agility ladder', 'chapeu chines':'cone',
'corda naval':'battling rope', 'com cinto':'belt', 'estacao multipla':'cable',
'estacao multi':'cable', 'estacao articulada':'lever', 'perna estendida':'straight leg',
'pernas estendidas':'straight legs', 'joelho flexionado':'bent knee',
'joelho flex':'bent knee', 'joelhos flexionados':'bent knees',
'bracos estendidos':'straight arms', 'braco estendido':'straight arm',
'com apoio':'supported', 'com suporte':'supported', 'com rotacao':'twisting',
'joelhos':'kneeling', 'peck deck':'lever pec deck fly', 'hack machine':'sled hack squat',
'supino livre':'barbell bench press', 'lombar maquina':'lever back extension',
'hiperextensao lombar':'back extension', 'hiperextensao reversa':'reverse hyperextension',
'hiperextensao maquina':'lever back extension', 'agachamento pendulo':'lever pendulum squat',
'corrida na rua':'outdoor running', 'bicicleta na rua':'outdoor cycling',
}
WORDS = {
'remada':'row','agachamento':'squat','abdominal':'crunch','supino':'bench press',
'desenvolvimento':'shoulder press','rosca':'curl','crucifixo':'fly','puxada':'pulldown',
'afundo':'split squat','avanco':'forward lunge','retrocesso':'reverse lunge','stiff':'stiff leg deadlift',
'gemeos':'calf raise','encolhimento':'shrug','hiperextensao':'hyperextension',
'prancha':'plank','escalador':'mountain climber','polichinelo':'jumping jack','perdigueiro':'bird dog',
'halter':'dumbbell','halteres':'dumbbell','barra':'barbell','polia':'cable','maquina':'lever',
'articulado':'lever','articulada':'lever','guiado':'smith','guiada':'smith','trx':'suspension',
'graviton':'assisted','rubber':'band','elastico':'band','caneleira':'ankle weight',
'bola':'stability ball','pliobox':'box','corda':'rope','triangulo':'v bar',
'sentado':'seated','sentada':'seated','curvada':'bent over','curvado':'bent over',
'unilateral':'unilateral','unipodal':'unilateral','alternado':'alternating','alternada':'alternating',
'alternadas':'alternating','alternando':'alternating','simultaneo':'bilateral','simultanea':'bilateral',
'fechado':'close grip','fechada':'close grip','aberto':'wide grip','aberta':'wide grip',
'supinada':'reverse grip','supinado':'reverse grip','pronada':'overhand grip',
'neutra':'neutral grip','neutro':'neutral grip','inverso':'reverse','inversa':'reverse',
'invertido':'reverse','invertida':'reverse','inclinado':'incline','declinado':'decline',
'reto':'flat','reta':'straight','frontal':'front','frente':'front','atras':'behind',
'alta':'high','alto':'high','baixa':'low','baixo':'low','media':'middle',
'ajoelhado':'kneeling','solo':'floor','banco':'bench','ombro':'shoulder','ombros':'shoulder',
'braco':'arm','bracos':'arms','perna':'leg','pernas':'legs','quadril':'hip','tronco':'trunk',
'joelho':'knee','pes':'feet','mao':'hand','maos':'hands','punho':'wrist',
'obliquo':'oblique','scissor':'scissor','reverencia':'good morning','rotacao':'twisting','extensao':'extension','flexao':'flexion','abducao':'abduction','aducao':'adduction',
'isometrico':'hold','isometrica':'hold','isometria':'hold','insistencia':'pulse','insistido':'pulse',
'salto':'jump','saltar':'jump','saltito':'hop','pliometrico':'plyometric','profundo':'deep',
'cortador':'woodchop','tesoura':'scissor','borboleta':'butterfly','diamante':'diamond',
'nadador':'swimmer','natacao':'swimming','corrida':'running','bicicleta':'cycling',
'esteira':'treadmill','eliptico':'elliptical','escada':'stair','subida':'step up',
'escorpiao':'scorpion','gato':'cat stretch','alongamento':'stretch','mobilidade':'mobility',
'scott':'preacher','frances':'overhead triceps extension','testa':'lying triceps extension',
'serratil':'serratus','tibial':'tibialis','gluteo':'hip extension','coice':'kickback',
'freemotion':'cable','sumo':'sumo','nortica':'nordic','pendulo':'pendulum','graus':'degrees',
'caminhada':'walking','tocando':'touch','toque':'touch','sustentacao':'hold','reversa':'reverse',
'meio':'half','meia':'half','curto':'short','completo':'full','lombar':'back',
'estendida':'straight','estendido':'straight','estendidos':'straight','estendidas':'straight',
'flexionada':'bent','flexionado':'bent','ombros':'shoulder',
}
STOP = set('com de do da dos das no na nos nas em o a os as ao para por e the on with at of to and an a male female version versions grip'.split())

def canonical(s, portuguese=False):
    s = norm(s)
    if portuguese:
        for a,b in sorted(PHRASES.items(), key=lambda p:-len(p[0])):
            s = re.sub(r'(?<!\w)'+re.escape(a)+r'(?!\w)',b,s)
        s = ' '.join(WORDS.get(t,t) for t in re.findall(r'[a-z0-9]+|\+',s))
    s = re.sub(r'\([^)]*(?:male|female|version)[^)]*\)', ' ',s)
    for a,b in [('single arm','unilateral'),('one arm','unilateral'),('single leg','unilateral leg'),('one leg','unilateral leg'),('single-leg','unilateral leg'),('single-arm','unilateral'),('one-arm','unilateral'),('one-leg','unilateral leg'),('alternate','alternating'),('alternated','alternating'),('chest press','bench press'),('military press','shoulder press'),('bent-over','bent over'),('push-up','push up'),('sit-up','sit up'),('pull-up','pull up'),('pull down','pulldown'),('pull-down','pulldown'),('legged','leg'),('stiff-legged','stiff leg'),('stiff legged','stiff leg'),('ez-bar','ez barbell'),('v-bar','v bar'),('t-bar','t bar'),('3-4','3/4'),('rear lunge','reverse lunge'),('parallel grip','neutral grip'),('underhand','reverse'),('alternative','alternating'),('twisted','twisting'),('suspender','suspension'),('revers ','reverse '),('attachment',''),('hip thrusts','hip thrust'),('calves','calf'),('reverse-grip','reverse grip'),('neutral-grip','neutral grip')]:
        s=s.replace(a,b)
    s=re.sub(r'\b(?:version|versions)\s*\d+','',s)
    tokens=set(re.findall(r'[a-z0-9]+|\+',s))-STOP
    if 'curl' in tokens: tokens.discard('biceps'); tokens.discard('bicep')
    if {'bench','press'}<=tokens: tokens.discard('flat')
    if 'unilateral' in tokens and ('squat' in tokens or 'deadlift' in tokens or 'thrust' in tokens): tokens.discard('leg')
    if 'alternating' not in tokens: tokens.discard('bilateral') # default bilateral; unilateral and alternating always retained
    return ' '.join(sorted(tokens))

def family(s):
    t=set(s.split())
    # Most specific patterns first, so reverse fly is never accepted as chest fly.
    patterns=[('reverse fly',{'reverse','fly'}),('upright row',{'upright','row'}),('calf',{'calf'}),('leg curl',{'leg','curl'}),('leg extension',{'leg','extension'}),('hip extension',{'hip','extension'}),('hip thrust',{'hip','thrust'}),('hip abduction',{'abduction'}),('hip adduction',{'adduction'}),('shoulder press',{'shoulder','press'}),('bench press',{'bench','press'}),('leg press',{'leg','press'}),('front raise',{'front','raise'}),('lateral raise',{'lateral','raise'}),('triceps',{'triceps'}),('pulldown',{'pulldown'}),('pull up',{'pull','up'}),('push up',{'push','up'}),('deadlift',{'deadlift'}),('row',{'row'}),('squat',{'squat'}),('lunge',{'lunge'}),('curl',{'curl'}),('fly',{'fly'}),('plank',{'plank'}),('crunch',{'crunch'}),('leg raise',{'leg','raise'}),('sit up',{'sit','up'}),('v up',{'v','up'}),('mountain climber',{'mountain','climber'}),('rollout',{'rollout'}),('dip',{'dip'}),('shrug',{'shrug'}),('back extension',{'back','extension'}),('hyperextension',{'hyperextension'}),('burpee',{'burpee'}),('swing',{'swing'}),('thruster',{'thruster'}),('snatch',{'snatch'}),('clean',{'clean'}),('twist',{'twist'}),('jumping jack',{'jumping','jack'}),('jump',{'jump'}),('step up',{'step','up'}),('running',{'running'}),('cycling',{'cycling'}),('treadmill',{'treadmill'}),('elliptical',{'elliptical'}),('stretch',{'stretch'})]
    return next((n for n,ts in patterns if ts<=t),'')

BODY = {'Pernas':{'Thighs','Hips','Calves'},'MMII':{'Thighs','Hips','Calves'},'Dorsal':{'Back'},'Lombar':{'Back','Hips'},'Ombro':{'Shoulders','Back'},'Peitoral':{'Chest','Upper Arms'},'Bíceps':{'Upper Arms','Forearms'},'Tríceps':{'Upper Arms','Chest'},'Abdômen':{'Waist','Hips','Plyometrics'},'Cardio':{'Cardio','Thighs'}}
QUALIFIERS=set('unilateral alternating seated standing kneeling lying incline decline flat wide close reverse neutral overhand high low middle rope v ez t 45 90 30 60 0 front behind hold pulse step box bosu suspension band smith cable dumbbell barbell kettlebell lever ankle weight sandbag doublegrip supported twisting sumo stiff deep partial jump plank'.split())
EQUIPMENT = {'dumbbell':'Dumbbell','barbell':'Barbell','cable':'Cable','kettlebell':'Kettlebell','suspension':'Suspension','smith':'Smith machine','lever':'Leverage machine','band':'Band','bosu':'Bosu ball','sandbag':'Sandbag','doublegrip':'Doublegrip'}

def differences(query, item):
    a,b=set(query.split()),set(item['_canon'].split())
    dif=[]
    expected={v for k,v in EQUIPMENT.items() if k in a}
    actual=item['equipment']
    if expected and not any(e.lower() in actual.lower() or (e=='Band' and 'band' in actual.lower()) for e in expected):
        dif.append('equipamento: '+', '.join(sorted(expected))+' × '+actual)
    missing=sorted((a-b)&QUALIFIERS)
    extra=sorted((b-a)&QUALIFIERS)
    if missing: dif.append('não descrito no candidato: '+', '.join(missing))
    if extra: dif.append('variação adicional no candidato: '+', '.join(extra))
    return dif


def build():
    base=json.load(open(DATA/'base.json'))['values'][1:]
    catalog=json.load(open(DATA/'catalogo.json'))
    for x in catalog:
        x['_canon']=canonical(x['name'])
        x['_family']=family(x['_canon'])
    # Group exact metadata across gender/version; retain every original row for provenance.
    grouped={}
    for x in catalog:
        key=(x['_canon'],x['equipment'],x['body'])
        grouped.setdefault(key,[]).append(x)
    reps=[rows[0] for rows in grouped.values()]
    by_family=collections.defaultdict(list)
    for i,x in enumerate(reps): by_family[x['_family']].append(i)
    overrides=json.load(open(ROOT/'matching/reviewed_matches.json')) if (ROOT/'matching/reviewed_matches.json').exists() else {}
    output=[]
    for row_num,r in enumerate(base,2):
        r=list(r)+['']*max(0,6-len(r))
        eid,name,group,image,video,external=r[:6]
        query=canonical(name,True)
        fam=family(query)
        pool=by_family[fam] if fam else list(range(len(reps)))
        matches=process.extract(query,{i:reps[i]['_canon'] for i in pool},scorer=fuzz.token_sort_ratio,limit=45,score_cutoff=32)
        candidates=[]
        for _,sim,i in matches:
            x=reps[i]
            dif=differences(query,x)
            bodyok=group not in BODY or bool(BODY[group]&set(x['body'].split(', ')))
            if not bodyok: dif.append('grupo muscular divergente: '+group+' × '+x['body'])
            score=max(0, round(sim-4*len(dif)-(20 if not bodyok else 0)-(18 if any(d.startswith('equipamento:') for d in dif) else 0)))
            if not fam and not (set(query.split()) & set(x['_canon'].split())): continue
            exact=query==x['_canon'] and bodyok and not dif
            if str(eid) in {'6649','6738','7226','7976'}: exact=False; dif.append('Nome genérico/ambíguo: validar modalidade ou variante antes da compra.')
            # Exact canonical labels support equivalence. Non-exact results always await review.
            status='confirmed' if exact else 'uncertain'
            if not exact: score=min(84,score)
            if exact: score=95
            if str(eid) in {'6558','7976','6649','7226','6738'}: status='uncertain'; score=min(score,75)
            candidates.append({'score':score,'status':status,'reason':'; '.join(dif) or ('Nome equivalente após tradução e normalização, sem diferença explícita.' if exact else 'Nome semelhante; equivalência da execução ainda não confirmada.'),'query':query,'item':x,'records':grouped[(x['_canon'],x['equipment'],x['body'])]})
        if group in {'Hit','Aulas'}: candidates=[]
        candidates.sort(key=lambda c:(c['status']=='confirmed',c['score']),reverse=True)
        ov=overrides.get(str(eid))
        if ov:
            approved_canon={canonical(n) for n in ov['names']}
            selected=[x for x in catalog if x['_canon'] in approved_canon]
            if not selected: raise ValueError('Reviewed candidate missing '+eid)
            c={'score':ov['score'],'status':ov.get('status','confirmed'),'reason':ov['reason'],'query':query,'item':selected[0],'records':selected}
            candidates=[c]+[x for x in candidates if x['item']['name'] not in ov['names']]
        best=candidates[0] if candidates else None
        # Protocols/classes and absent equipment cannot be covered by a generic demonstration.
        unsupported=group in {'Hit','Aulas'} or any(t in query.split() for t in ['doublegrip','sandbag'])
        compound='+' in name
        status=best['status'] if best and best['score']>=52 else 'absent'
        reason=best['reason'] if best else 'Nenhum candidato com similaridade mínima.'
        if unsupported:
            status='absent'
            reason='Protocolo/aula específica não identificada no catálogo.' if group in {'Hit','Aulas'} else 'Equipamento específico não consta no campo Equipment do catálogo; variantes não contam como equivalentes.'
        elif compound and (not best or best['status']!='confirmed'):
            status='uncertain' if best and best['score']>=52 else 'absent'
            reason='Sequência combinada: confirmar TODOS os movimentos e a transição. '+reason
        if status=='absent' and not unsupported:
            reason='Não foi encontrada correspondência suficientemente próxima pelos nomes e metadados. '+reason
        # Each media format must be supported by its own row, never an inferred ID suffix.
        media={}
        for tab,key in TABS.items():
            choices=[]
            for c in candidates:
                for x in c['records']:
                    if x['tab']==tab: choices.append((c,x))
            choices.sort(key=lambda z:(z[0]['status']=='confirmed',z[0]['score']),reverse=True)
            if choices:
                c,x=choices[0]
                state='confirmed' if status=='confirmed' and c['status']=='confirmed' else ('uncertain' if status!='absent' and c['score']>=52 else 'absent')
                media[key]={'status':state,'score':c['score'] if state!='absent' else 0,'id':x['id'],'name':x['name'],'tab':tab,'row':x['row'],'equipment':x['equipment'],'body':x['body'],'target':x['target'],'reason':c['reason']}
            else: media[key]={'status':'absent','score':0,'id':'','name':'','tab':tab,'row':'','equipment':'','body':'','target':'','reason':'Nenhum candidato nesta aba.'}
        # Overall status is derived from actually offered image/video/GIF equivalence.
        if status=='confirmed' and not any(m['status']=='confirmed' for m in media.values()): status='uncertain'
        output.append({'id':str(eid),'name':name,'group':group,'sourceRow':row_num,'status':status,'score':best['score'] if status!='absent' else 0,'reason':reason,'query':query,'originalImage':image,'originalVideo':video,'originalExternalVideo':external,'media':media,'candidates':[{'name':c['item']['name'],'score':c['score'],'reason':c['reason'],'equipment':c['item']['equipment'],'body':c['item']['body'],'records':[{k:x[k] for k in ['id','tab','row','name']} for x in c['records']]} for c in candidates[:3]]})
    counts=dict(collections.Counter(x['status'] for x in output))
    result={'generatedAt':'2026-09-23','baseId':'1mgP0qbvTjSUWhV777RP13kTn7aj-aMR9H9jjjQfBE-E','catalogId':'1RMmqNGdAmlKWrk7TJsYJRhhsyaacGkRx','destinationId':'1r7Mqi8tBFz-qXxyEoWeeaB3bepar8FsgUWA0SYuviKA','counts':counts,'catalogCounts':dict(collections.Counter(x['tab'] for x in catalog)),'rows':output}
    assert len(output)==len(base) and len({r['id'] for r in output})==len(base)
    assert sum(counts.values())==len(base)
    for r in output:
        if r['status']=='confirmed': assert any(m['status']=='confirmed' for m in r['media'].values())
    (DATA/'comparison.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps(counts,ensure_ascii=False))
    with open(DATA/'review.txt','w') as f:
        for x in output:
            f.write(f"{x['id']} | {x['status']} {x['score']} | {x['name']} => {x['candidates'][0]['name'] if x['candidates'] else ''} | {x['reason']}\n")
    return result

if __name__=='__main__': build()
