import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingState } from '../components/common/States.jsx';

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth(); const location = useLocation();
  if (!ready) return <main className="full-state"><LoadingState text="Проверка авторизации…" /></main>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
