import type { ExerciseRow } from "../types";
import { ExerciseCard } from "./ExerciseCard";

type Props = {
  rows: ExerciseRow[];
};

export const ExerciseGrid = ({ rows }: Props) => {
  if (!rows.length) return <p className="vazio">Nenhum exercício com esses filtros.</p>;

  return (
    <div className="grid">
      {rows.map((row) => (
        <ExerciseCard key={row.key} row={row} />
      ))}
    </div>
  );
};
