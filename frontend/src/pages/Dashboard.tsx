import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { themenpaketeAPI, dashboardAPI } from '../services/api';
import { ThemenPaket } from '../types';

type Period = 'week' | 'month' | '3months' | '6months' | 'all';

const Dashboard = () => {
  const user = useStore((state) => state.user);
  const navigate = useNavigate();
  const [themenpakete, setThemenpakete] = useState<ThemenPaket[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [activitySummary, setActivitySummary] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load active Themenpakete
      const themenpaketeData = await themenpaketeAPI.getAll();
      const activeThemenpakete = themenpaketeData.filter((tp: any) => tp.progress?.status === 'active');
      setThemenpakete(activeThemenpakete);

      // Load activity summary
      const summaryData = await dashboardAPI.getActivitySummary(period);
      setActivitySummary(summaryData.summary);

      // Load stats
      const statsData = await dashboardAPI.getStats(period);
      setStats(statsData);

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

  const handleKIBriefing = async () => {
    try {
      const chat = await dashboardAPI.getKIBriefingChat();
      navigate(`/chat/${chat.id}`);
    } catch (error) {
      console.error('Error opening KI-Briefing:', error);
    }
  };

  const periodLabels: Record<Period, string> = {
    week: 'Letzte 7 Tage',
    month: 'Letzter Monat',
    '3months': 'Letzte 3 Monate',
    '6months': 'Letzte 6 Monate',
    all: 'Seit Beginn',
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

      {/* Period Selector */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <span style={{ color: 'var(--fg-secondary)' }} className="text-sm font-medium">
          Zeitraum:
        </span>
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: period === p ? 'var(--accent)' : 'var(--bg-secondary)',
              color: period === p ? 'white' : 'var(--fg-primary)',
              border: `1px solid ${period === p ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Activity Summary */}
      {activitySummary && (
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--accent)',
            borderWidth: '2px',
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              Ihre Aktivität ({periodLabels[period]})
            </h2>
            <button
              onClick={handleKIBriefing}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'white',
              }}
            >
              📊 KI-Briefing
            </button>
          </div>
          <p style={{ color: 'var(--fg-primary)' }} className="text-base leading-relaxed">
            {activitySummary}
          </p>
        </div>
      )}

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
          to="/profil"
          className="p-6 rounded-lg border hover:shadow-lg transition-all"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="text-2xl mb-2">👤</div>
          <h3 className="font-bold mb-1">Mein Profil</h3>
          <p className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
            Reflexion & Entwicklung
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

        {/* Statistics */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <h2 className="text-xl font-bold mb-4">Statistik ({periodLabels[period]})</h2>
          {stats && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--fg-secondary)' }}>Chat-Sessions</span>
                <span className="font-bold text-xl">{stats.chatSessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--fg-secondary)' }}>Nachrichten</span>
                <span className="font-bold text-xl">{stats.messages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--fg-secondary)' }}>Aktive Themenpakete</span>
                <span className="font-bold text-xl">{stats.themenpakete}</span>
              </div>
              {stats.routineCompletions > 0 && (
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--fg-secondary)' }}>Routine-Durchführungen</span>
                  <span className="font-bold text-xl">{stats.routineCompletions}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
