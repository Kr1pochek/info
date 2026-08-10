import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { FontSizeProvider } from './context/FontSizeContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import KioskLayout from './layouts/KioskLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import HomePage from './pages/kiosk/HomePage.jsx';
import ServicesPage from './pages/kiosk/ServicesPage.jsx';
import CategoryPage from './pages/kiosk/CategoryPage.jsx';
import ServicePage from './pages/kiosk/ServicePage.jsx';
import NotFoundPage from './pages/kiosk/NotFoundPage.jsx';
import LoginPage from './pages/admin/LoginPage.jsx';
import AdminServicesPage from './pages/admin/ServicesPage.jsx';
import CategoriesPage from './pages/admin/CategoriesPage.jsx';
import AnalyticsPage from './pages/admin/AnalyticsPage.jsx';
import UsersPage from './pages/admin/UsersPage.jsx';
import SettingsPage from './pages/admin/SettingsPage.jsx';
import AuditLogsPage from './pages/admin/AuditLogsPage.jsx';
import ChoosePage from './pages/portal/ChoosePage.jsx';
import NewsLayout from './layouts/NewsLayout.jsx';
import NewsListPage from './pages/news/NewsListPage.jsx';
import NewsDetailPage from './pages/news/NewsDetailPage.jsx';
import AdminNewsPage from './pages/admin/NewsPage.jsx';
import BroadcastPage from './pages/admin/BroadcastPage.jsx';
import PackagesPage from './pages/kiosk/PackagesPage.jsx';
import PackagePage from './pages/kiosk/PackagePage.jsx';
import AdminPackagesPage from './pages/admin/PackagesPage.jsx';
import AdminStartPage from './pages/admin/AdminStartPage.jsx';
import SystemStatusPage from './pages/admin/SystemStatusPage.jsx';

export default function App() {
  return <BrowserRouter><AuthProvider><LanguageProvider><FontSizeProvider><SettingsProvider><Routes>
    <Route index element={<ChoosePage />} />
    <Route element={<KioskLayout />}><Route path="kiosk" element={<HomePage />} /><Route path="services" element={<ServicesPage />} /><Route path="packages" element={<PackagesPage />} /><Route path="package/:packageSlug" element={<PackagePage />} /><Route path="category/:categorySlug" element={<CategoryPage />} /><Route path="service/:serviceSlug" element={<ServicePage />} /></Route>
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
  </Routes></SettingsProvider></FontSizeProvider></LanguageProvider></AuthProvider></BrowserRouter>;
}
