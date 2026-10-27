import { Link } from 'react-router';
import StatusBadge from './StatusBadge.jsx';
import UpvoteButton from './UpvoteButton.jsx';
import { timeAgo } from '../utils/format.js';

export default function DoubtCard({ doubt, currentUserId }) {
  const isAuthor = doubt.author?._id === currentUserId;

  return (
    <li className="card flex gap-4">
      <UpvoteButton
        doubtId={doubt._id}
        upvoted={doubt.hasUpvoted}
        count={doubt.upvoteCount}
        disabled={isAuthor}
        disabledReason="You can't upvote your own doubt"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/doubts/${doubt._id}`} className="font-medium text-slate-900 hover:text-indigo-700">
            {doubt.title}
          </Link>
          <StatusBadge status={doubt.status} />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{doubt.body}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {doubt.tags?.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {doubt.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </span>
          )}
          <span>
            {isAuthor ? 'You' : doubt.author?.name} · {timeAgo(doubt.createdAt)}
          </span>
          {doubt.claimedBy && (
            <span>
              {doubt.status === 'resolved' ? 'Resolved' : 'Claimed'} by {doubt.claimedBy.name}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
