import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminDashboardAPI } from '../../services/adminApi';
import type { DashboardStats } from '../../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminDashboardAPI.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setIsLoading(false);
    }
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
          onClick={loadStats}
          className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const activeRate = stats.totalUsers > 0
    ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
    : '0';

  // Calculate max value for word cloud sizing
  const maxValue = stats.topTopics.length > 0
    ? Math.max(...stats.topTopics.map(t => t.value))
    : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Übersicht über die wichtigsten Kennzahlen</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Angemeldete Nutzer</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block"
          >
            Nutzerverwaltung →
          </Link>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Nutzer (30 Tage)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
              <p className="text-sm text-gray-500 mt-1">{activeRate}% Aktivitätsrate</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Companies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unternehmen</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.companies.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Word Cloud */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top-Themen</h2>
          <p className="text-sm text-gray-600 mb-6">Häufigste Begriffe aus Nutzer-Gesprächen (letzte 90 Tage)</p>

          {stats.topTopics.length > 0 ? (
            <div className="flex flex-wrap gap-3 items-center justify-center min-h-[300px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
              {stats.topTopics.map((topic, index) => {
                const size = 12 + (topic.value / maxValue) * 24; // 12px to 36px
                const opacity = 0.5 + (topic.value / maxValue) * 0.5; // 50% to 100%
                const colors = [
                  'text-blue-600',
                  'text-purple-600',
                  'text-green-600',
                  'text-orange-600',
                  'text-red-600',
                  'text-indigo-600',
                  'text-pink-600',
                  'text-teal-600',
                ];
                const color = colors[index % colors.length];

                return (
                  <span
                    key={topic.text}
                    className={`font-semibold ${color} hover:scale-110 transition cursor-default`}
                    style={{
                      fontSize: `${size}px`,
                      opacity,
                    }}
                    title={`${topic.value} Erwähnungen`}
                  >
                    {topic.text}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>Noch keine Daten verfügbar</p>
            </div>
          )}
        </div>

        {/* Companies List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Unternehmen</h2>
          <p className="text-sm text-gray-600 mb-6">Übersicht aller registrierten Unternehmen</p>

          {stats.companies.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {stats.companies.map((company) => (
                <div
                  key={company.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{company.name}</h3>
                      {company.domain && (
                        <p className="text-sm text-gray-600 mt-1">{company.domain}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          <span className="font-medium">{company.userCount}</span> Nutzer
                        </span>
                        <span className="text-xs text-gray-500">
                          <span className="font-medium">{company.documentCount}</span> Dokumente
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                        Aktiv
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="font-medium">Noch keine Unternehmen registriert</p>
              <p className="text-sm mt-1">Unternehmen werden automatisch angelegt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
