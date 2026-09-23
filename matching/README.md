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
