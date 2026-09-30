import type { ComparisonRow, MatchStatus } from './comparison';
export type DBExercise = { exerciseId: string; name: string; gifUrl: string; bodyParts: string[]; equipments: string[]; targetMuscles: string[]; secondaryMuscles: string[]; instructions: string[] };
export type DBMatch = { id: string; name: string; group: string; status: MatchStatus; score: number; candidateId: string | null; reason: string; query: string };
export type DBSnapshot = { generatedAt: string; catalogFetchedAt: string; catalogTotal: number; exercises: DBExercise[]; rows: DBMatch[] };
export type DBComparison = { source: ComparisonRow; match: DBMatch; exercise?: DBExercise; stale: boolean };
export function joinComparison(rows: ComparisonRow[], snapshot?: DBSnapshot): DBComparison[] {
  const matches = new Map(snapshot?.rows.map(r => [r.id, r]));
  const exercises = new Map(snapshot?.exercises.map(e => [e.exerciseId, e]));
  return rows.map(source => {
    const saved = matches.get(source.id);
    const stale = !saved || saved.name !== source.name || saved.group !== source.group;
    const match: DBMatch = stale ? { id: source.id, name: source.name, group: source.group, status: 'Revisar', score: 0, candidateId: null, query: '', reason: 'Exercício novo ou alterado na base. É necessário regenerar a comparação ExerciseDB.' } : saved;
    return { source, match, exercise: match.candidateId ? exercises.get(match.candidateId) : undefined, stale };
  });
}
export function eligible(rows: DBComparison[], includeReview = false, gapsOnly = false): DBComparison[] {
  return rows.filter(r => r.exercise && !r.stale && (r.match.status === 'Correspondência forte' || (includeReview && r.match.status === 'Revisar')) && (!gapsOnly || r.source.missingVideo));
}
export const uniqueGIFs = (rows: DBComparison[]) => new Set(rows.flatMap(r => r.exercise ? [r.exercise.exerciseId] : [])).size;
export function proMonthlyCost(requests: number) { return 25 + Math.max(0, Math.ceil(requests) - 20000) * .001; }
export function readDBSelection(raw: string | null): Set<string> {
  try { const values: unknown = JSON.parse(raw || '[]'); return new Set(Array.isArray(values) ? values.filter((v): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]+$/.test(v)) : []); } catch { return new Set(); }
}
