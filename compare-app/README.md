# Smart Fit × Gym Visual

Comparação visual antes/depois e simulador de compra, alimentados pela aba **Comparativo** da [planilha](https://docs.google.com/spreadsheets/d/1r7Mqi8tBFz-qXxyEoWeeaB3bepar8FsgUWA0SYuviKA/edit).

## Executar

```sh
npm install
npm run dev
npm test
npm run build
```

## Comparar e selecionar

- Cada exercício mostra a imagem/vídeo atual ao lado da prévia pública do candidato Gym Visual. Alterne entre imagem, GIF e vídeo. Vídeos só carregam ao clicar em reproduzir.
- As prévias são as publicadas pelo fornecedor, inclusive marcas d'água. Não são arquivos comprados.
- Correspondência forte, Revisar e Não encontrado continuam independentes da disponibilidade de mídia. O índice é heurístico, não uma probabilidade. Ver o produto não confirma que ele equivale ao exercício original.
- Busca por nome em português, inglês ou ID; filtros por resultado, grupo, lacunas e seleção.
- Marque formatos por exercício ou adicione um lote (total, faltantes ou filtrados). Lotes usam correspondências fortes por padrão; a inclusão de candidatos incertos é explícita.
- A seleção fica no navegador e pode ser exportada em CSV. Não altera o carrinho do fornecedor nem efetua compra.
- Um mesmo ID de mídia usado por vários exercícios é cobrado uma vez. Formatos diferentes são itens distintos. Selecionar GIF e vídeo para a mesma lacuna soma os dois.

## Preços

O simulador usa US$ 0,90/GIF após 10 itens e US$ 6/vídeo após 5 itens, conforme informado. A interpretação conservadora inicial é **11 GIFs / 6 vídeos**, editável em “Preços e regras”. O banner e as tabelas dos produtos apresentam mínimos diferentes, portanto o valor é uma estimativa e deve ser conferido na cotação.

Abaixo do mínimo, utiliza apenas o preço avulso efetivamente lido no produto. Sem preço verificado, o item aparece como pendência. O preço de imagem começa sem valor e pode ser informado. A soma conhecida nunca oculta itens sem preço. Descontos são calculados por formato; não inclui impostos, câmbio ou negociação de pacotes.

## Fontes e atualização

A leitura ao vivo usa `gviz`; se falhar, o app identifica a cópia salva (`public/comparison.json`) e sua data. Recarregar planilha relê a análise publicada, sem refazer o matching. Veja [matching/README.md](../matching/README.md) para regenerar a análise.

`public/gymvisual-media.json` contém URLs públicas reais do sitemap e das páginas de produtos. Imagens/GIFs são vinculados por título único em inglês normalizado; nomes ambíguos exigem confirmação do ID. Vídeos são extraídos do HTML público e aceitos somente quando a referência SKU coincide exatamente com o ID do catálogo. Nenhuma URL de mídia é construída a partir do ID. Os detalhes do card informam qual vínculo foi usado. Produtos que não puderam ser resolvidos permanecem identificados no relatório, com link de busca no app.

Para atualizar as prévias, na raiz do repositório:

```sh
cd compare-app
npx playwright install chromium
cd ..
node matching/fetch_gymvisual_previews.mjs
```

O coletor retoma os registros já resolvidos, limita concorrência e salva a cada 25 itens. `GYM_CONCURRENCY` permite de 1 a 8 requisições simultâneas (padrão 4). `GYM_SITEMAP` permite reutilizar um XML local. Para atualizar produtos já resolvidos, arquive/remova o índice antes de executar. O índice é estático para funcionar também no build sem servidor ou credenciais; páginas externas podem mudar ou bloquear prévias, caso em que o app oferece o produto oficial.
