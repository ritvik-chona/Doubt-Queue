import { Link } from 'react-router';
import { Empty } from '../components/States.jsx';

export default function NotFound() {
  return (
    <Empty
      title="Page not found"
      action={
        <Link to="/courses" className="btn btn-primary">
          Go to my courses
        </Link>
      }
    >
      The page you're looking for doesn't exist or has moved.
    </Empty>
  );
}
