import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  stem,
  tokenize,
  textSimilarity,
  scoreDoubt,
  rankSimilar,
} from '../src/services/similarity.js';

describe('stem', () => {
  it('equates common word forms', () => {
    for (const w of ['sort', 'sorts', 'sorted', 'sorting']) assert.equal(stem(w), 'sort');
    assert.equal(stem('queries'), 'query');
    assert.equal(stem('hashes'), 'hash');
    assert.equal(stem('running'), 'run');
    assert.equal(stem('classes'), 'class');
  });

  it('leaves short words and -ss words alone', () => {
    assert.equal(stem('bus'), 'bus');
    assert.equal(stem('class'), 'class');
  });
});

describe('tokenize', () => {
  it('lowercases, strips punctuation and removes stopwords', () => {
    assert.deepEqual(tokenize('Why is QuickSort O(n^2)?!'), ['quicksort', 'o', 'n', '2']);
  });
});

describe('textSimilarity', () => {
  it('scores identical titles near 1', () => {
    const t = 'Why does Dijkstra fail with negative edge weights?';
    assert.ok(textSimilarity(t, t) > 0.99);
  });

  it('ignores case and punctuation differences', () => {
    assert.ok(textSimilarity('Binary search tree insertion', 'binary-search tree INSERTION!!') > 0.99);
  });

  it('scores unrelated titles under 0.2', () => {
    const pairs = [
      ['Binary search tree insertion', 'How to center a div with flexbox'],
      ['Dijkstra negative edge weights', 'Python list comprehension syntax'],
      ['Deadlock conditions in operating systems', 'Matrix multiplication time complexity'],
    ];
    for (const [a, b] of pairs) {
      const score = textSimilarity(a, b);
      assert.ok(score < 0.2, `"${a}" vs "${b}" scored ${score}`);
    }
  });

  it('matches "quicksort worst case" with "worst case of quick sort"', () => {
    assert.ok(textSimilarity('quicksort worst case', 'worst case of quick sort') > 0.5);
  });

  it('scores stopword-only input as 0', () => {
    assert.equal(textSimilarity('how do I do this?', 'how do I do this?'), 0);
    assert.equal(textSimilarity('what is the', 'Quicksort worst case'), 0);
  });

  it('handles empty and missing input without crashing', () => {
    assert.equal(textSimilarity('', ''), 0);
    assert.equal(textSimilarity('', 'quicksort'), 0);
    assert.equal(textSimilarity(undefined, null), 0);
  });

  it('always returns a score between 0 and 1', () => {
    const texts = ['', 'a', 'quick sort', 'quicksort', 'linked lists are fun', '!!!'];
    for (const a of texts) {
      for (const b of texts) {
        const s = textSimilarity(a, b);
        assert.ok(s >= 0 && s <= 1, `"${a}" vs "${b}" scored ${s}`);
      }
    }
  });
});

describe('scoreDoubt', () => {
  it('weights the title more than the body', () => {
    const titleMatch = { title: 'Quicksort worst case', body: 'Something about graphs and trees.' };
    const bodyMatch = { title: 'Something about graphs and trees', body: 'Quicksort worst case.' };
    assert.ok(scoreDoubt('quicksort worst case', titleMatch) > scoreDoubt('quicksort worst case', bodyMatch));
  });
});

describe('rankSimilar', () => {
  const doubts = [
    { _id: 1, title: 'Python decorators explained', body: 'How do decorators wrap functions?', upvoteCount: 9 },
    { _id: 2, title: 'Worst case of quick sort', body: 'Why is quick sort O(n^2) with a bad pivot?', upvoteCount: 1 },
    { _id: 3, title: 'Quicksort worst case complexity', body: 'Is the quicksort worst case really n squared?', upvoteCount: 4 },
    { _id: 4, title: 'Merge sort vs quick sort', body: 'Which sorting algorithm is stable?', upvoteCount: 2 },
    { _id: 5, title: 'Heap sort space usage', body: 'Does heap sort need extra memory?', upvoteCount: 0 },
  ];

  it('orders the best matches first and drops weak ones', () => {
    const ids = rankSimilar('quicksort worst case', doubts).map((r) => r.doubt._id);
    assert.deepEqual(ids.slice(0, 2), [3, 2]);
    assert.ok(!ids.includes(1), 'unrelated doubt should be below the threshold');
  });

  it('respects the limit and threshold options', () => {
    assert.equal(rankSimilar('sort', doubts, { limit: 2, threshold: 0 }).length, 2);
    assert.equal(rankSimilar('quicksort worst case', doubts, { threshold: 1.01 }).length, 0);
  });

  it('breaks score ties by upvotes', () => {
    const twins = [
      { _id: 'a', title: 'Graph coloring', body: 'Same body here', upvoteCount: 1 },
      { _id: 'b', title: 'Graph coloring', body: 'Same body here', upvoteCount: 7 },
    ];
    assert.deepEqual(rankSimilar('graph coloring', twins).map((r) => r.doubt._id), ['b', 'a']);
  });

  it('returns nothing for stopword-only or empty queries', () => {
    assert.deepEqual(rankSimilar('how do I do this', doubts), []);
    assert.deepEqual(rankSimilar('', doubts), []);
  });
});
