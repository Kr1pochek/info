import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import DashboardPage from './DashboardPage.jsx';

export default function AdminStartPage() {
  const { user } = useAuth();
  return user?.role === 'EDITOR' ? <Navigate to="/admin/reception/schedule" replace /> : <DashboardPage />;
}
