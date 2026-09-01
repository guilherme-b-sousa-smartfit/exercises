import { useState } from "react";

type Props = {
  rotulo: string;
  url: string;
  alt: string;
  sugerido?: boolean;
};

export const MediaSlot = ({ rotulo, url, alt, sugerido = false }: Props) => {
  const [erro, setErro] = useState(false);
  const vazio = !url;

  const classe = ["slot", vazio ? "slot-vazio" : "", sugerido ? "slot-sugerido" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={classe}>
      <div className="slot-midia">
        {vazio || erro ? (
          <div className="slot-placeholder">{erro ? "não carregou" : "faltando"}</div>
        ) : (
          <a href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={alt} loading="lazy" onError={() => setErro(true)} />
          </a>
        )}
      </div>
      <figcaption className="slot-rotulo">
        {rotulo}
        {sugerido ? <span className="slot-tag">sugerido</span> : null}
      </figcaption>
    </figure>
  );
};
