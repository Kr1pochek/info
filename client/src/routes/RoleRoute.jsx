import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function RoleRoute({ roles, children }) { const { user } = useAuth(); return roles.includes(user?.role) ? children : <Navigate to="/admin" replace />; }
