"""Broad retrieval followed by conservative, bidirectional title similarity."""
import math
from collections import Counter
from rapidfuzz import fuzz, process

class TitleIndex:
    def __init__(self, titles):
        self.titles = dict(titles)
        counts = Counter(t for s in self.titles.values() for t in set(s.split()))
        self.weights = {t: 1 + math.log((len(titles) + 1) / (n + 1)) for t, n in counts.items()}

    def score(self, a, b):
        left, right = set(a.split()), set(b.split())
        if not left or not right:
            return 0
        weight = lambda tokens: sum(self.weights.get(t, 5) for t in tokens)
        overlap = weight(left & right)
        precision, recall = overlap / weight(right), overlap / weight(left)
        semantic = 2 * precision * recall / (precision + recall) if overlap else 0
        # Full string similarity retains typo tolerance; weighted overlap emphasizes rare qualifiers.
        return .55 * semantic * 100 + .30 * fuzz.token_sort_ratio(a, b) + .15 * fuzz.ratio(a, b)

    def search(self, query, family_ids=(), limit=90):
        # Union of three retrieval methods plus the complete movement family. Never hard-gate by family.
        ids = set(family_ids)
        for scorer in (fuzz.token_sort_ratio, fuzz.token_set_ratio, fuzz.WRatio):
            ids.update(i for _, _, i in process.extract(query, self.titles, scorer=scorer, limit=limit, score_cutoff=30))
        ranked = [(self.titles[i], self.score(query, self.titles[i]), i) for i in ids]
        return sorted(ranked, key=lambda r: (-r[1], str(r[2])))[:limit]
