import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { useBranding } from '../hooks/useBranding';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useStore();
  const { theme, setTheme } = useTheme();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--fg-primary)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center">
              {branding.hasCompanyBranding && branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName || 'Logo'}
                  className="h-10 w-auto"
                />
              ) : (
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {branding.companyName || 'Leada'}
                </div>
              )}
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link to="/dashboard" className="hover:opacity-80">Dashboard</Link>
              <Link to="/chat" className="hover:opacity-80">Chat</Link>
              <Link to="/themenpakete" className="hover:opacity-80">Themenpakete</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded hover:opacity-80 text-sm font-medium"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? 'Hell' : theme === 'dark' ? 'Dunkel' : 'System'}
            </button>

            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded hover:opacity-80" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <span>{user?.email}</span>
                <span>▼</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg hidden group-hover:block" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <Link to="/profil" className="block px-4 py-2 hover:opacity-80">Profil</Link>
                <Link to="/mein-bereich" className="block px-4 py-2 hover:opacity-80">Mein Bereich</Link>
                <Link to="/mein-unternehmen" className="block px-4 py-2 hover:opacity-80">Mein Unternehmen</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:opacity-80">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--fg-secondary)' }}>
        <p>© 2025 Leada Chat - Powered by SYNK GROUP</p>
      </footer>
    </div>
  );
};

export default Layout;
