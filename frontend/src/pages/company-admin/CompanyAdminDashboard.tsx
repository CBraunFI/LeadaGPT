import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyAdminAPI, type CompanyAnalytics } from '../../services/companyAdminApi';

const CompanyAdminDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | '6months' | 'all'>('week');
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [analyticsData, summaryData] = await Promise.all([
        companyAdminAPI.getAnalytics(period),
        companyAdminAPI.getAnalyticsSummary(period),
      ]);

      setAnalytics(analyticsData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError('Fehler beim Laden des Dashboards');
    } finally {
      setIsLoading(false);
    }
  };

  const periodLabels = {
    week: 'Letzte 7 Tage',
    month: 'Letzter Monat',
    '3months': 'Letzte 3 Monate',
    '6months': 'Letzte 6 Monate',
    all: 'Gesamtzeitraum',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const activeRate = analytics.userMetrics.totalUsers > 0
    ? ((analytics.userMetrics.activeUsers / analytics.userMetrics.totalUsers) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unternehmens-Dashboard</h1>
          <p className="text-gray-600 mt-1">Aggregierte Übersicht für Ihr Unternehmen</p>
        </div>

        {/* Period Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="block w-48 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Summary */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">KI-Zusammenfassung</h3>
              <p className="text-gray-700 leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt-Nutzer</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.userMetrics.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.userMetrics.newUsers} neu in diesem Zeitraum
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <Link
            to="/company-admin/users"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block"
          >
            Nutzerverwaltung →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Nutzer</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.userMetrics.activeUsers}</p>
              <p className="text-sm text-green-600 mt-1">{activeRate}% Aktivitätsrate</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chat-Sessions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.chatMetrics.totalSessions}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.chatMetrics.avgMessagesPerSession} Nachrichten Ø
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Themenpakete & Routines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Themenpakete */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Themenpakete</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Aktiv</span>
              <span className="text-lg font-semibold text-blue-600">{analytics.themenpaketMetrics.activeProgress}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Abgeschlossen</span>
              <span className="text-lg font-semibold text-green-600">{analytics.themenpaketMetrics.completedProgress}</span>
            </div>
          </div>

          {analytics.themenpaketMetrics.popularThemenpakete.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mt-6 mb-3">Beliebteste Themenpakete</h4>
              <div className="space-y-2">
                {analytics.themenpaketMetrics.popularThemenpakete.slice(0, 5).map((tp, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate flex-1">{tp.title}</span>
                    <span className="text-gray-500 ml-2">{tp.userCount} Nutzer</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Routines */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Routinen</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Aktiv</span>
              <span className="text-lg font-semibold text-blue-600">{analytics.routineMetrics.activeRoutines}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Gesamt</span>
              <span className="text-lg font-semibold text-gray-900">{analytics.routineMetrics.totalRoutines}</span>
            </div>
          </div>

          {analytics.routineMetrics.popularRoutines.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mt-6 mb-3">Häufigste Routinen</h4>
              <div className="space-y-2">
                {analytics.routineMetrics.popularRoutines.slice(0, 5).map((routine, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 truncate flex-1">{routine.title}</span>
                    <span className="text-gray-500 ml-2">{routine.userCount} Nutzer</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;
