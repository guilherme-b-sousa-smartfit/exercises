import unittest
from title_similarity import TitleIndex
from build_comparison import canonical
class TitleSimilarityTests(unittest.TestCase):
    def test_bilingual_synonyms(self):
        self.assertEqual(canonical('Flexora deitada',True),canonical('Mesa Flexora',True))
        self.assertEqual(canonical('Remada com halteres',True),canonical('Dumbbell Row'))
        self.assertEqual(canonical('Lat Pulldown'),canonical('Pulldown'))
    def test_qualifiers_survive(self):
        for a,b in [('Supino inclinado','Supino declinado'),('Rosca alternada','Rosca simultânea'),('Afundo Bosu com halter','Afundo com halter')]:
            self.assertNotEqual(canonical(a,True),canonical(b,True))
    def test_broad_retrieval_does_not_require_family(self):
        idx=TitleIndex({0:'barbell bent row',1:'cable seated row',2:'band squat row'})
        self.assertEqual(idx.search('barbell bent row',[1])[0][2],0)
    def test_subset_does_not_get_exact_score(self):
        idx=TitleIndex({0:'dumbbell squat',1:'dumbbell sumo squat'})
        self.assertEqual(idx.score('dumbbell squat','dumbbell squat'),100)
        self.assertLess(idx.score('dumbbell squat','dumbbell sumo squat'),90)
    def test_empty_and_typo(self):
        idx=TitleIndex({0:'dumbbell squat'})
        self.assertEqual(idx.score('','dumbbell squat'),0)
        self.assertGreater(idx.score('dumbbel squat','dumbbell squat'),40)
if __name__=='__main__':unittest.main()
