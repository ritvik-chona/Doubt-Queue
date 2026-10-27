// Pure status rules for a doubt. No DB access, so they can be unit tested and
// reused to tell the client which actions are currently allowed.
//
//   open --claim--> claimed --resolve--> resolved
//   open <-unclaim- claimed
//   open <-------- reopen ---------------- resolved

export const TRANSITIONS = {
  claim: { from: 'open', to: 'claimed' },
  unclaim: { from: 'claimed', to: 'open' },
  resolve: { from: 'claimed', to: 'resolved' },
  reopen: { from: 'resolved', to: 'open' },
};

// Returns { status } with the next status, or { error } if the move is not allowed.
export function transition(status, action) {
  const rule = TRANSITIONS[action];
  if (!rule) return { error: `Unknown action '${action}'` };
  if (rule.from !== status) return { error: `Cannot ${action} a doubt that is ${status}` };
  return { status: rule.to };
}

// What the given user may do with the doubt right now. Ids are compared as strings.
export function getPermissions({ status, authorId, claimedById, answerCount }, { userId, role }) {
  const isAuthor = authorId === userId;
  const isClaimer = status === 'claimed' && claimedById === userId;
  const allowed = (action) => !transition(status, action).error;

  return {
    canUpvote: !isAuthor,
    canClaim: role === 'ta' && allowed('claim'),
    canUnclaim: isClaimer,
    canAnswer: isClaimer,
    canResolve: isClaimer && answerCount > 0,
    canReopen: isAuthor && allowed('reopen'),
  };
}
