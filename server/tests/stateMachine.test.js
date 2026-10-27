import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TRANSITIONS, transition, getPermissions } from '../src/services/doubtStateMachine.js';

const STATUSES = ['open', 'claimed', 'resolved'];
const ACTIONS = Object.keys(TRANSITIONS);

const VALID = {
  'open:claim': 'claimed',
  'claimed:unclaim': 'open',
  'claimed:resolve': 'resolved',
  'resolved:reopen': 'open',
};

describe('transition', () => {
  // Every status x action pair: 4 valid, 8 invalid.
  for (const status of STATUSES) {
    for (const action of ACTIONS) {
      const expected = VALID[`${status}:${action}`];
      if (expected) {
        it(`${status} --${action}--> ${expected}`, () => {
          assert.deepEqual(transition(status, action), { status: expected });
        });
      } else {
        it(`rejects ${action} from ${status}`, () => {
          const result = transition(status, action);
          assert.equal(result.status, undefined);
          assert.equal(result.error, `Cannot ${action} a doubt that is ${status}`);
        });
      }
    }
  }

  it('rejects an unknown action', () => {
    assert.deepEqual(transition('open', 'delete'), { error: "Unknown action 'delete'" });
  });

  it('rejects an unknown status', () => {
    assert.ok(transition('archived', 'claim').error);
  });

  it('never allows open -> resolved directly', () => {
    for (const action of ACTIONS) {
      assert.notEqual(transition('open', action).status, 'resolved');
    }
  });
});

describe('getPermissions', () => {
  const author = { userId: 'a', role: 'student' };
  const ta = { userId: 't', role: 'ta' };
  const otherTa = { userId: 'x', role: 'ta' };
  const doubt = (status, claimedById = null, answerCount = 0) => ({
    status,
    authorId: 'a',
    claimedById,
    answerCount,
  });

  it('lets any TA claim an open doubt, but not students', () => {
    assert.equal(getPermissions(doubt('open'), ta).canClaim, true);
    assert.equal(getPermissions(doubt('open'), author).canClaim, false);
  });

  it('only the claiming TA can unclaim or answer', () => {
    const claimed = doubt('claimed', 't');
    assert.equal(getPermissions(claimed, ta).canAnswer, true);
    assert.equal(getPermissions(claimed, ta).canUnclaim, true);
    assert.equal(getPermissions(claimed, otherTa).canAnswer, false);
    assert.equal(getPermissions(claimed, otherTa).canClaim, false);
  });

  it('resolving needs at least one answer', () => {
    assert.equal(getPermissions(doubt('claimed', 't', 0), ta).canResolve, false);
    assert.equal(getPermissions(doubt('claimed', 't', 1), ta).canResolve, true);
  });

  it('only the author can reopen, and only when resolved', () => {
    assert.equal(getPermissions(doubt('resolved', 't', 1), author).canReopen, true);
    assert.equal(getPermissions(doubt('resolved', 't', 1), ta).canReopen, false);
    assert.equal(getPermissions(doubt('claimed', 't', 1), author).canReopen, false);
  });

  it('authors cannot upvote their own doubt', () => {
    assert.equal(getPermissions(doubt('open'), author).canUpvote, false);
    assert.equal(getPermissions(doubt('open'), ta).canUpvote, true);
  });
});
