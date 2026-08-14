import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { FontSizeProvider } from './context/FontSizeContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import { LoadingState } from './components/common/States.jsx';

const KioskLayout = lazy(() => import('./layouts/KioskLayout.jsx'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const NewsLayout = lazy(() => import('./layouts/NewsLayout.jsx'));
const ChoosePage = lazy(() => import('./pages/portal/ChoosePage.jsx'));
const HomePage = lazy(() => import('./pages/kiosk/HomePage.jsx'));
const ServicesPage = lazy(() => import('./pages/kiosk/ServicesPage.jsx'));
const CategoryPage = lazy(() => import('./pages/kiosk/CategoryPage.jsx'));
const ServicePage = lazy(() => import('./pages/kiosk/ServicePage.jsx'));
const PackagesPage = lazy(() => import('./pages/kiosk/PackagesPage.jsx'));
const PackagePage = lazy(() => import('./pages/kiosk/PackagePage.jsx'));
const InformationPage = lazy(() => import('./pages/kiosk/InformationPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/kiosk/NotFoundPage.jsx'));
const NewsListPage = lazy(() => import('./pages/news/NewsListPage.jsx'));
const NewsDetailPage = lazy(() => import('./pages/news/NewsDetailPage.jsx'));
const LoginPage = lazy(() => import('./pages/admin/LoginPage.jsx'));
const AdminStartPage = lazy(() => import('./pages/admin/AdminStartPage.jsx'));
const AdminServicesPage = lazy(() => import('./pages/admin/ServicesPage.jsx'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage.jsx'));
const AdminPackagesPage = lazy(() => import('./pages/admin/PackagesPage.jsx'));
const AdminNewsPage = lazy(() => import('./pages/admin/NewsPage.jsx'));
const BroadcastPage = lazy(() => import('./pages/admin/BroadcastPage.jsx'));
const SystemStatusPage = lazy(() => import('./pages/admin/SystemStatusPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage.jsx'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage.jsx'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage.jsx'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage.jsx'));

export default function App() {
  return <BrowserRouter><AuthProvider><LanguageProvider><FontSizeProvider><SettingsProvider><Suspense fallback={<LoadingState />}><Routes>
    <Route index element={<ChoosePage />} />
    <Route element={<KioskLayout />}><Route path="kiosk" element={<HomePage />} /><Route path="services" element={<ServicesPage />} /><Route path="packages" element={<PackagesPage />} /><Route path="package/:packageSlug" element={<PackagePage />} /><Route path="category/:categorySlug" element={<CategoryPage />} /><Route path="service/:serviceSlug" element={<ServicePage />} /><Route path="information/:informationSlug" element={<InformationPage />} /></Route>
    <Route path="news" element={<NewsLayout />}><Route index element={<NewsListPage />} /><Route path=":newsSlug" element={<NewsDetailPage />} /></Route>
    <Route path="admin/login" element={<LoginPage />} />
    <Route path="admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route index element={<AdminStartPage />} /><Route path="services" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><AdminServicesPage /></RoleRoute>} /><Route path="categories" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><CategoriesPage /></RoleRoute>} />
      <Route path="packages" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><AdminPackagesPage /></RoleRoute>} />
      <Route path="news" element={<AdminNewsPage />} />
      <Route path="broadcast" element={<BroadcastPage />} />
      <Route path="system-status" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><SystemStatusPage /></RoleRoute>} />
      <Route path="analytics" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><AnalyticsPage /></RoleRoute>} />
      <Route path="users" element={<RoleRoute roles={['SUPER_ADMIN']}><UsersPage /></RoleRoute>} />
      <Route path="settings" element={<RoleRoute roles={['SUPER_ADMIN', 'ADMIN']}><SettingsPage /></RoleRoute>} />
      <Route path="audit-logs" element={<RoleRoute roles={['SUPER_ADMIN']}><AuditLogsPage /></RoleRoute>} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></SettingsProvider></FontSizeProvider></LanguageProvider></AuthProvider></BrowserRouter>;
}
