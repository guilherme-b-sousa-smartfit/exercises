# Smart Fit · GymVisual e ExerciseDB

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

O simulador usa a [tabela oficial de preços](https://gymvisual.com/content/6-price-rules), consultada em 23/09/2026:

| Formato | Avulso, abaixo do mínimo | Mínimo para desconto | Unidade com desconto |
| --- | --- | --- | --- |
| Imagem | US$ 3 | 10 | US$ 0,75 |
| GIF | US$ 3,60 | 10 | US$ 0,90 |
| Vídeo | US$ 10 | 5 | US$ 6 |

Ao atingir o mínimo, aplica o valor reduzido a todas as unidades daquele formato. Preço avulso lido no produto tem prioridade sobre o avulso geral. Algumas tabelas de produto apresentam mínimos diferentes: confira a cotação final. Preços reduzidos e mínimos podem ser editados em “Preços e regras”. Limpar o preço de imagem deixa os itens desse formato pendentes, sem escondê-los da soma. Não inclui impostos, câmbio ou negociação de pacotes.

## Fontes e atualização

A leitura ao vivo usa `gviz`; se falhar, o app identifica a cópia salva (`public/comparison.json`) e sua data. Recarregar planilha relê a análise publicada, sem refazer o matching. Veja [matching/README.md](../matching/README.md) para regenerar a análise.

`public/gymvisual-media.json` contém URLs públicas reais do sitemap e das páginas de produtos. Imagens/GIFs são vinculados por título único em inglês normalizado; nomes ambíguos exigem confirmação do ID. Vídeos MP4 e incorporações oficiais do YouTube são extraídos do HTML público e aceitos somente quando a referência SKU coincide exatamente com o ID do catálogo. Nenhuma URL de mídia é construída a partir do ID. Os detalhes do card informam qual vínculo foi usado. Produtos que não puderam ser resolvidos permanecem identificados no relatório, com link de busca no app.

Para atualizar as prévias, na raiz do repositório:

```sh
cd compare-app
npx playwright install chromium
cd ..
node matching/fetch_gymvisual_previews.mjs
```

O coletor retoma os registros já resolvidos, limita concorrência e salva a cada 25 itens. `GYM_CONCURRENCY` permite de 1 a 8 requisições simultâneas (padrão 4). `GYM_SITEMAP` permite reutilizar um XML local. Para atualizar produtos já resolvidos, arquive/remova o índice antes de executar. O índice é estático para funcionar também no build sem servidor ou credenciais; páginas externas podem mudar ou bloquear prévias, caso em que o app oferece o produto oficial.

O produto de vídeo `332212` (Kettlebell deadlift) foi localizado, mas sua página não publica uma prévia reproduzível. O app mostra a capa e o link, identificando essa limitação. Os demais 873 vídeos vinculados têm MP4 ou incorporação pública.

## Bibliotecas e ExerciseDB

O header separa **GymVisual**, **ExerciseDB** e **Comparar plataformas e custos**. A comparação, filtros e seleção GymVisual continuam independentes. ExerciseDB também compara cada ID Smart Fit, com mídia atual à esquerda e GIF candidato à direita; os totais são calculados da sua própria análise, sem reaproveitar classificações GymVisual.

O snapshot `public/exercisedb-comparison.json` contém o catálogo OSS completo e a análise reproduzível por ID Smart Fit. As URLs dos GIFs são as retornadas pela API; os arquivos de mídia não são copiados. O matching compara diretamente os nomes Smart Fit, traduzidos pelo dicionário existente, aos nomes/metadados ExerciseDB. Correspondência forte exige equivalência normalizada sem divergência explícita; variantes, equipamentos e sequências compostas exigem revisão. “Não encontrado” significa não localizado pelo método. Nenhum resultado é uma revisão visual. Nomes/grupos alterados na planilha ficam pendentes e fora dos cenários até regenerar a análise.

A seção oferece busca, filtros por status/grupo/lacunas/seleção, lotes, seleção persistente e CSV. Um ID ExerciseDB é contado uma vez, mesmo que cubra vários IDs Smart Fit. GIFs são uma alternativa a vídeos faltantes; não preenchem a contagem de imagens ou vídeos. Recarregar relê os arquivos e a base, sem executar matching ou coletar novamente o catálogo.

### Atualizar catálogo e análise

Na raiz, com as dependências de `matching/requirements.txt` instaladas:

```sh
python matching/fetch_exercisedb.py
python matching/build_exercisedb_comparison.py
python -m unittest discover -s matching -p 'test_*.py'
```

O coletor requer `curl`, percorre páginas de 25 sequencialmente, espera 5 segundos entre páginas e respeita HTTP 429 com pausa de pelo menos 60 segundos e tentativas limitadas. Um checkpoint permite retomar uma coleta interrompida; somente um catálogo completo substitui o snapshot de entrada. Para iniciar uma coleta nova após uma interrupção, remova `out/comparativo/exercisedb-checkpoint.json`. A geração da comparação usa a mesma base salva de GymVisual (`public/comparison.json`), preservando cada ID e sem alterar fontes remotas.

### Planos e custos ExerciseDB · consulta em 24/09/2026

- **OSS gratuito:** US$ 0, 1.500 exercícios, GIFs 180p, sem autenticação. Protótipos e uso não comercial; atribuição à [AscendAPI](https://ascendapi.com) obrigatória. Limites estritos, sem cota numérica publicada na [documentação OSS](https://oss.exercisedb.dev/docs).
- **PRO V1 no RapidAPI:** US$ 25/mês, 20.000 requisições mensais e US$ 0,001/requisição excedente. Imagens/GIFs 360p e 480p, catálogo de 2.000+ exercícios. [Fonte oficial](https://rapidapi.com/ascendapi/api/edb-with-gifs-and-images-by-ascendapi/pricing). BASIC, ULTRA e MEGA estavam marcados `hidden: true` nos dados públicos da página e não são apresentados como ofertas disponíveis.
- O simulador cobra assinatura, sem multiplicar o preço pela quantidade de GIFs. Os cenários são alternativas, não valores somáveis. Exemplo: 30 mil requisições = US$ 35/mês, antes de impostos/câmbio.
- A simulação paga não troca a mídia gratuita por uma paga, nem confirma cobertura equivalente: os IDs e o catálogo pagos são diferentes e precisam de validação própria. Nenhuma assinatura foi contratada.

## MuscleWiki e ExerciseAPI: comparação de nomes

As abas `#musclewiki` e `#exerciseapi` cruzam todos os 1.574 registros Smart Fit com **amostras parciais das demos públicas**. Exibem nomes lado a lado, justificativas, filtros por grupo/lacunas/status e exportação CSV. Não carregam mídias desses fornecedores. MuscleWiki usa o seletor `pt-br`; ExerciseAPI preserva os nomes originais em inglês. A tradução determinística serve apenas para matching.

Amostras não permitem medir a cobertura de todo o catálogo: “não localizado” significa somente que o método não encontrou equivalência na amostra. Correspondências fortes são textuais, não validação de execução. Sugestões para revisão não entram no percentual forte. Nenhum match altera a base Smart Fit.

Para atualizar (Python com `matching/requirements.txt` instalado):

```sh
node matching/fetch_musclewiki_demo.mjs
python matching/build_musclewiki_comparison.py
node matching/fetch_exerciseapi_demo.mjs
python matching/build_exerciseapi_comparison.py
```

Execute a partir da raiz do repositório. As coletas reproduzem consultas públicas da demo, em quantidade limitada; não usam rotas pagas, chaves alheias, paginação oculta ou arquivos de mídia. ExerciseAPI: 20 buscas por movimentos e 12 categorias, com deduplicação. MuscleWiki: amostragem aleatória por equipamento. As coletas são datadas; regenere para uma análise atual. Não trate os arquivos como catálogo redistribuível nem publique estes snapshots como serviço de dados.

A chave MuscleWiki autorizada pelo usuário fica em `.env` local ignorado pelo Git, sem prefixo `VITE_`. Não é utilizada pelo frontend. O teste direto retornou 403 por plano BASIC (Playground apenas); o acesso via demo é público. Não foi criado plano ou conta ExerciseAPI.

Preços consultados em 24/09/2026: [MuscleWiki](https://api.musclewiki.com/pricing), [ExerciseAPI](https://exerciseapi.dev/#pricing). A tela compara cotas mensais MuscleWiki e diárias ExerciseAPI. Estimativa ExerciseAPI usa 30 dias de volume diário constante; respeita a trava de 10× da cota paga e não apresenta orçamento executável acima desse limite.

## Interface simplificada (30/09/2026)

A tela mostra somente GymVisual, com busca pelos títulos Smart e GymVisual e
intervalo de similaridade de 0% a 100%, com limites inclusivos. A busca aceita
trechos, palavras fora de ordem, espaços extras e ignora acentos e caixa.
Não há orçamento, seleções de compra ou seleção de formatos.
Vídeos entram em reprodução automática, sem som, em loop, perto da área visível;
saem da reprodução fora dela. Controles nativos permitem pausar e ouvir.
O scroll acrescenta 12 exercícios quando faltam aproximadamente 1.200 px para o
fim. Busca e intervalo são combinados e reiniciam a paginação.
A origem da estimativa é indicada como títulos ou frames revisados.

A revisão inicial conferiu um frame de cada vídeo em 1.240 pares acessíveis.
Um frame não verifica amplitude ou sequência completa. Outros 130 pares tinham
falha de extração; registros sem par acessível mantêm a estimativa textual.

Verificações: `npm test`, `npm run build` e, com o Vite em 5173 e Chrome instalado,
`node tests/simple-ui.browser.mjs`. O teste de navegador verifica busca, intervalo,
scroll antecipado, autoplay, layout mobile e aba exclusiva GymVisual.
