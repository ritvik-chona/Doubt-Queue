import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import api, { isCanceled } from '../api/client.js';
import Field, { inputClass } from '../components/Field.jsx';
import { Alert, ArrowLeft, Check } from '../components/Icons.jsx';
import { DoubtDetailSkeleton, ErrorState } from '../components/States.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import UpvoteButton from '../components/UpvoteButton.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { fireConfetti } from '../components/fx/confetti.js';
import { CountUp } from '../components/fx/Motion.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePolling } from '../hooks/usePolling.js';
import { fullDate, timeAgo } from '../utils/format.js';

const POLL_MS = 15000;

const ACTIONS = [
  { key: 'claim', permission: 'canClaim', label: 'Claim', busyLabel: 'Claiming…', variant: 'btn-primary', done: 'You claimed this doubt' },
  { key: 'resolve', permission: 'canResolve', label: 'Mark resolved', busyLabel: 'Resolving…', variant: 'btn-success', done: 'Marked as resolved' },
  { key: 'reopen', permission: 'canReopen', label: 'Reopen', busyLabel: 'Reopening…', variant: 'btn-secondary', done: 'Doubt reopened' },
  { key: 'unclaim', permission: 'canUnclaim', label: 'Unclaim', busyLabel: 'Unclaiming…', variant: 'btn-danger-soft', done: 'Released back to the queue' },
];

export default function DoubtDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();

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
      toast(action.done);
      if (action.key === 'resolve') fireConfetti();
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
  if (!data) return <DoubtDetailSkeleton />;

  const { doubt, answers } = data;
  const { permissions } = doubt;
  const isAuthor = doubt.author._id === user._id;
  const visibleActions = ACTIONS.filter((a) => permissions[a.permission]);
  const claimerName = doubt.claimedBy && (doubt.claimedBy._id === user._id ? 'you' : doubt.claimedBy.name);

  return (
    <div className="space-y-6">
      <Link
        to={`/courses/${doubt.course}`}
        className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-accent-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to course
      </Link>

      <article className="card spotlight overflow-hidden p-0">
        <div className="flex gap-4 p-5 sm:p-6">
          <UpvoteButton
            doubtId={doubt._id}
            upvoted={doubt.hasUpvoted}
            count={doubt.upvoteCount}
            disabled={!permissions.canUpvote}
            disabledReason="You can't upvote your own doubt"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={doubt.status} />
              <StatusSteps status={doubt.status} />
            </div>
            <h1 className="mt-3 text-2xl leading-snug font-semibold tracking-tight [overflow-wrap:anywhere]">
              {doubt.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-2">
                <Avatar name={doubt.author.name} size="h-6 w-6 text-[10px]" />
                <span className="text-fg">{isAuthor ? 'You' : doubt.author.name}</span>
              </span>
              <time dateTime={doubt.createdAt} title={fullDate(doubt.createdAt)} className="text-subtle">
                asked {timeAgo(doubt.createdAt)}
              </time>
            </div>
            <p className="mt-5 leading-relaxed whitespace-pre-wrap text-fg/90 [overflow-wrap:anywhere]">{doubt.body}</p>
            {doubt.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {doubt.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {notice?.forStatus === doubt.status && (
          <div
            className="mx-5 mb-4 flex items-start gap-2.5 rounded-control border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-red-200 sm:mx-6"
            role="alert"
          >
            <Alert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            {notice.text}
          </div>
        )}

        {/* Action bar: status summary + only the actions the server allows */}
        <div className="flex flex-col gap-3 border-t border-line bg-canvas/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted">
            {doubt.status === 'open' && 'Waiting for a TA to claim it.'}
            {doubt.status === 'claimed' && (
              <>
                Claimed by <span className="font-medium text-fg">{claimerName}</span>
                {permissions.canAnswer && answers.length === 0 && ' · post an answer to resolve it'}
              </>
            )}
            {doubt.status === 'resolved' && (
              <>
                Resolved by <span className="font-medium text-fg">{claimerName}</span>
              </>
            )}
          </p>
          {visibleActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className={`btn ${action.variant}`}
                  disabled={Boolean(busy)}
                  onClick={() => runAction(action)}
                >
                  {busy === action.key && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {busy === action.key ? action.busyLabel : action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </article>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Answers
          <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-line">
            <CountUp value={answers.length} />
          </span>
        </h2>
        {answers.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-strong bg-surface/50 px-4 py-8 text-center text-sm text-muted">
            {doubt.status === 'open' ? 'No answers yet. Waiting for a TA to claim this doubt.' : 'No answers yet.'}
          </p>
        ) : (
          <ol className="stagger space-y-4">
            {answers.map((answer, index) => {
              const accepted = doubt.status === 'resolved' && index === answers.length - 1;
              return (
                <li key={answer._id} className="flex gap-3">
                  <Avatar name={answer.author.name} size="h-9 w-9 text-xs" className="mt-1" />
                  <div
                    className={`min-w-0 flex-1 rounded-card rounded-tl-sm border p-4 ${
                      accepted
                        ? 'border-resolved/50 bg-resolved/5 shadow-[0_0_0_1px_rgb(52_211_153/0.15),0_10px_30px_-18px_rgb(52_211_153/0.5)]'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="text-sm font-medium text-fg">{answer.author.name}</span>
                      {answer.author.role === 'ta' && (
                        <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent-fg uppercase ring-1 ring-accent/30">
                          TA
                        </span>
                      )}
                      <time dateTime={answer.createdAt} title={fullDate(answer.createdAt)} className="text-subtle">
                        {timeAgo(answer.createdAt)}
                      </time>
                      {accepted && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-resolved/15 px-2 py-0.5 text-[11px] font-semibold text-resolved">
                          <Check className="h-3 w-3" />
                          Accepted answer
                        </span>
                      )}
                    </p>
                    <p className="mt-2 leading-relaxed whitespace-pre-wrap text-fg/90 [overflow-wrap:anywhere]">
                      {answer.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {permissions.canAnswer && (
          <AnswerForm
            doubtId={doubt._id}
            userName={user.name}
            disabled={Boolean(busy)}
            onPosted={applyResult}
            setBusy={setBusy}
          />
        )}
      </section>
    </div>
  );
}

const STEPS = ['open', 'claimed', 'resolved'];

// open → claimed → resolved progress indicator (decorative; the badge carries the status).
function StatusSteps({ status }) {
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1.5 text-[11px] text-subtle" aria-hidden="true">
      {STEPS.map((step, i) => (
        <li key={step} className="flex items-center gap-1.5">
          {i > 0 && <span className={`h-px w-4 ${i <= current ? 'bg-accent-fg/60' : 'bg-line-strong'}`} />}
          <span
            className={`h-1.5 w-1.5 rounded-full ${i <= current ? 'bg-accent-fg' : 'bg-line-strong'}`}
          />
          <span className={`capitalize ${i === current ? 'text-muted' : ''}`}>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function AnswerForm({ doubtId, userName, disabled, onPosted, setBusy }) {
  const toast = useToast();
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
      toast('Answer posted');
    } catch (err) {
      setError(err.fieldErrors.body || err.message);
    } finally {
      setSubmitting(false);
      setBusy('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3" noValidate>
      <Avatar name={userName} size="h-9 w-9 text-xs" className="mt-1" />
      <div className="card min-w-0 flex-1 space-y-3">
        <Field label="Your answer" error={error}>
          <textarea
            className={`${inputClass(error)} min-h-32 leading-relaxed`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            placeholder="Explain the idea, then the fix. Short examples help."
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-subtle tabular-nums">{body.length}/5000</span>
          <button type="submit" className="btn btn-primary" disabled={disabled || submitting || !body.trim()}>
            {submitting ? 'Posting…' : 'Post answer'}
          </button>
        </div>
      </div>
    </form>
  );
}
