import assert from 'node:assert/strict';
import test from 'node:test';
import { findSearchSuggestions, normalizeSearchText } from '../client/src/utils/searchSuggestions.js';

const candidates = [
  { ru: 'Представление налоговой отчётности', kz: 'Салық есептілігін тапсыру' },
  { ru: 'Подача налоговой декларации', kz: 'Салық декларациясын тапсыру' },
  { ru: 'Регистрация контрольно-кассовой машины', kz: 'Бақылау-касса машинасын тіркеу' },
];

const options = {
  getLabel: (item) => item.ru,
  getSearchText: (item) => [item.ru, item.kz],
};

test('normalization ignores case, punctuation and Russian ё', () => {
  assert.equal(normalizeSearchText('  ОТЧЁТНОСТЬ, налоговая! '), 'отчетность налоговая');
});

test('Russian misspellings produce the closest searchable title', () => {
  const suggestions = findSearchSuggestions('налогавая отчетност', candidates, options);
  assert.equal(suggestions[0], 'Представление налоговой отчётности');
});

test('transposed characters are treated as one typo', () => {
  const suggestions = findSearchSuggestions('налоговая деклрация', candidates, options);
  assert.equal(suggestions[0], 'Подача налоговой декларации');
});

test('Kazakh letters and common substitutions remain searchable', () => {
  const suggestions = findSearchSuggestions('салык есептилигин', candidates, options);
  assert.equal(suggestions[0], 'Представление налоговой отчётности');
});

test('unrelated queries do not produce noisy suggestions', () => {
  assert.deepEqual(findSearchSuggestions('абракадабра', candidates, options), []);
});

test('an already exact phrase is not repeated as a correction', () => {
  assert.deepEqual(findSearchSuggestions('налоговой отчётности', candidates, options), []);
});
