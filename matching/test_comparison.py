import json, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
class ComparisonSafety(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.data=json.loads((ROOT/'out/comparativo/comparison.json').read_text())
  cls.rows=cls.data['rows']; cls.byid={r['id']:r for r in cls.rows}
  cls.catalog={(r['tab'],r['row']):r for r in json.loads((ROOT/'out/comparativo/catalogo.json').read_text())}
 def test_every_source_id_exactly_once_in_original_order(self):
  source=json.loads((ROOT/'out/comparativo/base.json').read_text())['values'][1:]
  self.assertEqual([r['id'] for r in self.rows],[str(r[0]) for r in source])
  self.assertEqual(len(self.byid),len(source))
 def test_counts_are_exclusive_and_complete(self):
  self.assertEqual(sum(self.data['counts'].values()),len(self.rows))
  for r in self.rows:
   if r['status']=='confirmed':
    self.assertGreaterEqual(r['score'],90)
    self.assertTrue(any(m['status']=='confirmed' for m in r['media'].values()))
   else: self.assertLess(r['score'],90)
 def test_paid_formats_have_real_independent_source_rows(self):
  expected={'video':'Videos','image':'Illustrations','gif':'Animated GIFs'}
  for r in self.rows:
   for kind,m in r['media'].items():
    if m['status']=='confirmed':
     self.assertEqual(m['tab'],expected[kind])
     original=self.catalog[(m['tab'],m['row'])]
     self.assertEqual((m['id'],m['name']),(original['id'],original['name']))
     self.assertIsInstance(m['id'],str)
 def test_protocols_and_specific_equipment_are_not_generic_exercises(self):
  for r in self.rows:
   if r['group'] in {'Hit','Aulas'} or 'Doublegrip' in r['name'] or 'Sandbag' in r['name']:
    self.assertNotEqual(r['status'],'confirmed',r['name'])
 def test_critical_variants_and_false_friends_are_not_confirmed(self):
  for eid in ['5860','5861','6075','6558','6649','7976','7139','6211','6227','7226']:
   self.assertNotEqual(self.byid[eid]['status'],'confirmed',self.byid[eid]['name'])
 def test_positive_equivalents_and_media_are_found(self):
  for eid in ['5750','5712','6042','7167','7168','5876']:
   self.assertEqual(self.byid[eid]['status'],'confirmed',self.byid[eid]['name'])
 def test_zero_padded_ids_survive(self):
  ids=[m['id'] for r in self.rows for m in r['media'].values() if m['status']=='confirmed']
  self.assertTrue(any(i.startswith('00') for i in ids))
 def test_same_name_different_id_is_not_collapsed(self):
  self.assertIn('7249',self.byid); self.assertIn('7259',self.byid)
  self.assertEqual(self.byid['7249']['name'],self.byid['7259']['name'])
if __name__=='__main__':unittest.main()
