import { useComparison } from './hooks/useComparison';
import { SimpleComparison } from './components/SimpleComparison';

export function App() {
  const comparison = useComparison();
  return <main className="app simple-app">
    <header className="library-header">
      <div><span className="eyebrow">SMART FIT · DE / PARA</span><h1>Compare os exercícios</h1><p>Os vídeos lado a lado. A similaridade para guiar sua revisão.</p></div>
      <nav aria-label="Bibliotecas"><a href="#gymvisual" aria-current="page">GymVisual</a></nav>
    </header>
    <SimpleComparison comparison={comparison} />
  </main>;
}
