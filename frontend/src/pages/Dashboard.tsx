import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { themenpaketeAPI, routinenAPI, chatAPI, reportsAPI } from '../services/api';
import { ThemenPaket, Routine, WeeklyReport } from '../types';

const Dashboard = () => {
  const user = useStore((state) => state.user);
  const [themenpakete, setThemenpakete] = useState<ThemenPaket[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [latestReport, setLatestReport] = useState<WeeklyReport | null>(null);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load active Themenpakete
      const themenpaketeData = await themenpaketeAPI.getAll();
      const activeThemenpakete = themenpaketeData.filter(tp => tp.progress?.status === 'active');
      setThemenpakete(activeThemenpakete);

      // Load active Routines
      const routinesData = await routinenAPI.getAll();
      const activeRoutines = routinesData.filter(r => r.status === 'active').slice(0, 5);
      setRoutines(activeRoutines);

      // Load latest report
      try {
        const report = await reportsAPI.getLatest();
        setLatestReport(report);
      } catch (error) {
        // No report yet
      }

      // Load chat sessions count
      const sessions = await chatAPI.getSessions();
      setSessionsCount(sessions.length);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center" style={{ color: 'var(--fg-secondary)' }}>
          Lädt Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {getGreeting()}, {user?.email?.split('@')[0]}!
        </h1>
        <p style={{ color: 'var(--fg-secondary)' }}>
          Willkommen zurück bei Leada Chat
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/chat"
          className="p-6 rounded-lg border hover:shadow-lg transition-all"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-2xl mb-2">💬</div>
          <h3 className="font-bold mb-1">Neuer Chat</h3>
          <p className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
            Starten Sie ein Gespräch mit Ihrem KI-Coach
          </p>
        </Link>

        <Link
          to="/themenpakete"
          className="p-6 rounded-lg border hover:shadow-lg transition-all"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-bold mb-1">Themenpakete</h3>
          <p className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
            Entdecken Sie neue Lernthemen
          </p>
        </Link>

        <Link
          to="/routinen"
          className="p-6 rounded-lg border hover:shadow-lg transition-all"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-2xl mb-2">✓</div>
          <h3 className="font-bold mb-1">Routinen</h3>
          <p className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
            Verwalten Sie Ihre täglichen Gewohnheiten
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Themenpakete */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Aktive Themenpakete</h2>
            <Link
              to="/themenpakete"
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              Alle anzeigen →
            </Link>
          </div>

          {themenpakete.length === 0 ? (
            <p style={{ color: 'var(--fg-secondary)' }}>
              Noch keine aktiven Themenpakete. Starten Sie eines aus der Bibliothek!
            </p>
          ) : (
            <div className="space-y-3">
              {themenpakete.map((tp) => {
                const progress = tp.progress;
                const progressPercent = progress
                  ? ((progress.currentDay - 1) * 2 + progress.currentUnit) / (tp.duration * tp.unitsPerDay) * 100
                  : 0;

                return (
                  <Link
                    key={tp.id}
                    to={`/themenpakete/${tp.id}`}
                    className="block p-4 rounded border hover:shadow transition-all"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{tp.title}</h3>
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--accent)',
                          color: 'white'
                        }}
                      >
                        {tp.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--fg-secondary)' }}>
                      Tag {progress?.currentDay}, Einheit {progress?.currentUnit}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: 'var(--accent)'
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Routines */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ihre Routinen</h2>
            <Link
              to="/routinen"
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              Alle anzeigen →
            </Link>
          </div>

          {routines.length === 0 ? (
            <p style={{ color: 'var(--fg-secondary)' }}>
              Noch keine Routinen angelegt. Erstellen Sie Ihre erste Routine!
            </p>
          ) : (
            <div className="space-y-3">
              {routines.map((routine) => {
                const today = new Date().toISOString().split('T')[0];
                const todayEntry = routine.entries.find(e => e.date.startsWith(today));
                const isCompletedToday = todayEntry?.completed || false;

                return (
                  <div
                    key={routine.id}
                    className="p-4 rounded border"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border)'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold">{routine.title}</h3>
                        <p className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
                          {routine.frequency === 'daily' ? 'Täglich' :
                           routine.frequency === 'weekly' ? 'Wöchentlich' : 'Custom'}
                        </p>
                      </div>
                      <div>
                        {isCompletedToday ? (
                          <span className="text-green-500 text-2xl">✓</span>
                        ) : (
                          <span className="text-gray-400 text-2xl">○</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <h2 className="text-xl font-bold mb-4">Ihre Statistik</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--fg-secondary)' }}>Chat-Sitzungen</span>
              <span className="font-bold text-xl">{sessionsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--fg-secondary)' }}>Aktive Themenpakete</span>
              <span className="font-bold text-xl">{themenpakete.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--fg-secondary)' }}>Aktive Routinen</span>
              <span className="font-bold text-xl">{routines.length}</span>
            </div>
          </div>
        </div>

        {/* Latest Report */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Wöchentlicher Bericht</h2>
            <Link
              to="/reports"
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              Alle anzeigen →
            </Link>
          </div>

          {latestReport ? (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--fg-secondary)' }}>
                {new Date(latestReport.weekStart).toLocaleDateString('de-DE')} - {new Date(latestReport.weekEnd).toLocaleDateString('de-DE')}
              </p>
              {latestReport.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Empfehlungen:</h3>
                  <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--fg-secondary)' }}>
                    {latestReport.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--fg-secondary)' }}>
              Noch kein Bericht verfügbar. Nutzen Sie Leada Chat eine Woche, um Ihren ersten Bericht zu generieren.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
