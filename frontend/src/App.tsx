import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useTheme } from './hooks/useTheme';
import { authAPI } from './services/api';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Themenpakete from './pages/Themenpakete';
import ThemenpaketDetail from './pages/ThemenpaketDetail';
import Routinen from './pages/Routinen';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import MeinBereich from './pages/MeinBereich';
import MeinUnternehmen from './pages/MeinUnternehmen';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

// Layout
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

function App() {
  const { isAuthenticated, setUser, setToken } = useStore();
  useTheme(); // Initialize theme

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await authAPI.getMe();
          setUser(user);
        } catch (error) {
          console.error('Auth check failed:', error);
          setToken(null);
        }
      }
    };

    checkAuth();
  }, [setUser, setToken]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/chat" /> : <Login />}
        />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:sessionId" element={<Chat />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/themenpakete" element={<Themenpakete />} />
                  <Route path="/themenpakete/:id" element={<ThemenpaketDetail />} />
                  <Route path="/routinen" element={<Routinen />} />
                  <Route path="/profil" element={<Profile />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/mein-bereich" element={<MeinBereich />} />
                  <Route path="/mein-unternehmen" element={<MeinUnternehmen />} />
                  <Route path="*" element={<Navigate to="/chat" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
