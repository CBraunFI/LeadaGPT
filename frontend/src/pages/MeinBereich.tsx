import { useState, useEffect, useRef } from 'react';
import { documentsAPI } from '../services/api';
import { Document } from '../types';

const MeinBereich = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsAPI.getAll('personal');
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Nicht unterstütztes Dateiformat. Erlaubt: PDF, DOCX, TXT');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Datei ist zu groß. Maximale Größe: 10 MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      await documentsAPI.upload(file, 'personal');
      setUploadSuccess(`${file.name} erfolgreich hochgeladen!`);

      // Reload documents list
      await loadDocuments();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(
        error.response?.data?.error || 'Fehler beim Hochladen der Datei'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string, filename: string) => {
    if (!confirm(`Möchten Sie "${filename}" wirklich löschen?`)) return;

    try {
      await documentsAPI.delete(documentId);
      setDocuments(documents.filter((d) => d.id !== documentId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen des Dokuments');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string): string => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mein Bereich</h1>
        <p style={{ color: 'var(--fg-secondary)' }}>
          Laden Sie persönliche Dokumente hoch (CV, Zeugnisse, Arbeitsproben), die Ihr
          KI-Coach bei der Beratung berücksichtigen soll.
        </p>
      </div>

      {/* Upload Section */}
      <div
        className="mb-8 p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <h2 className="text-xl font-bold mb-4">Dokument hochladen</h2>

        <div className="mb-4">
          <label
            htmlFor="file-upload"
            className="block cursor-pointer"
          >
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-opacity-50 transition-all"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="text-4xl mb-2">📤</div>
              <div className="font-medium mb-1">
                Klicken Sie hier zum Hochladen
              </div>
              <div className="text-sm" style={{ color: 'var(--fg-secondary)' }}>
                PDF, DOCX oder TXT • Maximal 10 MB
              </div>
            </div>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {isUploading && (
          <div
            className="p-3 rounded border text-center"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border)',
              color: 'var(--accent)',
            }}
          >
            Wird hochgeladen und verarbeitet...
          </div>
        )}

        {uploadSuccess && (
          <div
            className="p-3 rounded border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            ✓ {uploadSuccess}
          </div>
        )}

        {uploadError && (
          <div
            className="p-3 rounded border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: '#ef4444',
              color: '#ef4444',
            }}
          >
            ✗ {uploadError}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <h2 className="text-xl font-bold mb-4">
          Hochgeladene Dokumente ({documents.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-8" style={{ color: 'var(--fg-secondary)' }}>
            Lädt Dokumente...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--fg-secondary)' }}>
            Noch keine Dokumente hochgeladen
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded border flex items-start justify-between"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">{getFileIcon(doc.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{doc.filename}</div>
                    <div
                      className="text-sm mt-1 flex flex-wrap gap-3"
                      style={{ color: 'var(--fg-secondary)' }}
                    >
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                      {doc.metadata?.wordCount && (
                        <>
                          <span>•</span>
                          <span>{doc.metadata.wordCount.toLocaleString()} Wörter</span>
                        </>
                      )}
                      {doc.metadata?.pageCount && (
                        <>
                          <span>•</span>
                          <span>{doc.metadata.pageCount} Seiten</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  className="text-red-500 hover:text-red-700 ml-4 text-sm font-medium"
                >
                  Löschen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div
        className="mt-6 p-4 rounded border text-sm"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
          color: 'var(--fg-secondary)',
        }}
      >
        <div className="font-semibold mb-2">ℹ️ Hinweise:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Ihr KI-Coach nutzt den Inhalt dieser Dokumente für personalisierte Empfehlungen</li>
          <li>Alle Dokumente werden sicher gespeichert und nur für Sie verwendet</li>
          <li>Sie können Dokumente jederzeit löschen</li>
        </ul>
      </div>
    </div>
  );
};

export default MeinBereich;
