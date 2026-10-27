// Duplicate-doubt detection. Pure functions, no DB access.
//
// Each text becomes a set of normalized word tokens and a set of character
// trigrams. Similarity blends token Jaccard (shared words) with trigram Dice
// (shared spelling), so "quick sort" and "quicksort" still match even though
// they share no whole word.

const STOPWORDS = new Set(
  (
    'a an the and or but if then else of to in on at by for with from into onto about as ' +
    'is am are was were be been being do does did doing have has had having ' +
    'i me my we our you your he she it its they them their this that these those ' +
    'what which who whom whose when where why how ' +
    'can could should would will shall may might must ' +
    'not no yes so too very just also than there here ' +
    'any some all each every more most other such only own same ' +
    // Words almost every doubt contains, which say nothing about the topic.
    'please help anyone someone explain understand question doubt confused ' +
    'regarding about get got getting know want need tell use using way'
  ).split(' ')
);

const TITLE_WEIGHT = 0.7;
const BODY_WEIGHT = 0.3;
const TOKEN_WEIGHT = 0.5;
const TRIGRAM_WEIGHT = 0.5;

// Light suffix stripping: enough to equate sort/sorts/sorted/sorting and
// query/queries without pulling in a full Porter stemmer.
export function stem(word) {
  if (word.length <= 3) return word;

  let w = word;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('sses')) return w.slice(0, -2);

  if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (/(s|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
  else if (w.endsWith('s') && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);

  // running -> runn -> run, stopped -> stopp -> stop
  if (/([^aeiouls])\1$/.test(w)) w = w.slice(0, -1);
  return w;
}

export function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem);
}

function trigrams(tokens) {
  // Joining without spaces is what lets "quick sort" and "quicksort" overlap.
  const s = tokens.join('');
  if (s.length < 3) return new Set(s ? [s] : []);
  const grams = new Set();
  for (let i = 0; i <= s.length - 3; i++) grams.add(s.slice(i, i + 3));
  return grams;
}

export function features(text) {
  const tokens = tokenize(text);
  return { tokens: new Set(tokens), grams: trigrams(tokens) };
}

function intersectionSize(a, b) {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  const shared = intersectionSize(a, b);
  return shared / (a.size + b.size - shared);
}

export function dice(a, b) {
  if (!a.size || !b.size) return 0;
  return (2 * intersectionSize(a, b)) / (a.size + b.size);
}

// 0..1 similarity between two precomputed feature sets.
export function similarityOf(fa, fb) {
  return TOKEN_WEIGHT * jaccard(fa.tokens, fb.tokens) + TRIGRAM_WEIGHT * dice(fa.grams, fb.grams);
}

export function textSimilarity(a, b) {
  return similarityOf(features(a), features(b));
}

// How similar a typed query is to an existing doubt, weighting its title over its body.
export function scoreDoubt(query, doubt) {
  const q = typeof query === 'string' ? features(query) : query;
  return (
    TITLE_WEIGHT * similarityOf(q, features(doubt.title)) +
    BODY_WEIGHT * similarityOf(q, features(doubt.body))
  );
}

// Scores every doubt against the query and returns the best matches, highest first.
export function rankSimilar(query, doubts, { limit = 5, threshold = 0.25 } = {}) {
  const q = features(query);
  if (!q.tokens.size) return [];

  return doubts
    .map((doubt) => ({ doubt, score: scoreDoubt(q, doubt) }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score || (b.doubt.upvoteCount ?? 0) - (a.doubt.upvoteCount ?? 0))
    .slice(0, limit);
}
