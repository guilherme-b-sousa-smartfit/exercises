"""Prepare native Sheets requests and the app snapshot; never writes to the sources."""
import collections,csv,json
from pathlib import Path
from build_comparison import DATA, ROOT, STATUS

SHEETS={'Resumo':0,'Comparativo':91001,'Lacunas atuais':91002,'Candidatos':91003,'Critérios':91004}
MEDIA_STATUS={'confirmed':'Sim — forte','uncertain':'Revisar','absent':'Não encontrado'}
def level(r): return 'Alta' if r['status']=='confirmed' else ('Média' if r['score']>=65 else 'Baixa') if r['status']=='uncertain' else 'Sem correspondência'
def main():
 data=json.load(open(DATA/'comparison.json')); rows=data['rows']; n=len(rows)
 base=f"https://docs.google.com/spreadsheets/d/{data['baseId']}/edit"
 cat=f"https://docs.google.com/spreadsheets/d/{data['catalogId']}/edit"
 headers=['ID base','Exercício base','Grupo base','Resultado','Índice de confiança (0–100)','Confiança','Justificativa','Imagem no catálogo','ID imagem','Nome imagem','Referência imagem','Vídeo no catálogo','ID vídeo','Nome vídeo','Referência vídeo','GIF no catálogo','ID GIF','Nome GIF','Referência GIF','Equipamento candidato principal','Grupo candidato principal','Alvo candidato principal','Linha base','Imagem atual (URL informada)','Vídeo atual (URL informada)','Vídeo externo atual','Falta imagem atual','Falta vídeo atual','Fonte base','Fonte catálogo','Nome normalizado para busca']
 table=[headers]; gaps=[headers]; candidate_rows=[['ID base','Exercício base','Resultado final','Ordem candidato','Nome candidato','Índice de similaridade (não é probabilidade)','Equipamento','Grupo catálogo','Diferenças / justificativa','Referências no catálogo','Fonte catálogo']]
 for r in rows:
  vals=[r['id'],r['name'],r['group'],STATUS[r['status']],r['score'],level(r),r['reason']]
  for k in ['image','video','gif']:
   m=r['media'][k]
   vals += [MEDIA_STATUS[m['status']],m['id'] if m['status']!='absent' else '',m['name'] if m['status']!='absent' else '',f"{m['tab']}!A{m['row']}:H{m['row']}" if m['row'] and m['status']!='absent' else '']
  best=r['candidates'][0] if r['candidates'] else {}
  vals += [best.get('equipment',''),best.get('body',''),best.get('target',''),r['sourceRow'],r['originalImage'],r['originalVideo'],r['originalExternalVideo'],'Sim' if not r['originalImage'] else 'Não','Sim' if not(r['originalVideo'] or r['originalExternalVideo']) else 'Não',base+f"#gid=1939929300&range=A{r['sourceRow']}:F{r['sourceRow']}",cat,r['query']]
  assert len(vals)==len(headers)
  table.append(vals)
  if vals[26]=='Sim' or vals[27]=='Sim': gaps.append(vals)
  for rank,c in enumerate(r['candidates'],1):
   refs='; '.join(f"{x['tab']}!{x['row']} (ID {x['id']})" for x in c['records'])
   candidate_rows.append([r['id'],r['name'],STATUS[r['status']],rank,c['name'],c['score'],c['equipment'],c['body'],c['reason'],refs,cat])
 end=n+1
 def count(col,text): return f'=COUNTIF(Comparativo!{col}2:{col}{end};"{text}")'
 summary=[['Cobertura pré-compra — Smart Fit × Gym Visual','Quantidade','% da base / universo indicado','Leitura'],
 ['Total de registros da base',f'=COUNTA(Comparativo!A2:A{end})',1,'Uma linha por ID; nomes repetidos preservados.'],
 ['Correspondência forte',count('D',STATUS['confirmed']),'=B3/B2','Cobertura conservadora pelos nomes/metadados; não representa inspeção visual.'],
 ['Não encontrado',count('D',STATUS['absent']),'=B4/B2','Não localizado por este método; não é prova de inexistência no fornecedor.'],
 ['Revisar',count('D',STATUS['uncertain']),'=B5/B2','Não somar como cobertura garantida antes de esclarecer as diferenças.'],
 ['Conferência: soma das três categorias','=SUM(B3:B5)','=B6/B2','Deve ser igual ao total da base.'],
 ['Imagem — correspondência forte',count('H','Sim — forte'),'=B7/B2','Presença na aba Illustrations e equivalência forte.'],
 ['Vídeo — correspondência forte',count('L','Sim — forte'),'=B8/B2','Presença na aba Videos e equivalência forte.'],
 ['GIF — correspondência forte',count('P','Sim — forte'),'=B9/B2','Presença na aba Animated GIFs e equivalência forte. GIF não conta como vídeo.'],
 ['Imagem E vídeo — correspondência forte',f'=COUNTIFS(Comparativo!H2:H{end};"Sim — forte";Comparativo!L2:L{end};"Sim — forte")','=B10/B2','Não soma formatos nem duplica exercícios.'],
 ['Imagem OU vídeo — correspondência forte',f'=B7+B8-B10','=B11/B2','Cobertura nos formatos imagem/vídeo, sem contar somente GIF.'],
 ['', '', '', ''],
 ['Lacunas atuais (URLs ausentes na base)','Quantidade','% do universo indicado','Não verifica se os links existentes funcionam.'],
 ['Exercícios com alguma lacuna',len(gaps)-1,1,'Falta imagem e/ou vídeo na base atual.'],
 ['Sem imagem atual',count('AA','Sim'),'=B15/B2','Percentual da base total. Sem thumbnail_url informado.'],
 ['Sem vídeo atual',count('AB','Sim'),'=B16/B2','Percentual da base total. Sem video_url nem external_video_url.'],
 ['Lacunas de imagem cobertas com confiança alta',f'=COUNTIFS(Comparativo!AA2:AA{end};"Sim";Comparativo!H2:H{end};"Sim — forte")','=B17/B15','Percentual das lacunas de imagem; potencial de completar após compra.'],
 ['Lacunas de vídeo cobertas com confiança alta',f'=COUNTIFS(Comparativo!AB2:AB{end};"Sim";Comparativo!L2:L{end};"Sim — forte")','=B18/B16','Percentual das lacunas de vídeo; potencial de completar após compra.'],
 ['Lacunas de imagem com candidato para revisão',f'=COUNTIFS(Comparativo!AA2:AA{end};"Sim";Comparativo!H2:H{end};"Revisar")','=B19/B15','Não confirmado.'],
 ['Lacunas de vídeo com candidato para revisão',f'=COUNTIFS(Comparativo!AB2:AB{end};"Sim";Comparativo!L2:L{end};"Revisar")','=B20/B16','Não confirmado.'],
 ['', '', '', ''],
 ['Inventário do catálogo pago','Registros','', 'Contagens por aba; os mesmos exercícios podem aparecer em mais de um formato.'],
 ['Illustrations',data['catalogCounts']['Illustrations'],'',''],
 ['Videos',data['catalogCounts']['Videos'],'',''],
 ['Animated GIFs',data['catalogCounts']['Animated GIFs'],'',''],
 ['Data da análise',data['generatedAt'],'','Retrato das bases nesta data. Recarregar a interface não recalcula o matching.'],
 ['Base de exercícios',base,'',''], ['Catálogo pago',cat,'',''],
 ['', '', '', ''],
 ['Grupo','Total','Correspondência forte','Não encontrado','Revisar','% forte']]
 for group in sorted({r['group'] for r in rows}):
  row=len(summary)+1
  summary.append([group,f'=COUNTIF(Comparativo!C2:C{end};A{row})',f'=COUNTIFS(Comparativo!C2:C{end};A{row};Comparativo!D2:D{end};"{STATUS["confirmed"]}")',f'=COUNTIFS(Comparativo!C2:C{end};A{row};Comparativo!D2:D{end};"{STATUS["absent"]}")',f'=COUNTIFS(Comparativo!C2:C{end};A{row};Comparativo!D2:D{end};"{STATUS["uncertain"]}")',f'=C{row}/B{row}'])
 criteria=[['Critério','Definição'],
 ['Objetivo','Estimar a cobertura de execuções antes de comprar o catálogo Gym Visual. Arquivos e URLs pagos não são necessários nesta etapa.'],
 ['Unidade','Cada um dos 1.574 IDs da base aparece exatamente uma vez em Comparativo. Nomes iguais com IDs diferentes são preservados.'],
 ['Fontes','Todas as linhas preenchidas da base e as três abas do Excel: Illustrations, Animated GIFs e Videos.'],
 ['Correspondência forte','Nome equivalente após normalização/tradução, sem diferença explícita de execução, ou correspondência terminológica revisada. É evidência textual forte, não validação visual.'],
 ['Revisar','Há candidato aproximado ou informação insuficiente sobre equipamento, apoio, postura, pegada, unilateralidade, amplitude ou sequência. Não conta como compra garantida.'],
 ['Não encontrado','Não localizado com correspondência suficiente no método. Inclui protocolos/aulas e equipamentos específicos não identificados. Não equivale a afirmar inexistência absoluta.'],
 ['Confiança','Índice heurístico de 0 a 100, NÃO probabilidade estatística: 95 para nome canônico equivalente; 90 para equivalência terminológica revisada; até 84 para candidatos não confirmados. 0 significa não encontrado.'],
 ['Nível','Alta somente para correspondência forte; Média para candidatos com índice ≥65; Baixa para demais candidatos. Índices não medem qualidade ou licença da mídia.'],
 ['Busca','Tradução por dicionário de movimentos/acessórios, normalização de acentos e sinônimos, busca textual por família de movimento e avaliação de equipamento/grupo/qualificadores. Não usa o mapeamento antigo como verdade.'],
 ['Variantes','Unilateral não é automaticamente bilateral; alternado não é simultâneo; inclinado não é reto; apoio em step não é automaticamente banco; amplitude parcial e protocolos 21/HIT não viram execução genérica.'],
 ['Combinações','Dois movimentos separados no catálogo não provam que existe o vídeo da sequência combinada da base.'],
 ['Formatos independentes','Só há Sim — forte para um formato quando uma linha da respectiva aba sustenta a correspondência. IDs de vídeo, imagem e GIF não são fabricados a partir de sufixos.'],
 ['IDs e rastreio','IDs do catálogo são texto para preservar zeros. As referências indicam a aba e linha do Excel. Candidatos permite auditar as aproximações.'],
 ['Catálogo, não reprodução','O Excel contém nomes/IDs/metadados, sem links de mídia. A presença na aba representa oferta catalogada, não arquivo já comprado.'],
 ['Gênero/versão','Gênero do demonstrador e marcação genérica de versão são ignorados no nome canônico; diferenças explicitadas de equipamento, postura e movimento são mantidas. Variantes visuais não descritas continuam sem validação.'],
 ['URLs atuais','Copiadas apenas como referência da base Smart Fit. Sua presença não aumenta a confiança de equivalência com Gym Visual e sua disponibilidade não foi testada.'],
 ['Lacunas atuais','Recorte dos registros sem thumbnail_url e/ou sem ambos video_url e external_video_url. Os percentuais de preenchimento usam os respectivos totais de lacunas.'],
 ['Uso para compra','Use Correspondência forte como estimativa conservadora e envie os casos Revisar ao fornecedor para confirmar variante/ID. A soma de fortes e duvidosos não é cobertura garantida.'],
 ['Limites','Não foi realizada comparação visual dos vídeos pagos. Nomes genéricos, traduções e descrições incompletas podem exigir confirmação adicional. Não encontrado pode conter falso negativo.'],
 ['Atualização','Resumo usa fórmulas vinculadas a Comparativo. Lacunas atuais e Candidatos são retratos da geração; alterações nas fontes exigem nova execução do comparador.'],
 ['Revisão documental','Revisão assistida dos nomes/candidatos; não equivale a validação biomecânica por profissional nem teste de mídia.'],
 ]
 books={'Resumo':summary,'Comparativo':table,'Lacunas atuais':gaps,'Candidatos':candidate_rows,'Critérios':criteria}
 (DATA/'sheet-values.json').write_text(json.dumps(books,ensure_ascii=False))
 # The app starts from this exact published snapshot and can then read the live sheet.
 app={'generatedAt':data['generatedAt'],'catalogCounts':data['catalogCounts'],'headers':headers,'values':table[1:]}
 (ROOT/'compare-app/public/comparison.json').write_text(json.dumps(app,ensure_ascii=False,separators=(',',':')))
 for name,values in books.items():
  with open(DATA/(name+'.csv'),'w',newline='') as f: csv.writer(f,lineterminator='\n').writerows(values)
 print({k:(len(v),max(map(len,v))) for k,v in books.items()})
if __name__=='__main__':main()
