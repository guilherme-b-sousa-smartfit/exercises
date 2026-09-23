# Cobertura pré-compra — Smart Fit × Gym Visual

A interface lê a aba **Comparativo** da [planilha De-Para](https://docs.google.com/spreadsheets/d/1r7Mqi8tBFz-qXxyEoWeeaB3bepar8FsgUWA0SYuviKA/edit). Mostra cada ID da base Smart Fit com o resultado, confiança, justificativa e IDs de imagem, vídeo e GIF encontrados nas três abas do catálogo pago.

## Executar

```sh
npm install
npm run dev
npm test
npm run build
```

## Leitura e contagens

- Correspondência forte, Revisar e Não encontrado são categorias exclusivas e somam o total.
- Cada formato tem sua própria presença/confiança. GIF não é contado como vídeo.
- As contagens de lacunas mostram quanto das imagens/vídeos ausentes na base poderia ser preenchido com equivalência forte.
- Filtros: nome/ID em português ou inglês, grupo, resultado, formato e lacunas atuais.
- O botão Recarregar lê o resultado publicado; não refaz a análise das fontes.
- Não exige arquivos ou URLs pagos. Links abrem a linha original ou o catálogo para consulta pelo ID.
- Se a leitura pública pelo `gviz` falhar, usa `public/comparison.json` e exibe um aviso claro com a data da cópia salva. Nenhuma credencial é colocada no navegador.

O índice de 0 a 100 é heurístico, não probabilidade estatística. Correspondência forte é uma conclusão documental pelos nomes/metadados, sem inspeção visual da execução. Revisar não entra na cobertura garantida; Não encontrado pode conter falso negativo.

## Gerar uma nova análise

Veja [matching/README.md](../matching/README.md). O gerador mantém as linhas e IDs da base, consulta o Excel completo e produz a planilha e o snapshot a partir do mesmo resultado. Uma atualização das fontes exige nova geração e publicação; os filtros não executam matching.

O antigo `mapa.json`, os componentes de prévia de mídia e os scripts de enriquecimento foram preservados como histórico. A interface atual não usa seus mapeamentos nem a planilha antiga `1c_ulTtcGmcryAzIyGT3bgavB8tU95W_WhKtu9f6VNRc`.
