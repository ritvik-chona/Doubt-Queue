import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import api from '../api/client.js';
import DoubtForm from '../components/DoubtForm.jsx';
import { ErrorState, Loading } from '../components/States.jsx';

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
  if (!course) return <Loading label="Loading course…" />;

  return (
    <div className="space-y-5">
      <div>
        <Link to={`/courses/${id}`} className="text-sm text-slate-500 hover:text-indigo-700">
          ← {course.name}
        </Link>
        <h1 className="text-2xl font-semibold">Ask a doubt</h1>
      </div>

      {created ? (
        <div className="card space-y-4 text-center">
          <p className="alert-success">Your doubt was posted. A TA will pick it up soon.</p>
          <p className="font-medium">{created.title}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to={`/doubts/${created._id}`} className="btn btn-primary">
              View doubt
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCreated(null);
                setFormKey((k) => k + 1);
              }}
            >
              Ask another
            </button>
            <Link to={`/courses/${id}`} className="btn btn-secondary">
              Back to course
            </Link>
          </div>
        </div>
      ) : (
        <DoubtForm key={formKey} courseId={id} onCreated={setCreated} />
      )}
    </div>
  );
}
