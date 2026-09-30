import unittest
from build_exercisedb_comparison import match, prepare

def exercise(name, equipment='barbell', body='chest', eid='one'):
    return {'exerciseId': eid, 'name': name, 'equipments': [equipment], 'bodyParts': [body]}

class ExerciseDBMatchingTests(unittest.TestCase):
    def test_exact_translation_is_strong(self):
        result = match('Supino reto barra', 'Peitoral', prepare([exercise('barbell bench press')]))
        self.assertEqual(result['status'], 'Correspondência forte')
        self.assertEqual(result['candidateId'], 'one')

    def test_equipment_and_variants_are_not_strong(self):
        for name in ['Supino inclinado barra', 'Supino reto halter', 'Supino unilateral barra']:
            with self.subTest(name=name):
                self.assertNotEqual(match(name, 'Peitoral', prepare([exercise('barbell bench press')]))['status'], 'Correspondência forte')

    def test_combined_movements_are_not_confirmed_by_one_part(self):
        self.assertNotEqual(match('Supino reto barra + remada', 'Peitoral', prepare([exercise('barbell bench press')]))['status'], 'Correspondência forte')

    def test_classes_are_not_matched_to_generic_exercises(self):
        result = match('Supino reto barra', 'Aulas', prepare([exercise('barbell bench press')]))
        self.assertEqual(result['status'], 'Não encontrado')
        self.assertIsNone(result['candidateId'])

    def test_other_movement_family_is_not_a_candidate(self):
        result = match('Supino reto barra', 'Peitoral', prepare([exercise('barbell squat', body='upper legs')]))
        self.assertIsNone(result['candidateId'])

if __name__ == '__main__': unittest.main()
