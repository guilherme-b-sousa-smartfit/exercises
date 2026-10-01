import { useReviewSheet } from './hooks/useReviewSheet';
import { SimpleComparison } from './components/SimpleComparison';

export function App() {
  const comparison = useReviewSheet();
  return <main className="app simple-app">
    <header className="library-header">
      <div><span className="eyebrow">REVISÃO DE EXERCÍCIOS</span><h1>personow.fit de/para</h1><p>Os vídeos lado a lado. A similaridade para guiar sua revisão.</p></div>
      <nav aria-label="Bibliotecas"><a href="#gymvisual" aria-current="page">GymVisual</a></nav>
    </header>
    <SimpleComparison comparison={comparison} />
  </main>;
}
