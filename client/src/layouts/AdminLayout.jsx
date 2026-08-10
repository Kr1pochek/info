import { Activity, BarChart3, BookOpenCheck, Boxes, ChevronRight, ClipboardList, LayoutDashboard, LogOut, Newspaper, PackageOpen, Settings, ShieldCheck, Tv, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const contentRoles = ['SUPER_ADMIN', 'ADMIN'];
const links = [
  { to: '/admin', label: 'Обзор', icon: LayoutDashboard, end: true, roles: contentRoles },
  { to: '/admin/services', label: 'Услуги', icon: BookOpenCheck, roles: contentRoles },
  { to: '/admin/categories', label: 'Категории', icon: Boxes, roles: contentRoles },
  { to: '/admin/packages', label: 'Пакеты', icon: PackageOpen, roles: contentRoles },
  { to: '/admin/news', label: 'Новости', icon: Newspaper },
  { to: '/admin/broadcast', label: 'Эфир', icon: Tv },
  { to: '/admin/system-status', label: 'Состояние системы', icon: Activity, roles: contentRoles },
  { to: '/admin/analytics', label: 'Аналитика', icon: BarChart3, roles: contentRoles },
  { to: '/admin/users', label: 'Администраторы', icon: Users, roles: ['SUPER_ADMIN'] },
  { to: '/admin/settings', label: 'Настройки', icon: Settings, roles: contentRoles },
  { to: '/admin/audit-logs', label: 'Журнал действий', icon: ClipboardList, roles: ['SUPER_ADMIN'] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => { await logout(); navigate('/admin/login', { replace: true }); };
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span>ДГД</span><div><strong>Корпоративный портал</strong><small>Панель управления</small></div></div>
      <nav>{links.filter((item) => !item.roles || item.roles.includes(user.role)).map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon size={21} /><span>{label}</span><ChevronRight className="nav-arrow" size={17} /></NavLink>)}</nav>
      <div className="admin-profile"><div className="admin-profile__avatar"><ShieldCheck /></div><div><strong>{user.fullName}</strong><small>{user.role}</small></div><button onClick={signOut} aria-label="Выйти"><LogOut size={21} /></button></div>
    </aside>
    <div className="admin-workspace"><header className="admin-topbar"><div><span>Департамент государственных доходов</span><strong>Управление внутренними сервисами</strong></div><a href="/" className="admin-preview-link">Открыть главную</a></header><main className="admin-main"><Outlet /></main></div>
  </div>;
}
