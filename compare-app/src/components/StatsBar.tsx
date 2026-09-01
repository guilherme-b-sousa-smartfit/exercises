import type { Coverage, StatusFilter, Totals } from "../types";

const CARDS: { chave: Coverage; rotulo: string; classe: string }[] = [
  { chave: "completo", rotulo: "thumbnail + GIF", classe: "stat-ok" },
  { chave: "so-thumb", rotulo: "só thumbnail", classe: "stat-aviso" },
  { chave: "so-gif", rotulo: "só GIF", classe: "stat-aviso" },
  { chave: "nenhum", rotulo: "sem mídia", classe: "stat-falha" },
];

type Props = {
  totals: Totals;
  visiveis: number;
  status: StatusFilter;
  onStatus: (status: StatusFilter) => void;
};

export const StatsBar = ({ totals, visiveis, status, onStatus }: Props) => (
  <div className="stats">
    <button
      className={`stat ${status === "todos" ? "stat-ativo" : ""}`}
      onClick={() => onStatus("todos")}
    >
      <span className="stat-valor">{totals.total}</span>
      <span className="stat-rotulo">linhas na planilha</span>
    </button>

    {CARDS.map(({ chave, rotulo, classe }) => (
      <button
        key={chave}
        className={`stat ${classe} ${status === chave ? "stat-ativo" : ""}`}
        onClick={() => onStatus(chave)}
      >
        <span className="stat-valor">{totals[chave]}</span>
        <span className="stat-rotulo">{rotulo}</span>
      </button>
    ))}

    <div className="stat stat-inerte">
      <span className="stat-valor">{visiveis}</span>
      <span className="stat-rotulo">exibindo</span>
    </div>
  </div>
);
