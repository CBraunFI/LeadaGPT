import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { authAPI } from '../services/api';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setToken } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isRegister
        ? await authAPI.register(email, password)
        : await authAPI.login(email, password);

      setToken(response.token);
      setUser(response.user);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-md w-full p-8 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: 'var(--accent)' }}>
          {isRegister ? 'Registrieren' : 'Anmelden'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#fee', color: '#c33' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2" style={{ color: 'var(--fg-primary)' }}>E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--fg-primary)' }}
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: 'var(--fg-primary)' }}>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--fg-primary)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-semibold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading ? 'Lädt...' : isRegister ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {isRegister ? 'Bereits registriert? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
          </button>
        </div>

        <div className="mt-6">
          <div className="text-center mb-4" style={{ color: 'var(--fg-secondary)' }}>oder</div>
          <div className="space-y-2">
            <button
              className="w-full py-3 rounded font-semibold"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--fg-primary)' }}
              onClick={() => alert('Google OAuth noch nicht implementiert')}
            >
              Mit Google anmelden
            </button>
            <button
              className="w-full py-3 rounded font-semibold"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--fg-primary)' }}
              onClick={() => alert('Microsoft OAuth noch nicht implementiert')}
            >
              Mit Microsoft anmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
