import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { adminAuthAPI } from '../services/adminApi';
import type { Admin } from '../types';

const AdminLayout: React.FC = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('admin');

    if (!adminToken || !adminData) {
      navigate('/admin/login');
      return;
    }

    // Parse stored admin data
    try {
      setAdmin(JSON.parse(adminData));
    } catch (error) {
      console.error('Error parsing admin data:', error);
      handleLogout();
    }

    // Verify token is still valid
    adminAuthAPI.getMe().catch((error) => {
      console.error('Token validation error:', error);
      handleLogout();
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Determine if this is company admin or superadmin based on path
  const isCompanyAdmin = location.pathname.startsWith('/company-admin');
  const basePath = isCompanyAdmin ? '/company-admin' : '/admin';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Leada-GPT</h1>
                  <p className="text-xs text-gray-500">{isCompanyAdmin ? 'Company Admin' : 'Admin Portal'}</p>
                </div>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to={`${basePath}/dashboard`}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isActive(`${basePath}/dashboard`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to={`${basePath}/users`}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isActive(`${basePath}/users`)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Nutzerverwaltung
              </Link>
              {isCompanyAdmin && (
                <Link
                  to={`${basePath}/settings`}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isActive(`${basePath}/settings`)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mein Unternehmen
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{admin?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                Abmelden
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-2">
                <Link
                  to={`${basePath}/dashboard`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isActive(`${basePath}/dashboard`)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to={`${basePath}/users`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isActive(`${basePath}/users`)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Nutzerverwaltung
                </Link>
                {isCompanyAdmin && (
                  <Link
                    to={`${basePath}/settings`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      isActive(`${basePath}/settings`)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Mein Unternehmen
                  </Link>
                )}
                <div className="px-4 py-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{admin?.role}</p>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-center text-gray-500">
            Leada-GPT Admin Portal • Alle Aktionen werden protokolliert
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
