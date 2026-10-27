import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import api from '../api/client.js';
import DoubtForm from '../components/DoubtForm.jsx';
import { ArrowLeft, ArrowRight, Check, Plus } from '../components/Icons.jsx';
import { ErrorState } from '../components/States.jsx';
import { fireConfetti } from '../components/fx/confetti.js';

export default function NewDoubt() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const loadCourse = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data.course);
    } catch (err) {
      setError(err);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  if (error) return <ErrorState error={error} onRetry={loadCourse} />;
  if (!course)
    return (
      <div className="space-y-5" role="status" aria-label="Loading course">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-96 w-full rounded-card" />
      </div>
    );

  return (
    <div className="space-y-6">
      <header>
        <Link
          to={`/courses/${id}`}
          className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-accent-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {course.name}
        </Link>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">Ask a doubt</h1>
        <p className="mt-1 text-sm text-muted">
          Be specific. Similar doubts from <span className="chip">{course.code}</span> appear as you type the title.
        </p>
      </header>

      {created ? (
        <div className="card mx-auto max-w-lg animate-fade-up p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-resolved/15 text-resolved ring-1 ring-resolved/30">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Doubt posted</h2>
          <p className="mt-1 text-sm text-muted">A TA will pick it up soon. You can track its status from the queue.</p>
          <p className="mx-auto mt-4 max-w-sm rounded-control border border-line bg-canvas px-3 py-2 text-sm font-medium [overflow-wrap:anywhere]">
            {created.title}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to={`/doubts/${created._id}`} className="btn btn-primary">
              View doubt
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCreated(null);
                setFormKey((k) => k + 1);
              }}
            >
              <Plus />
              Ask another
            </button>
            <Link to={`/courses/${id}`} className="btn btn-ghost">
              Back to course
            </Link>
          </div>
        </div>
      ) : (
        <DoubtForm
          key={formKey}
          courseId={id}
          onCreated={(doubt) => {
            setCreated(doubt);
            fireConfetti();
          }}
        />
      )}
    </div>
  );
}
