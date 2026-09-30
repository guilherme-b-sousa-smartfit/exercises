# Comparação pré-compra

Compara **cada ID** Smart Fit às três abas do catálogo pago Gym Visual. A ausência de arquivos pagos não é uma falha: a oferta de cada formato é determinada pela aba de origem, e a confiança mede a equivalência textual da execução.

- `extract_catalog.py`: leitura completa do Excel, preservando abas, linhas e IDs.
- `build_comparison.py`: tradução/normalização, busca por família e diferenças de equipamento, posição e variante.
- `reviewed_matches.json`: decisões terminológicas explícitas por ID, incluindo rebaixamentos de nomes ambíguos. Não são revisões visuais.
- `prepare_sheet.py`: valores da planilha, CSVs auditáveis e snapshot da interface.
- `test_comparison.py`: integridade dos IDs, formatos e casos perigosos de falsa equivalência.

## Reprodução

Use Python 3.9+ em ambiente virtual e instale `requirements.txt`. As entradas são `out/comparativo/base.json` (resposta values do Google Sheets) e `out/comparativo/catalogo.json` (todas as linhas do Excel, incluindo aba e número de linha). O Excel original fica em `gym-visual.xlsx`.

```sh
python matching/extract_catalog.py out/comparativo/gym-visual.xlsx out/comparativo/catalogo.json
python matching/build_comparison.py
python matching/prepare_sheet.py
python -m unittest discover -s matching -p 'test_*.py'
```

Os scripts não alteram planilhas remotas. `sheet-values.json` contém os blocos para publicação pelo conector Google Sheets. Publique somente no destino `1r7Mqi8tBFz-qXxyEoWeeaB3bepar8FsgUWA0SYuviKA`, após ler seus dados/metadados atuais. Não escreva nas fontes. `write-*.json` registra os lotes desta publicação, não é seguro reaplicá-los sem nova leitura.

## Critério conservador

95 indica equivalência de termos normalizados; 90 indica equivalência terminológica revisada. Nenhum índice é probabilidade estatística. Candidatos até 84 são **Revisar**; não entram na cobertura forte. **Não encontrado** significa não localizado pelo método, nunca inexistência comprovada. Gênero/versão genérica do demonstrador não diferencia a execução; qualificadores explícitos são preservados. A normalização é determinística, não um tradutor geral: descrições fora do dicionário podem produzir falsos negativos ou candidatos ruins, que precisam de revisão.

O sistema não soma GIF como vídeo, não inventa IDs por sufixo, não mistura fontes antigas e não confirma sequências compostas usando só um dos movimentos. O resumo contém também o ganho potencial nas URLs ausentes da base, sem verificar se URLs já preenchidas funcionam.

A comparação não é atualizada automaticamente quando as fontes mudam. Gere novamente a partir de novas leituras. Os totais do Resumo são fórmulas vinculadas ao Comparativo; as abas Lacunas atuais e Candidatos são recortes da geração.

## Prévias públicas e custos no compare-app

`fetch_gymvisual_previews.mjs` resolve os produtos do sitemap oficial por nome em inglês e confere o SKU ao extrair vídeos. O arquivo `compare-app/public/gymvisual-media.json` registra as URLs observadas, método de vínculo e pendências. Ele não altera o matching nem a confiança, e não baixa arquivos pagos. Veja o [README do app](../compare-app/README.md) para coleta, seleção e regras de preço.

## ExerciseDB V1

`fetch_exercisedb.py` coleta o catálogo OSS completo por cursor, com pausas e checkpoint. `build_exercisedb_comparison.py` compara cada ID da base salva `compare-app/public/comparison.json` diretamente à ExerciseDB, reutilizando apenas o dicionário de tradução e as regras de variantes. Decisões revisadas e classificações GymVisual não são reutilizadas. A saída `compare-app/public/exercisedb-comparison.json` contém contagens, candidatos, justificativas e URLs originais de GIFs; mídia não é baixada. Veja o README do app para reprodução, atribuição e custos.

## Amostras textuais: MuscleWiki e ExerciseAPI

`fetch_musclewiki_demo.mjs` coleta nomes pt-br da demo aleatória. `fetch_exerciseapi_demo.mjs` reproduz buscas públicas por movimento/categoria. Os respectivos scripts `build_*_comparison.py` comparam cada registro Smart Fit diretamente à amostra e conservam `complete: false`. Não persistem vídeo, imagem, instruções ou credenciais. Não localizado na amostra não comprova ausência no catálogo. Execute novamente a coleta e geração para atualizar a análise datada; não exponha as amostras como catálogo de terceiros.

## Comparação ampliada e revisão visual

A busca combina três estratégias de recuperação textual (ordem de palavras,
conjuntos e correspondência aproximada) com toda a família de movimento, sem
usar a família como exclusão rígida. O ranking combina sobreposição de termos
ponderados pela raridade no catálogo e similaridade de caracteres. Diferenças
explícitas de equipamento, família, grupo, postura e unilateralidade reduzem a
pontuação. Sinônimos PT/EN e flexões são normalizados; combinações continuam
exigindo equivalência de todos os movimentos.

`prepare_sheet.py` também gera `video-scores.json`: a interface usa a pontuação
do vídeo exibido, não a pontuação global de outro formato. O snapshot local é a
fonte primária para evitar que a planilha antiga substitua a nova análise.

`extract_review_frames.py` extrai um frame real em 1 segundo de cada URL de vídeo
Smart Fit e prévia Gym Visual disponível. Requer FFmpeg e Pillow. O cache é por
hash da URL e a execução pode ser retomada. `out/visual-review/pairs.json` registra
IDs, títulos, URLs e caminhos; as folhas de contato permitem conferir os pares.
A extração não produz uma avaliação visual automática. Somente pares efetivamente
inspecionados recebem uma avaliação em `compare-app/public/visual-reviews.json`.
Essa avaliação é invalidada se mudar o título, candidato ou qualquer URL.
Um frame permite comparar postura, equipamento e apoio; não confirma toda a
amplitude, cadência ou sequência do vídeo. A porcentagem é uma estimativa de
similaridade, não probabilidade calibrada nem validação humana.
