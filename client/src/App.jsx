import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import LiveBackground from './components/fx/LiveBackground.jsx';
import { useSpotlight } from './components/fx/useSpotlight.js';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CourseDoubts from './pages/CourseDoubts.jsx';
import Courses from './pages/Courses.jsx';
import DoubtDetail from './pages/DoubtDetail.jsx';
import Login from './pages/Login.jsx';
import NewDoubt from './pages/NewDoubt.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';

function AppLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-page px-4 py-6 sm:py-8">
        {/* Keyed by path so each page fades in on navigation */}
        <div key={pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>
    </>
  );
}

export default function App() {
  useSpotlight();
  return (
    <>
      <LiveBackground />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/courses" replace />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDoubts />} />
            <Route path="/courses/:id/new" element={<NewDoubt />} />
            <Route path="/doubts/:id" element={<DoubtDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
