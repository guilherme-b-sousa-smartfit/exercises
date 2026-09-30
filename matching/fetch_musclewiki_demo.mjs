// Text-only sample through the same public routes used by the Portuguese demo.
import { writeFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const out = new URL('out/comparativo/musclewiki-demo.json', root);
const get = async path => {
  const response = await fetch(`https://api.musclewiki.com/api/demo/${path}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Demo HTTP ${response.status}; stopped without retrying.`);
  return response.json();
};
const categories = await get('categories/');
const seen = new Map();
const capture = (e, source) => {
  if (!Number.isInteger(e.id) || typeof e.name !== 'string') throw new Error('Unexpected exercise schema');
  seen.set(e.id, { id: e.id, name: e.name, category: e.category, primaryMuscles: e.primary_muscles, source });
};
capture(await get('exercise/?lang=pt-br'), 'https://api.musclewiki.com/#demo');
// Bounded sample, deliberately not represented as a complete catalog.
for (let round = 0; round < 5; round++) {
  for (const category of categories) {
    const query = new URLSearchParams({ random: 'true', category: category.display_name, lang: 'pt-br' });
    capture(await get(`exercise/?${query}`), 'https://api.musclewiki.com/#demo');
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  console.log(`Round ${round + 1}/5: ${seen.size} unique names`);
  await mkdir(new URL('out/comparativo/', root), { recursive: true });
  await writeFile(out, JSON.stringify({ fetchedAt: new Date().toISOString(), locale: 'pt-br', complete: false, source: 'https://api.musclewiki.com/#demo', categories, exercises: [...seen.values()] }, null, 2));
}
