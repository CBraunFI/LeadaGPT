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

// Layout
import Layout from './components/Layout';

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
