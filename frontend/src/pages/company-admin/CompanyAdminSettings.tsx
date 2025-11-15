import React, { useEffect, useState } from 'react';
import { companyAdminAPI, type CompanyInfo, type CompanyDocument } from '../../services/companyAdminApi';

const CompanyAdminSettings: React.FC = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [corporatePrompt, setCorporatePrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [info, docs] = await Promise.all([
        companyAdminAPI.getInfo(),
        companyAdminAPI.getDocuments(),
      ]);
      setCompanyInfo(info);
      setDocuments(docs);
      setCorporatePrompt(info.corporatePrompt || '');
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Fehler beim Laden der Einstellungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCorporatePrompt = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      await companyAdminAPI.updateCorporatePrompt(corporatePrompt || null);

      setSuccessMessage('Corporate Prompt erfolgreich gespeichert');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving corporate prompt:', err);
      setError('Fehler beim Speichern des Corporate Prompts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError('');
      setSuccessMessage('');

      await companyAdminAPI.uploadDocument(file);

      setSuccessMessage('Dokument erfolgreich hochgeladen');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reload documents
      const docs = await companyAdminAPI.getDocuments();
      setDocuments(docs);

      // Reset file input
      event.target.value = '';
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError('Fehler beim Hochladen des Dokuments');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Dokument wirklich löschen?')) return;

    try {
      setError('');
      await companyAdminAPI.deleteDocument(documentId);

      setSuccessMessage('Dokument erfolgreich gelöscht');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reload documents
      const docs = await companyAdminAPI.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError('Fehler beim Löschen des Dokuments');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Einstellungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mein Unternehmen</h1>
        <p className="text-gray-600 mt-1">Unternehmensweite Einstellungen und Dokumente</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Company Info */}
      {companyInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Unternehmensinformationen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-lg font-medium text-gray-900">{companyInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nutzer</p>
              <p className="text-lg font-medium text-gray-900">{companyInfo._count.users}</p>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Prompt */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Corporate Prompt</h2>
        <p className="text-sm text-gray-600 mb-4">
          Der Corporate Prompt ergänzt den System-Prompt und wird auf alle Nutzer Ihres Unternehmens angewendet. Er kann unternehmens-spezifische Richtlinien und Kontext hinzufügen, aber nicht die System-Constraints überschreiben.
        </p>

        <textarea
          value={corporatePrompt}
          onChange={(e) => setCorporatePrompt(e.target.value)}
          className="w-full h-64 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
          placeholder="Optional: Unternehmens-spezifische Anweisungen für die KI..."
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveCorporatePrompt}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSaving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Company Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Unternehmens-Dokumente</h2>
            <p className="text-sm text-gray-600 mt-1">
              Diese Dokumente stehen allen Nutzern zur Verfügung und werden in KI-Antworten berücksichtigt.
            </p>
          </div>

          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
            {isUploading ? 'Hochladen...' : 'Dokument hochladen'}
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">Noch keine Dokumente hochgeladen</p>
            <p className="text-sm text-gray-500 mt-1">Laden Sie PDF, DOCX oder TXT Dateien hoch</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-sm text-gray-500">
                      {doc.fileType.toUpperCase()} • {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Löschen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyAdminSettings;
