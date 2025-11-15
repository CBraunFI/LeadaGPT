import React, { useEffect, useState } from 'react';
import { adminUsersAPI, adminCompaniesAPI, adminUserManagementAPI } from '../../services/adminApi';
import type { AdminUser, Company } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Companies for assignment dropdown
  const [companies, setCompanies] = useState<Company[]>([]);

  // Promotion modal state
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUserForPromotion, setSelectedUserForPromotion] = useState<AdminUser | null>(null);
  const [promotionName, setPromotionName] = useState('');
  const [promotionPassword, setPromotionPassword] = useState('');
  const [promoting, setPromoting] = useState(false);

  const limit = 20;

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, [page]);

  const loadCompanies = async () => {
    try {
      const companiesData = await adminCompaniesAPI.getList();
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * limit;
      const data = await adminUsersAPI.getList({ limit, offset });
      setUsers(data.users);
      setTotal(data.total);
      setError('');
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Fehler beim Laden der Nutzerdaten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Möchten Sie das Passwort dieses Nutzers wirklich zurücksetzen?')) {
      return;
    }

    try {
      const result = await adminUsersAPI.resetPassword(userId);
      alert(`Passwort erfolgreich zurückgesetzt!\n\nNeues temporäres Passwort: ${result.tempPassword}\n\nBitte notieren Sie sich dieses Passwort und übermitteln Sie es sicher an den Nutzer.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Zurücksetzen des Passworts');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Möchten Sie den Nutzer "${email}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      await adminUsersAPI.delete(userId);
      alert('Nutzer erfolgreich gelöscht');
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Löschen des Nutzers');
    }
  };

  const handleCompanyAssignment = async (userId: string, companyId: string | null) => {
    try {
      await adminUserManagementAPI.assignToCompany(userId, companyId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Zuweisen des Unternehmens');
    }
  };

  const handleOpenPromoteModal = (user: AdminUser) => {
    setSelectedUserForPromotion(user);
    setPromotionName('');
    setPromotionPassword('');
    setShowPromoteModal(true);
  };

  const handlePromoteToAdmin = async () => {
    if (!selectedUserForPromotion) return;

    if (!promotionName.trim()) {
      alert('Bitte geben Sie einen Namen für den Admin ein');
      return;
    }

    if (promotionPassword.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (!selectedUserForPromotion.company) {
      alert('Der Nutzer muss zuerst einem Unternehmen zugeordnet werden');
      return;
    }

    try {
      setPromoting(true);
      await adminUserManagementAPI.promoteToAdmin(selectedUserForPromotion.id, {
        name: promotionName,
        password: promotionPassword,
      });

      alert(`${selectedUserForPromotion.email} wurde erfolgreich zu Company Admin ernannt!`);
      setShowPromoteModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fehler beim Ernennen zum Admin');
    } finally {
      setPromoting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAuthProvider = (provider: string) => {
    const providers: Record<string, string> = {
      local: 'E-Mail',
      google: 'Google',
      microsoft: 'Microsoft',
    };
    return providers[provider] || provider;
  };

  const totalPages = Math.ceil(total / limit);

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Nutzerdaten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nutzerverwaltung</h1>
          <p className="text-gray-600 mt-1">{total} Nutzer gesamt</p>
        </div>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Aktualisieren
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle / Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unternehmen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anmeldung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstanmeldung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zuletzt genutzt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-medium">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          {formatAuthProvider(user.authProvider)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.profile?.role || '-'}</div>
                    {user.profile?.teamSize && (
                      <div className="text-xs text-gray-500">Team: {user.profile.teamSize} Personen</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.company?.id || ''}
                      onChange={(e) => handleCompanyAssignment(user.id, e.target.value || null)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Kein Unternehmen</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatAuthProvider(user.authProvider)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastUsed ? formatDate(user.lastUsed) : 'Noch nicht verwendet'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenPromoteModal(user)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Zu Company Admin machen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </button>
                      {user.authProvider === 'local' && (
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Passwort zurücksetzen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Nutzer löschen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Seite <span className="font-medium">{page}</span> von{' '}
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Promote to Admin Modal */}
      {showPromoteModal && selectedUserForPromotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Nutzer zu Company Admin machen
            </h2>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Nutzer:</span> {selectedUserForPromotion.email}
              </p>
              {selectedUserForPromotion.company && (
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Unternehmen:</span> {selectedUserForPromotion.company.name}
                </p>
              )}
            </div>

            {!selectedUserForPromotion.company && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Dieser Nutzer muss zuerst einem Unternehmen zugeordnet werden.
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin-Name *
                </label>
                <input
                  type="text"
                  value={promotionName}
                  onChange={(e) => setPromotionName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin-Passwort * (min. 6 Zeichen)
                </label>
                <input
                  type="password"
                  value={promotionPassword}
                  onChange={(e) => setPromotionPassword(e.target.value)}
                  placeholder="Sicheres Passwort"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Der Nutzer kann sich mit diesem Passwort im Company-Admin-Portal anmelden.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={promoting}
              >
                Abbrechen
              </button>
              <button
                onClick={handlePromoteToAdmin}
                disabled={promoting || !selectedUserForPromotion.company}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {promoting ? 'Ernennen...' : 'Zu Admin machen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
