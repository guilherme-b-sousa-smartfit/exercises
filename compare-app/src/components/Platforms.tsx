export const PAID_URL = 'https://rapidapi.com/ascendapi/api/edb-with-gifs-and-images-by-ascendapi/pricing';
export function Platforms() {
  return <section className="budget-panel platforms" aria-label="Plataformas e custos">
    <h2>Como funciona cada biblioteca</h2><p className="dica">Fontes oficiais consultadas em 24/09/2026 · USD · sem impostos ou conversão cambial.</p>
    <div className="table-scroll"><table><thead><tr><th scope="col">Critério</th><th scope="col">GymVisual</th><th scope="col">ExerciseDB V1 · AscendAPI</th></tr></thead><tbody>
      <tr><th scope="row">Modelo</th><td>Compra de arquivos por mídia ou pacote. O simulador estima uma compra.</td><td>API hospedada gratuita ou assinatura mensal via RapidAPI.</td></tr>
      <tr><th scope="row">Gratuito</th><td>Categoria Free com 5 produtos na consulta. Prévias do catálogo permitem avaliar as mídias.</td><td>US$ 0 · 1.500 exercícios, GIFs 180p, músculos, equipamentos e instruções. Sem cadastro ou chave.</td></tr>
      <tr><th scope="row">Pago</th><td>Imagem: US$ 3/un. ou US$ 0,75 a partir de 10.<br />GIF: US$ 3,60/un. ou US$ 0,90 a partir de 10.<br />Vídeo: US$ 10/un. ou US$ 6 a partir de 5. Pacotes sob consulta.</td><td>PRO: US$ 25/mês · 20.000 requisições/mês · US$ 0,001 por requisição excedente. Imagens e GIFs em 360p/480p, catálogo de 2.000+ exercícios.</td></tr>
      <tr><th scope="row">Uso e limites</th><td>Arquivos adquiridos seguem a licença do fornecedor. Prévia pública não equivale a arquivo comprado.</td><td>OSS gratuito: protótipos e uso não comercial, com crédito obrigatório à AscendAPI. Limites estritos, sem cota numérica publicada na documentação OSS. Uso comercial exige plano pago.</td></tr>
      <tr><th scope="row">Integração neste app</th><td>Comparativo da planilha, prévias, seleção de mídias e orçamento por arquivo único.</td><td>Comparação de toda a base Smart Fit com o catálogo OSS completo, GIFs lado a lado, filtros, seleção e simulação de assinatura. Plano pago apenas pesquisado.</td></tr>
      <tr><th scope="row">Fontes</th><td><a href="https://gymvisual.com/14-free" target="_blank" rel="noreferrer">Catálogo gratuito ↗</a><br /><a href="https://gymvisual.com/content/6-price-rules" target="_blank" rel="noreferrer">Tabela de preços ↗</a><br /><a href="https://gymvisual.com/content/3-terms-and-conditions-of-use" target="_blank" rel="noreferrer">Licença ↗</a></td><td><a href="https://oss.exercisedb.dev/docs" target="_blank" rel="noreferrer">API gratuita e restrições ↗</a><br /><a href="https://docs.ascendapi.com/products/edb-v1/overview" target="_blank" rel="noreferrer">Gratuito × pago ↗</a><br /><a href={PAID_URL} target="_blank" rel="noreferrer">Planos e preços RapidAPI ↗</a></td></tr>
    </tbody></table></div>
    <p className="dica">Exemplo PRO: 30.000 requisições no mês = US$ 25 + US$ 10 de excedentes = US$ 35. Confirme valores e licença na contratação. Planos marcados como ocultos pelo marketplace não foram tratados como ofertas disponíveis.</p>
    <h2>Comparações de nomes · novas plataformas</h2>
    <div className="table-scroll"><table><thead><tr><th>Critério</th><th>MuscleWiki</th><th>ExerciseAPI</th></tr></thead><tbody>
    <tr><th>Gratuito</th><td>BASIC: 500 chamadas/mês, somente Playground. Sem API direta.</td><td>Free: 100 chamadas/dia, 60/minuto; API com chave.</td></tr>
    <tr><th>Pago · USD/mês</th><td>TESTING 10 (1.000/mês, inglês); GROWTH 39,99 (30.000/mês, pt-br); PROFESSIONAL 99,99 (100.000/mês); ENTERPRISE 199,99 (300.000/mês).</td><td>Starter 5 (1.000/dia); Pro 29 (10.000/dia); Business 79 (100.000/dia). Enterprise sob consulta.</td></tr>
    <tr><th>Excedentes</th><td>Sem excedentes pagos: bloqueio ao esgotar a cota.</td><td>Pago: US$ 0,002/chamada; trava em 10× a cota diária. Free bloqueia na cota.</td></tr>
    <tr><th>De/para neste app</th><td>Amostra pública em português. Somente nomes; cobertura total desconhecida.</td><td>Amostra pública de buscas e categorias, nomes originais em inglês. Cobertura total desconhecida.</td></tr>
    <tr><th>Fontes oficiais</th><td><a href="https://api.musclewiki.com/pricing" target="_blank" rel="noreferrer">Preços ↗</a> · <a href="https://api.musclewiki.com/#demo" target="_blank" rel="noreferrer">Demo ↗</a></td><td><a href="https://exerciseapi.dev/#pricing" target="_blank" rel="noreferrer">Preços ↗</a> · <a href="https://exerciseapi.dev/llms.txt" target="_blank" rel="noreferrer">Referência ↗</a></td></tr>
    </tbody></table></div>
  </section>;
}
