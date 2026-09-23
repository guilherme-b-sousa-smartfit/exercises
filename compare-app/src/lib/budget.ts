import type { ComparisonRow, CatalogMedia } from './comparison';
export type Kind = 'image' | 'gif' | 'video';
export const kinds: Kind[] = ['image', 'gif', 'video'];
export const labels: Record<Kind, string> = { image: 'Imagem', gif: 'GIF', video: 'Vídeo' };
export type Asset = { id: string; kind: Kind; name: string; productUrl: string; poster?: string; preview?: string; previewType?: 'image' | 'video' | 'embed'; price?: number; verifiedId?: boolean; matchMethod?: string };
export type MediaIndex = { checkedAt: string; assets: Record<string, Asset> };
export type Item = { key: string; kind: Kind; media: CatalogMedia; rows: ComparisonRow[] };
export const keyFor = (kind: Kind, id: string) => `${kind}:${id}`;
export function itemsFor(rows: ComparisonRow[], formats: Kind[], includeReview = false, missingOnly = false): Item[] {
  const items = new Map<string, Item>();
  for (const row of rows) for (const kind of formats) {
    const media = row[kind];
    if (!media.id || media.status === 'Não encontrado' || (!includeReview && media.status !== 'Sim — forte')) continue;
    if (missingOnly && !(kind === 'image' ? row.missingImage : row.missingVideo)) continue;
    const key = keyFor(kind, media.id);
    const item = items.get(key) ?? { key, kind, media, rows: [] };
    item.rows.push(row); items.set(key, item);
  }
  return [...items.values()];
}
// Public category-wide rules verified at https://gymvisual.com/content/6-price-rules.
// Product pages may have different thresholds; keep this an editable estimate.
export type Pricing = { gifCents: number; videoCents: number; imageCents: number | null; gifMin: number; videoMin: number; imageMin: number };
export const defaultPricing: Pricing = { gifCents: 90, videoCents: 600, imageCents: 75, gifMin: 10, videoMin: 5, imageMin: 10 };
export function budget(items: Item[], pricing: Pricing, index: MediaIndex) {
  const unique = [...new Map(items.map(i => [i.key, i])).values()];
  const counts = { image: 0, gif: 0, video: 0 }; unique.forEach(i => counts[i.kind]++);
  let cents = 0, unknown = 0;
  const prices: Record<string, number | null> = {};
  for (const item of unique) {
    const kind = item.kind;
    const retail = { image: 300, gif: 360, video: 1000 };
    const discounted = pricing[`${kind}Cents`];
    const price = discounted == null ? null : counts[kind] >= pricing[`${kind}Min`] ? discounted : index.assets[item.key]?.price ?? retail[kind];
    prices[item.key] = price ?? null;
    if (price == null) unknown++; else cents += price;
  }
  return { cents, unknown, counts, prices, quantity: unique.length };
}
export const usd = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function readSelection(value: string | null): Set<string> {
  try { const parsed: unknown = JSON.parse(value ?? '[]'); return new Set(Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string' && /^(image|gif|video):\d+$/.test(s)) : []); } catch { return new Set(); }
}
