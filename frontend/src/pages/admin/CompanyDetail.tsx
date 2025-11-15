import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminCompaniesAPI } from '../../services/adminApi';
import type { Company, AdminUser } from '../../types';

type TabType = 'overview' | 'prompt' | 'documents' | 'admins' | 'users';

interface CompanyDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  metadata?: string;
}

const CompanyDetail: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit states
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedDomain, setEditedDomain] = useState('');
  const [editedLogoUrl, setEditedLogoUrl] = useState('');
  const [editedAccentColor, setEditedAccentColor] = useState('');
  const [editedCorporatePrompt, setEditedCorporatePrompt] = useState('');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const companyData = await adminCompaniesAPI.getById(companyId);
      setCompany(companyData);

      // Initialize edit fields
      setEditedName(companyData.name);
      setEditedDescription(companyData.description || '');
      setEditedDomain(companyData.domain || '');
      setEditedLogoUrl(companyData.logoUrl || '');
      setEditedAccentColor(companyData.accentColor || '#3B82F6');
      setEditedCorporatePrompt(companyData.corporatePrompt || '');

      // Load related data
      const [usersData, adminsData, documentsData] = await Promise.all([
        adminCompaniesAPI.getUsers(companyId),
        adminCompaniesAPI.getAdmins(companyId),
        adminCompaniesAPI.getDocuments(companyId),
      ]);

      setUsers(usersData);
      setAdmins(adminsData);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Failed to load company:', error);
      alert('Fehler beim Laden der Unternehmensdaten');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOverview = async () => {
    if (!companyId || !editedName.trim()) return;

    try {
      setSaving(true);
      await adminCompaniesAPI.update(companyId, {
        name: editedName,
        description: editedDescription || undefined,
        domain: editedDomain || undefined,
        logoUrl: editedLogoUrl || undefined,
        accentColor: editedAccentColor || undefined,
      });

      await loadCompanyData();
      alert('Unternehmensdaten erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update company:', error);
      alert('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCorporatePrompt = async () => {
    if (!companyId) return;

    try {
      setSaving(true);
      await adminCompaniesAPI.updateCorporatePrompt(
        companyId,
        editedCorporatePrompt.trim() || null
      );

      await loadCompanyData();
      alert('Corporate Prompt erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update corporate prompt:', error);
      alert('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!companyId || !selectedFile) return;

    try {
      setUploading(true);
      await adminCompaniesAPI.uploadDocument(companyId, selectedFile);

      setSelectedFile(null);
      await loadCompanyData();
      alert('Dokument erfolgreich hochgeladen');
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!companyId) return;
    if (!confirm('Dokument wirklich löschen?')) return;

    try {
      await adminCompaniesAPI.deleteDocument(companyId, documentId);
      await loadCompanyData();
      alert('Dokument gelöscht');
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Unternehmensdaten...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unternehmen nicht gefunden</p>
        <button
          onClick={() => navigate('/admin/companies')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/companies')}
          className="text-blue-600 hover:underline mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zur Übersicht
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
        <p className="text-gray-600 mt-1">{company.domain || 'Keine Domain'}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          {[
            { id: 'overview', label: 'Übersicht' },
            { id: 'prompt', label: 'Corporate Prompt' },
            { id: 'documents', label: 'Dokumente' },
            { id: 'admins', label: 'Admins' },
            { id: 'users', label: 'Nutzer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Unternehmensdetails</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain
              </label>
              <input
                type="text"
                value={editedDomain}
                onChange={(e) => setEditedDomain(e.target.value)}
                placeholder="z.B. example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={editedLogoUrl}
                onChange={(e) => setEditedLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Akzentfarbe
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editedAccentColor}
                  onChange={(e) => setEditedAccentColor(e.target.value)}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={editedAccentColor}
                  onChange={(e) => setEditedAccentColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={handleSaveOverview}
                disabled={saving || !editedName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Speichere...' : 'Änderungen speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Corporate Prompt Tab */}
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Corporate Prompt</h2>
              <p className="text-sm text-gray-600 mb-4">
                Dieser Prompt wird allen Nutzern des Unternehmens bei KI-Anfragen mitgegeben.
              </p>
            </div>

            <textarea
              value={editedCorporatePrompt}
              onChange={(e) => setEditedCorporatePrompt(e.target.value)}
              rows={12}
              placeholder="Geben Sie hier unternehmensspezifische Anweisungen ein..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />

            <div className="pt-4 border-t">
              <button
                onClick={handleSaveCorporatePrompt}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Speichere...' : 'Prompt speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unternehmensdokumente</h2>
              <p className="text-sm text-gray-600 mb-4">
                Diese Dokumente werden allen Nutzern des Unternehmens als Kontext zur Verfügung gestellt.
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Neues Dokument hochladen</h3>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt"
                  className="flex-1 text-sm"
                />
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {uploading ? 'Lädt hoch...' : 'Hochladen'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Unterstützte Formate: PDF, DOC, DOCX, TXT
              </p>
            </div>

            {/* Documents List */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Hochgeladene Dokumente ({documents.length})
              </h3>

              {documents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Noch keine Dokumente hochgeladen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.filename}</p>
                        <p className="text-xs text-gray-500">
                          {doc.fileType} • {(doc.fileSize / 1024).toFixed(1)} KB •
                          Hochgeladen am {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="ml-4 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Löschen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Company Admins</h2>
              <p className="text-sm text-gray-600 mb-4">
                Nutzer, die Administrationszugriff für dieses Unternehmen haben.
              </p>
            </div>

            {admins.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Noch keine Company Admins vorhanden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{admin.name}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Erstellt am {new Date(admin.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      Company Admin
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Nutzer</h2>
              <p className="text-sm text-gray-600 mb-4">
                Alle Nutzer, die diesem Unternehmen zugeordnet sind.
              </p>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Noch keine Nutzer zugeordnet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      {user.profile && (
                        <p className="text-sm text-gray-600">
                          {user.profile.firstName || 'Kein Name'}
                          {user.profile.role && ` • ${user.profile.role}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Registriert am {new Date(user.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetail;
