# ExerciseDB V2 — avaliação de acesso gratuito

Consulta: 24/09/2026. Nenhum plano contratado, nenhuma chave RapidAPI disponível, nenhum catálogo V2 baixado.

- GET https://exercisedb.p.rapidapi.com/exercises?limit=1&offset=0: HTTP 401, Invalid API key.
- GET https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises?limit=1&offset=0: HTTP 401, Invalid API key. A autenticação falha antes de validar parâmetros; esta tentativa não confirma suporte a offset.
- Página oficial de preços RapidAPI: BASIC público, hidden=false, preço 0, 2.000 requests/mês com limite hard; Exercise Library Size = 200.
- A visão geral anuncia 11.000+ exercícios e planos gratuitos/pagos, mas o plano comercial consultado restringe a biblioteca gratuita. A página de paginação confirma que limites por plano podem encerrar a navegação antes do catálogo completo.
- Documentação atual: data[] + meta.hasNextPage + meta.nextCursor, enviado como after. Não presumir array simples nem offset.
- A documentação geral e a oferta BASIC divergem quanto à paridade de recursos; usar os limites explícitos do plano e validar a resposta real quando houver chave autorizada.
- A chave MuscleWiki é de outro provedor e não foi enviada ao RapidAPI.

Fontes:
https://docs.ascendapi.com/products/edb-v2/overview
https://docs.ascendapi.com/guides/pagination
https://rapidapi.com/ascendapi/api/edb-with-videos-and-images-by-ascendapi/pricing

Próximo passo sem pagamento: chave própria RapidAPI com assinatura BASIC gratuita para obter os nomes dos até 200 exercícios disponíveis; isso não determina a cobertura da V2 inteira. Não foi encontrado acesso público confirmado ao catálogo integral de nomes.
