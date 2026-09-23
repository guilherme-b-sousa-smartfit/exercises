# Publicação

| O quê | Onde |
|---|---|
| App de conferência | https://guilherme-b-sousa-smartfit.github.io/exercises/ |
| Mídia externa (URL raw usada na planilha) | `midia/` na branch `main` |
| Build publicado | branch `gh-pages` |

## Republicar o app

```bash
cd compare-app && npm install && npx vite build
cd /tmp && rm -rf ghp && git clone -q --depth 1 https://github.com/guilherme-b-sousa-smartfit/exercises.git ghp
cd ghp && git config credential.https://github.com.username guilherme-b-sousa-smartfit
git checkout -q --orphan gh-pages && git rm -rq --cached .
find . -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} +
cp -R /Users/guibais/Documents/smartfit/exercises/compare-app/dist/. . && touch .nojekyll
git add -A && git commit -q -m "Atualiza app" && git push -f origin gh-pages
```

O `credential.https://github.com.username` é necessário porque o `includeIf` do `~/.gitconfig`
só vale dentro de `~/Documents/smartfit/` — um clone em `/tmp` pega a credencial pessoal e
o push é recusado com 403.

O `vite.config.ts` usa `base: "./"`, então o mesmo build serve no subcaminho do Pages e local.

## Regravar a planilha

Destino atual: [Cópia de Exercicios sem midia](https://docs.google.com/spreadsheets/d/1c_ulTtcGmcryAzIyGT3bgavB8tU95W_WhKtu9f6VNRc/edit).
As abas `thumbnail` (33249298) e `videos` (908896634) recebem o lote novo.
`thumbnail v1` e `Videos v1` são o histórico e não são alteradas.

A planilha nova exige autenticação (o endpoint público `gviz` retorna 401).
O app está configurado localmente, mas a leitura ao vivo no Pages depende de acesso
público de leitura ou de uma integração autenticada. O preenchimento via conector funciona.

```bash
uv run --with google-api-python-client --with google-auth python escrever_origem.py
uv run --with google-api-python-client --with google-auth python escrever_origem.py --aplicar
```

A primeira execução salva uma prévia; `--aplicar` preenche somente células de mídia vazias.
Usa `out/mapa-v2.json`: coluna B com URL e nota de correspondência/pendência; coluna C com
`fonte · licença` para fontes externas. Preserva cabeçalhos, URLs existentes e formatação.
A escrita usa a service account `claude-sheets@guilherme-works.iam.gserviceaccount.com`.
`escrever_planilha.py` é uma entrada alternativa para o mesmo fluxo.

## Completar a aba Videos

```bash
uv run --with google-api-python-client --with google-auth python completar_videos.py
```

Compara a aba `thumbnail` com a `videos` e **acrescenta** as linhas que existem na primeira e
faltam na segunda, já com o GIF do de-para. Idempotente: se não houver o que inserir, não escreve.

Execute apenas quando quiser acrescentar exercícios à lista de vídeos. O preenchimento do
lote v2 preserva as listas recebidas, sem acrescentar linhas.
