import { parseCsv } from './sheet';

export const COMPARISON_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1r7Mqi8tBFz-qXxyEoWeeaB3bepar8FsgUWA0SYuviKA/edit';
export const CATALOG_URL = 'https://docs.google.com/spreadsheets/d/1RMmqNGdAmlKWrk7TJsYJRhhsyaacGkRx/edit';
export type MatchStatus = 'Correspondência forte' | 'Revisar' | 'Não encontrado';
export type MediaStatus = 'Sim — forte' | 'Revisar' | 'Não encontrado';
export type CatalogMedia = { status: MediaStatus; id: string; name: string; reference: string };
export type ComparisonRow = {
  id: string; name: string; group: string; status: MatchStatus; score: number;
  confidence: string; reason: string; image: CatalogMedia; video: CatalogMedia; gif: CatalogMedia;
  equipment: string; body: string; missingImage: boolean; missingVideo: boolean;
  sourceUrl: string; catalogUrl: string;
};
const statuses: string[] = ['Correspondência forte', 'Revisar', 'Não encontrado'];
const mediaStatuses: string[] = ['Sim — forte', 'Revisar', 'Não encontrado'];
export function parseComparison(values: unknown[][]): ComparisonRow[] {
  if (values.length < 2) throw new Error('Comparativo vazio ou indisponível.');
  const headers = values[0].map(String);
  const required = ['ID base', 'Exercício base', 'Grupo base', 'Resultado', 'Índice de confiança (0–100)', 'Confiança', 'Justificativa', 'Imagem no catálogo', 'ID imagem', 'Nome imagem', 'Referência imagem', 'Vídeo no catálogo', 'ID vídeo', 'Nome vídeo', 'Referência vídeo', 'GIF no catálogo', 'ID GIF', 'Nome GIF', 'Referência GIF', 'Equipamento candidato principal', 'Grupo candidato principal', 'Falta imagem atual', 'Falta vídeo atual', 'Fonte base', 'Fonte catálogo'];
  if (required.some(h => !headers.includes(h))) throw new Error('A estrutura da aba Comparativo mudou.');
  const seen = new Set<string>();
  return values.slice(1).filter(r => String(r[0] ?? '').trim()).map(cells => {
    const get = (header: string) => String(cells[headers.indexOf(header)] ?? '').trim();
    const id = get('ID base');
    const status = get('Resultado');
    if (!id || seen.has(id)) throw new Error(`ID ausente ou duplicado no comparativo: ${id}`);
    seen.add(id);
    if (!statuses.includes(status)) throw new Error(`Resultado inválido no exercício ${id}.`);
    const media = (label: string, key: string): CatalogMedia => {
      const state = get(`${label} no catálogo`);
      if (!mediaStatuses.includes(state)) throw new Error(`Formato inválido no exercício ${id}.`);
      return { status: state as MediaStatus, id: get(`ID ${key}`), name: get(`Nome ${key}`), reference: get(`Referência ${key}`) };
    };
    const score = Number(get('Índice de confiança (0–100)').replace(',', '.'));
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error(`Índice inválido no exercício ${id}.`);
    return { id, name: get('Exercício base'), group: get('Grupo base'), status: status as MatchStatus, score,
      confidence: get('Confiança'), reason: get('Justificativa'), image: media('Imagem', 'imagem'), video: media('Vídeo', 'vídeo'), gif: media('GIF', 'GIF'),
      equipment: get('Equipamento candidato principal'), body: get('Grupo candidato principal'), missingImage: get('Falta imagem atual') === 'Sim', missingVideo: get('Falta vídeo atual') === 'Sim', sourceUrl: get('Fonte base'), catalogUrl: get('Fonte catálogo') };
  });
}
export async function fetchComparison(signal: AbortSignal): Promise<ComparisonRow[]> {
  const url = `${COMPARISON_SHEET_URL.replace('/edit', '')}/gviz/tq?tqx=out:csv&headers=1&sheet=Comparativo&range=A1:AE5000&cachebust=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Leitura ao vivo indisponível (${response.status}).`);
  return parseComparison(parseCsv(await response.text()));
}
export async function fetchSnapshot(signal: AbortSignal): Promise<{ rows: ComparisonRow[]; date: string }> {
  const response = await fetch(`${import.meta.env.BASE_URL}comparison.json`, { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Não foi possível ler o comparativo salvo.');
  const data = await response.json();
  return { rows: parseComparison([data.headers, ...data.values]), date: data.generatedAt };
}
export function coverageCounts(rows: ComparisonRow[]) {
  return {
    total: rows.length,
    strong: rows.filter(r => r.status === 'Correspondência forte').length,
    uncertain: rows.filter(r => r.status === 'Revisar').length,
    absent: rows.filter(r => r.status === 'Não encontrado').length,
    image: rows.filter(r => r.image.status === 'Sim — forte').length,
    video: rows.filter(r => r.video.status === 'Sim — forte').length,
    gif: rows.filter(r => r.gif.status === 'Sim — forte').length,
    missingImage: rows.filter(r => r.missingImage).length,
    missingVideo: rows.filter(r => r.missingVideo).length,
    fillImage: rows.filter(r => r.missingImage && r.image.status === 'Sim — forte').length,
    fillVideo: rows.filter(r => r.missingVideo && r.video.status === 'Sim — forte').length,
  };
}
