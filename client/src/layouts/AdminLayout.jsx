import { BarChart3, BookOpenCheck, Boxes, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Newspaper, Settings, ShieldCheck, Tv, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/admin', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/admin/services', label: 'Услуги', icon: BookOpenCheck },
  { to: '/admin/categories', label: 'Категории', icon: Boxes },
  { to: '/admin/news', label: 'Новости', icon: Newspaper },
  { to: '/admin/broadcast', label: 'Эфир', icon: Tv },
  { to: '/admin/analytics', label: 'Аналитика', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/users', label: 'Администраторы', icon: Users, roles: ['SUPER_ADMIN'] },
  { to: '/admin/settings', label: 'Настройки', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { to: '/admin/audit-logs', label: 'Журнал действий', icon: ClipboardList, roles: ['SUPER_ADMIN'] },
];
export default function AdminLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const signOut = async () => { await logout(); navigate('/admin/login', { replace: true }); };
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><span>ДГД</span><div><strong>Корпоративный портал</strong><small>Панель управления</small></div></div><nav>{links.filter((item) => !item.roles || item.roles.includes(user.role)).map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={21} /><span>{label}</span><ChevronRight className="nav-arrow" size={17} /></NavLink>)}</nav><div className="admin-profile"><div className="admin-profile__avatar"><ShieldCheck /></div><div><strong>{user.fullName}</strong><small>{user.role}</small></div><button onClick={signOut} aria-label="Выйти"><LogOut size={21} /></button></div></aside><div className="admin-workspace"><header className="admin-topbar"><div><span>Департамент государственных доходов</span><strong>Управление внутренними сервисами</strong></div><a href="/" className="admin-preview-link">Открыть Choose</a></header><main className="admin-main"><Outlet /></main></div></div>;
}
