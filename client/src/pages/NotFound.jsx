import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Compass } from '../components/Icons.jsx';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="relative mx-auto flex max-w-lg flex-col items-center py-16 text-center sm:py-24">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent-fg ring-1 ring-accent/30">
        <Compass className="h-7 w-7" />
      </div>
      <p className="text-gradient mt-6 text-7xl font-bold tracking-tighter sm:text-8xl">404</p>
      <h1 className="mt-2 text-xl font-semibold">This page wandered off the queue</h1>
      <p className="mt-2 text-sm text-muted">The page you're looking for doesn't exist or has moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link to="/courses" className="btn btn-primary">
          Go to my courses
        </Link>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}
