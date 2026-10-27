import { Navigate, Outlet, Route, Routes } from 'react-router';
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
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
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
  );
}
