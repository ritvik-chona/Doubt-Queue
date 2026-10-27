import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import api, { isCanceled } from '../api/client.js';
import Field, { inputClass } from '../components/Field.jsx';
import { ErrorState, Loading } from '../components/States.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UpvoteButton from '../components/UpvoteButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePolling } from '../hooks/usePolling.js';
import { timeAgo } from '../utils/format.js';

const POLL_MS = 15000;

const ACTIONS = [
  { key: 'claim', permission: 'canClaim', label: 'Claim', busyLabel: 'Claiming…', primary: true },
  { key: 'resolve', permission: 'canResolve', label: 'Mark resolved', busyLabel: 'Resolving…', primary: true },
  { key: 'unclaim', permission: 'canUnclaim', label: 'Unclaim', busyLabel: 'Unclaiming…' },
  { key: 'reopen', permission: 'canReopen', label: 'Reopen', busyLabel: 'Reopening…' },
];

export default function DoubtDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [data, setData] = useState(null); // { doubt, answers }
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(''); // which action is running
  // { text, forStatus }: hidden once polling shows the status has moved on,
  // so "Already claimed by X" doesn't linger after X unclaims.
  const [notice, setNotice] = useState(null);

  // Bumped on every write so a poll that started earlier can't overwrite
  // the newer state an action just returned.
  const version = useRef(0);
  const pollRequest = useRef(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      pollRequest.current?.abort();
      const controller = new AbortController();
      pollRequest.current = controller;
      const startedAt = version.current;
      if (!silent) setError(null);
      try {
        const { data } = await api.get(`/doubts/${id}`, { signal: controller.signal });
        if (version.current === startedAt) setData(data);
        return data;
      } catch (err) {
        if (isCanceled(err)) return;
        if (!silent) setError(err);
      }
    },
    [id]
  );

  useEffect(() => {
    setData(null);
    load();
    return () => pollRequest.current?.abort();
  }, [load]);

  usePolling(() => {
    if (!busy) load({ silent: true });
  }, POLL_MS, !error);

  function applyResult(result) {
    pollRequest.current?.abort();
    version.current += 1;
    setData(result);
  }

  async function runAction(action) {
    setBusy(action.key);
    setNotice(null);
    try {
      const { data } = await api.post(`/doubts/${id}/${action.key}`);
      applyResult(data);
    } catch (err) {
      let forStatus = data.doubt.status;
      // 409 means someone else changed it (e.g. another TA claimed it): show the latest.
      if (err.status === 409) {
        version.current += 1;
        const fresh = await load({ silent: true });
        if (fresh) forStatus = fresh.doubt.status;
      }
      setNotice({ text: err.message, forStatus });
    } finally {
      setBusy('');
    }
  }

  if (error) return <ErrorState error={error} onRetry={() => load()} />;
  if (!data) return <Loading label="Loading doubt…" />;

  const { doubt, answers } = data;
  const { permissions } = doubt;
  const isAuthor = doubt.author._id === user._id;
  const visibleActions = ACTIONS.filter((a) => permissions[a.permission]);

  return (
    <div className="space-y-5">
      <Link to={`/courses/${doubt.course}`} className="text-sm text-slate-500 hover:text-indigo-700">
        ← Back to course
      </Link>

      <article className="card flex gap-4">
        <UpvoteButton
          doubtId={doubt._id}
          upvoted={doubt.hasUpvoted}
          count={doubt.upvoteCount}
          disabled={!permissions.canUpvote}
          disabledReason="You can't upvote your own doubt"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{doubt.title}</h1>
            <StatusBadge status={doubt.status} />
          </div>
          <p className="text-xs text-slate-500">
            Asked by {isAuthor ? 'you' : doubt.author.name} · {timeAgo(doubt.createdAt)}
            {doubt.claimedBy && (
              <>
                {' · '}
                {doubt.status === 'resolved' ? 'Resolved' : 'Claimed'} by{' '}
                {doubt.claimedBy._id === user._id ? 'you' : doubt.claimedBy.name}
              </>
            )}
          </p>
          <p className="whitespace-pre-wrap text-slate-800">{doubt.body}</p>
          {doubt.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doubt.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {notice?.forStatus === doubt.status && (
            <p className="alert-error" role="alert">
              {notice.text}
            </p>
          )}

          {visibleActions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {visibleActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={Boolean(busy)}
                  onClick={() => runAction(action)}
                >
                  {busy === action.key ? action.busyLabel : action.label}
                </button>
              ))}
            </div>
          )}
          {permissions.canAnswer && answers.length === 0 && (
            <p className="text-xs text-slate-500">Post an answer below to be able to mark this resolved.</p>
          )}
        </div>
      </article>

      <section className="space-y-3">
        <h2 className="font-medium">
          {answers.length} {answers.length === 1 ? 'answer' : 'answers'}
        </h2>
        {answers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            {doubt.status === 'open' ? 'No answers yet. Waiting for a TA to claim this doubt.' : 'No answers yet.'}
          </p>
        ) : (
          <ol className="space-y-3">
            {answers.map((answer) => (
              <li key={answer._id} className="card">
                <p className="mb-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{answer.author.name}</span>
                  {answer.author.role === 'ta' && (
                    <span className="ml-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">
                      TA
                    </span>
                  )}
                  {' · '}
                  {timeAgo(answer.createdAt)}
                </p>
                <p className="whitespace-pre-wrap text-slate-800">{answer.body}</p>
              </li>
            ))}
          </ol>
        )}

        {permissions.canAnswer && (
          <AnswerForm doubtId={doubt._id} disabled={Boolean(busy)} onPosted={applyResult} setBusy={setBusy} />
        )}
      </section>
    </div>
  );
}

function AnswerForm({ doubtId, disabled, onPosted, setBusy }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setBusy('answer');
    setError('');
    try {
      const { data } = await api.post(`/doubts/${doubtId}/answers`, { body });
      onPosted(data);
      setBody('');
    } catch (err) {
      setError(err.fieldErrors.body || err.message);
    } finally {
      setSubmitting(false);
      setBusy('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3" noValidate>
      <Field label="Your answer" error={error}>
        <textarea
          className={`${inputClass(error)} min-h-28`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
        />
      </Field>
      <button type="submit" className="btn btn-primary" disabled={disabled || submitting || !body.trim()}>
        {submitting ? 'Posting…' : 'Post answer'}
      </button>
    </form>
  );
}
