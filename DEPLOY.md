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

```bash
uv run --with google-api-python-client --with google-auth python escrever_origem.py
```

Escreve a coluna B (mídia) e a C (flag `fonte · licença`, só nas linhas de fonte externa) nas
duas abas, via a service account `claude-sheets@guilherme-works.iam.gserviceaccount.com`.
