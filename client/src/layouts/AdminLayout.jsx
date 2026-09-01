import { useEffect, useState } from 'react';
import {
  BarChart3, BookOpen, BookOpenCheck, Boxes, ChevronRight, ClipboardList, Eye, Flame, Languages,
  LayoutDashboard, LogOut, MonitorSmartphone, Newspaper, PackageOpen, Settings, ShieldCheck, Tv, UserRoundCheck, Users,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { adminRoleLabel, useAdminI18n } from '../utils/adminLocalization.js';
import DgdLogo from '../components/common/DgdLogo.jsx';

const contentRoles = ['SUPER_ADMIN', 'ADMIN'];

const workspaces = [
  {
    id: 'safety',
    label: 'Этика и пожарная безопасность', labelKz: 'Әдеп және өрт қауіпсіздігі',
    description: 'Две отдельные настройки', descriptionKz: 'Екі бөлек баптау',
    icon: ShieldCheck,
    preview: '/information/ethics-fire-safety', previewLabel: 'Открыть страницу инфокиоска', previewLabelKz: 'Инфокиоск бетін ашу',
    links: [
      { to: '/admin/ethics', label: 'Уполномоченный по этике', labelKz: 'Әдеп жөніндегі уәкіл', icon: UserRoundCheck, roles: contentRoles },
      { to: '/admin/fire-safety', label: 'Пожарная инструкция', labelKz: 'Өрт қауіпсіздігі нұсқаулығы', icon: Flame, roles: contentRoles },
    ],
  },
  {
    id: 'kiosk',
    label: 'Инфокиоск', labelKz: 'Инфокиоск',
    description: 'Услуги и справочная информация', descriptionKz: 'Қызметтер мен анықтамалық ақпарат',
    icon: MonitorSmartphone,
    preview: '/kiosk', previewLabel: 'Открыть инфокиоск', previewLabelKz: 'Инфокиоскіні ашу',
    links: [
      { to: '/admin/services', label: 'Услуги', labelKz: 'Қызметтер', icon: BookOpenCheck, roles: contentRoles },
      { to: '/admin/categories', label: 'Категории', labelKz: 'Санаттар', icon: Boxes, roles: contentRoles },
      { to: '/admin/packages', label: 'Пакеты обслуживания', labelKz: 'Қызмет пакеттері', icon: PackageOpen, roles: contentRoles },
      { to: '/admin/settings', label: 'Настройки инфокиоска', labelKz: 'Инфокиоск баптаулары', icon: Settings, roles: contentRoles },
    ],
  },
  {
    id: 'news',
    label: 'Новостная лента', labelKz: 'Жаңалықтар таспасы',
    description: 'Публикации и экранный эфир', descriptionKz: 'Жарияланымдар мен экрандық эфир',
    icon: Newspaper,
    preview: '/news', previewLabel: 'Открыть новостную ленту', previewLabelKz: 'Жаңалықтар таспасын ашу',
    links: [
      { to: '/admin/news', label: 'Новости', labelKz: 'Жаңалықтар', icon: Newspaper },
      { to: '/admin/broadcast', label: 'Эфир', labelKz: 'Эфир', icon: Tv },
    ],
  },
];

const utilityLinks = [
  { to: '/admin/guide', label: 'Инструкция', labelKz: 'Нұсқаулық', icon: BookOpen },
  { to: '/admin/analytics', label: 'Аналитика', labelKz: 'Талдау', icon: BarChart3, roles: contentRoles },
  { to: '/admin/users', label: 'Администраторы', labelKz: 'Әкімшілер', icon: Users, roles: ['SUPER_ADMIN'] },
  { to: '/admin/audit-logs', label: 'Журнал аудита', labelKz: 'Аудит журналы', icon: ClipboardList, roles: ['SUPER_ADMIN'] },
];

const allowed = (item, role) => !item.roles || item.roles.includes(role);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { language, tr, toggleLanguage } = useAdminI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role;
  const visibleWorkspaces = workspaces.map((workspace) => ({ ...workspace, links: workspace.links.filter((item) => allowed(item, role)) })).filter((workspace) => workspace.links.length);
  const visibleUtilities = utilityLinks.filter((item) => allowed(item, role));
  const activeWorkspace = visibleWorkspaces.find((workspace) => workspace.links.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)));
  const activeUtility = visibleUtilities.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
  const activeGroup = activeWorkspace?.id || (activeUtility ? 'system' : null);
  const [openGroup, setOpenGroup] = useState(() => activeGroup);
  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup);
  }, [activeGroup]);
  const toggleGroup = (id) => setOpenGroup((current) => current === id ? null : id);
  const guideContext = location.pathname === '/admin/guide' ? {
    label: 'Помощь и обучение', labelKz: 'Көмек және оқыту',
    description: 'Инструкция по работе с панелью', descriptionKz: 'Панельмен жұмыс істеу нұсқаулығы',
    preview: '/', previewLabel: 'Открыть сайт', previewLabelKz: 'Сайтты ашу',
  } : null;
  const pageContext = activeWorkspace || guideContext || {
    label: 'Общее управление', labelKz: 'Жалпы басқару',
    description: 'Контроль, аналитика и безопасность', descriptionKz: 'Бақылау, талдау және қауіпсіздік',
    preview: '/', previewLabel: 'Открыть главную', previewLabelKz: 'Басты бетті ашу',
  };
  const signOut = async () => { await logout(); navigate('/admin/login', { replace: true }); };

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><DgdLogo className="admin-brand__logo" decorative /><div><strong>{tr('Контент-центр', 'Контент орталығы')}</strong><small>{tr('Панель управления')}</small></div></div>
      <nav className="admin-navigation" aria-label={tr('Разделы админ-панели', 'Әкімшілік панель бөлімдері')}>
        {role !== 'EDITOR' && <NavLink className="admin-overview-link" to="/admin" end><LayoutDashboard size={21} /><span>{tr('Начало', 'Басты бет')}</span><ChevronRight className="nav-arrow" size={17} /></NavLink>}
        {visibleWorkspaces.map((workspace) => {
          const WorkspaceIcon = workspace.icon;
          const isOpen = openGroup === workspace.id;
          return <section className={`admin-nav-group ${activeWorkspace?.id === workspace.id ? 'is-active' : ''}${isOpen ? ' is-open' : ''}`} key={workspace.id}>
            <button type="button" className="admin-nav-group__heading" onClick={() => toggleGroup(workspace.id)} aria-expanded={isOpen} aria-controls={`admin-nav-${workspace.id}`}><span><WorkspaceIcon size={21} /></span><div><strong>{tr(workspace.label, workspace.labelKz)}</strong><small>{tr(workspace.description, workspace.descriptionKz)}</small></div><ChevronRight className="nav-group-chevron" size={17} /></button>
            {isOpen && <div className="admin-nav-links" id={`admin-nav-${workspace.id}`}>{workspace.links.map(({ to, label, labelKz, icon: Icon }) => <NavLink key={to} to={to}><Icon size={20} /><span>{tr(label, labelKz)}</span><ChevronRight className="nav-arrow" size={16} /></NavLink>)}</div>}
          </section>;
        })}
        {visibleUtilities.length > 0 && <section className={`admin-nav-group admin-nav-group--utilities${activeUtility ? ' is-active' : ''}${openGroup === 'system' ? ' is-open' : ''}`}>
          <button type="button" className="admin-nav-group__heading" onClick={() => toggleGroup('system')} aria-expanded={openGroup === 'system'} aria-controls="admin-nav-system"><span><Settings size={21} /></span><div><strong>{tr('Система', 'Жүйе')}</strong><small>{tr('Помощь, аналитика и доступ', 'Көмек, талдау және қолжетімділік')}</small></div><ChevronRight className="nav-group-chevron" size={17} /></button>
          {openGroup === 'system' && <div className="admin-nav-links" id="admin-nav-system">{visibleUtilities.map(({ to, label, labelKz, icon: Icon }) => <NavLink key={to} to={to}><Icon size={20} /><span>{tr(label, labelKz)}</span><ChevronRight className="nav-arrow" size={16} /></NavLink>)}</div>}
        </section>}
      </nav>
      <div className="admin-profile"><div className="admin-profile__avatar"><ShieldCheck /></div><div><strong>{user.fullName}</strong><small>{adminRoleLabel(user.role, language)}</small></div><button onClick={signOut} aria-label={tr('Выйти')}><LogOut size={21} /></button></div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-topbar">
        <div><span>{tr(pageContext.label, pageContext.labelKz)}</span><strong>{tr(pageContext.description, pageContext.descriptionKz)}</strong></div>
        <div className="admin-topbar__actions"><button type="button" className="admin-language-switch" onClick={toggleLanguage}><Languages size={18} />{language === 'kz' ? 'Рус' : 'Қаз'}</button><a href={pageContext.preview} target="_blank" rel="noreferrer" className="admin-preview-link"><Eye size={17} />{tr(pageContext.previewLabel, pageContext.previewLabelKz)}</a></div>
      </header>
      <main className="admin-main"><Outlet /></main>
    </div>
  </div>;
}
