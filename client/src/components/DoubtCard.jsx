import { Link } from 'react-router';
import StatusBadge from './StatusBadge.jsx';
import UpvoteButton from './UpvoteButton.jsx';
import { fullDate, timeAgo } from '../utils/format.js';

export default function DoubtCard({ doubt, currentUserId }) {
  const isAuthor = doubt.author?._id === currentUserId;

  return (
    <li className="card spotlight group flex gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop sm:gap-4">
      <UpvoteButton
        doubtId={doubt._id}
        upvoted={doubt.hasUpvoted}
        count={doubt.upvoteCount}
        disabled={isAuthor}
        disabledReason="You can't upvote your own doubt"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
          <Link
            to={`/doubts/${doubt._id}`}
            className="min-w-0 rounded font-semibold leading-snug text-fg [overflow-wrap:anywhere] hover:text-accent-fg"
          >
            {doubt.title}
          </Link>
          <StatusBadge status={doubt.status} />
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted [overflow-wrap:anywhere]">{doubt.body}</p>
        {doubt.tags?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {doubt.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2.5 text-xs text-subtle">
          asked by <span className="text-muted">{isAuthor ? 'you' : doubt.author?.name}</span>
          {' · '}
          <time dateTime={doubt.createdAt} title={fullDate(doubt.createdAt)}>
            {timeAgo(doubt.createdAt)}
          </time>
          {doubt.claimedBy && (
            <>
              {' · '}
              {doubt.status === 'resolved' ? 'resolved' : 'claimed'} by{' '}
              <span className="text-muted">{doubt.claimedBy.name}</span>
            </>
          )}
        </p>
      </div>
    </li>
  );
}
