// Reproduce public demo searches; keep only text needed for this local comparison.
import { writeFile } from 'node:fs/promises';
const queries = ['', 'squat', 'press', 'curl', 'row', 'extension', 'raise', 'lunge', 'fly', 'pulldown', 'deadlift', 'crunch', 'plank', 'calf', 'adduction', 'abduction', 'push up', 'pull up', 'rotation', 'bridge'];
const categories = ['strength','yoga','calisthenics','conditioning','physical therapy','mobility','plyometrics','stretching','pilates','olympic weightlifting','powerlifting','strongman'];
const exercises = new Map();
const searches = [];
for (const params of [...queries.map(q => ({q})), ...categories.map(category => ({category}))]) {
  const url = new URL('https://exerciseapi.dev/api/explore');
  Object.entries(params).forEach(([k,v]) => { if(v) url.searchParams.set(k,v); });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Demo returned ${response.status}; stopped without retrying.`);
  const body = await response.json();
  if (!Array.isArray(body.data)) throw new Error('Unexpected demo response');
  searches.push({...params,count:body.data.length,total:body.total});
  for (const e of body.data) exercises.set(e.id, {id:e.id,name:e.name,category:e.category,equipment:e.equipment,primaryMuscles:e.primaryMuscles});
  await new Promise(r => setTimeout(r,400));
}
await writeFile(new URL('../out/comparativo/exerciseapi-demo.json',import.meta.url),JSON.stringify({fetchedAt:new Date().toISOString(),complete:false,locale:'en',source:'https://exerciseapi.dev/#demo',searches,exercises:[...exercises.values()]},null,2));
console.log(`${exercises.size} unique names; partial public demo sample.`);
