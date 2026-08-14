export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function damerauLevenshtein(left, right) {
  const source = Array.from(left);
  const target = Array.from(right);
  const rows = Array.from({ length: source.length + 1 }, () => Array(target.length + 1).fill(0));

  for (let index = 0; index <= source.length; index += 1) rows[index][0] = index;
  for (let index = 0; index <= target.length; index += 1) rows[0][index] = index;

  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      const substitutionCost = source[row - 1] === target[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + substitutionCost,
      );
      if (row > 1 && column > 1 && source[row - 1] === target[column - 2] && source[row - 2] === target[column - 1]) {
        rows[row][column] = Math.min(rows[row][column], rows[row - 2][column - 2] + 1);
      }
    }
  }

  return rows[source.length][target.length];
}

function tokenSimilarity(left, right) {
  if (left === right) return 1;
  const longest = Math.max(Array.from(left).length, Array.from(right).length);
  if (!longest) return 1;
  if (left.includes(right) || right.includes(left)) {
    const shortest = Math.min(Array.from(left).length, Array.from(right).length);
    return 0.72 + (shortest / longest) * 0.28;
  }
  return 1 - damerauLevenshtein(left, right) / longest;
}

function suggestionScore(query, candidate) {
  const queryTokens = query.split(' ').filter((token) => token.length >= 2);
  const candidateTokens = [...new Set(candidate.split(' ').filter((token) => token.length >= 2))];
  if (!queryTokens.length || !candidateTokens.length || candidate.includes(query)) return 0;

  const similarities = queryTokens.map((queryToken) =>
    candidateTokens.reduce((best, candidateToken) => Math.max(best, tokenSimilarity(queryToken, candidateToken)), 0));
  const average = similarities.reduce((sum, value) => sum + value, 0) / similarities.length;
  const coverage = similarities.filter((value) => value >= 0.62).length / similarities.length;
  return average * 0.78 + coverage * 0.22;
}

function thresholdFor(query) {
  const longestToken = Math.max(...query.split(' ').map((token) => Array.from(token).length));
  if (longestToken <= 3) return 0.84;
  if (longestToken <= 5) return 0.74;
  return 0.66;
}

export function findSearchSuggestions(query, candidates, { getLabel, getSearchText, limit = 3 } = {}) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2 || !Array.isArray(candidates)) return [];

  const minimumScore = thresholdFor(normalizedQuery);
  const seen = new Set();
  return candidates
    .map((candidate) => {
      const label = String(getLabel?.(candidate) || '').trim();
      const searchable = getSearchText?.(candidate);
      const text = normalizeSearchText(Array.isArray(searchable) ? searchable.join(' ') : searchable || label);
      return { label, score: suggestionScore(normalizedQuery, text) };
    })
    .filter(({ label, score }) => label && score >= minimumScore)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .filter(({ label }) => {
      const key = normalizeSearchText(label);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ label }) => label);
}
