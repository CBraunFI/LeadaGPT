import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { themenpaketeAPI } from '../services/api';
import { ThemenPaket } from '../types';

const Themenpakete = () => {
  const [themenpakete, setThemenpakete] = useState<ThemenPaket[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadThemenpakete();
  }, []);

  const loadThemenpakete = async () => {
    try {
      setLoading(true);
      const data = await themenpaketeAPI.getAll();
      setThemenpakete(data);
    } catch (error) {
      console.error('Error loading Themenpakete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      setStartingId(id);
      const response = await themenpaketeAPI.start(id);

      // Navigate to the chat session
      if (response.chatSessionId) {
        navigate(`/chat/${response.chatSessionId}`);
      } else {
        // Fallback: just reload and go to chat
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error starting Themenpaket:', error);
      alert('Fehler beim Starten des Themenpakets');
    } finally {
      setStartingId(null);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await themenpaketeAPI.pause(id);
      loadThemenpakete();
    } catch (error) {
      console.error('Error pausing Themenpaket:', error);
    }
  };

  const handleContinue = async (id: string) => {
    try {
      await themenpaketeAPI.continue(id);
      loadThemenpakete();
    } catch (error) {
      console.error('Error continuing Themenpaket:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: '#22c55e', text: 'white', label: 'Aktiv' },
      paused: { bg: '#f59e0b', text: 'white', label: 'Pausiert' },
      completed: { bg: '#3b82f6', text: 'white', label: 'Abgeschlossen' },
      not_started: { bg: 'var(--bg-tertiary)', text: 'var(--fg-secondary)', label: 'Nicht gestartet' },
    };

    const style = styles[status] || styles.not_started;

    return (
      <span
        className="px-3 py-1 rounded-full text-sm font-medium"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Themenpakete</h1>
        <div className="text-center py-12" style={{ color: 'var(--fg-secondary)' }}>
          Lädt...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Themenpakete</h1>
        <p style={{ color: 'var(--fg-secondary)' }}>
          Wählen Sie ein Themenpaket aus, um Ihre Führungskompetenzen zu entwickeln.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themenpakete.map((tp) => (
          <div
            key={tp.id}
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="mb-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold flex-1" style={{ color: 'var(--fg-primary)' }}>
                  {tp.title}
                </h3>
                {getStatusBadge(tp.status)}
              </div>

              {tp.category && (
                <div className="text-sm mb-2" style={{ color: 'var(--accent)' }}>
                  {tp.category}
                </div>
              )}

              <p className="text-sm mb-4" style={{ color: 'var(--fg-secondary)' }}>
                {tp.description}
              </p>

              <div className="flex gap-4 text-sm mb-4" style={{ color: 'var(--fg-secondary)' }}>
                <div>
                  📅 {tp.duration} Tage
                </div>
                <div>
                  💡 {tp.unitsPerDay}x täglich
                </div>
              </div>

              {tp.progress && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--fg-secondary)' }}>
                    <span>Fortschritt</span>
                    <span>Tag {tp.progress.currentDay}/{tp.duration}</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: 'var(--accent)',
                        width: `${(tp.progress.currentDay / tp.duration) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {tp.status === 'not_started' && (
                <button
                  onClick={() => handleStart(tp.id)}
                  disabled={startingId === tp.id}
                  className="flex-1 py-2 px-4 rounded font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                  }}
                >
                  {startingId === tp.id ? 'Startet...' : 'Starten'}
                </button>
              )}

              {tp.status === 'active' && (
                <>
                  <button
                    onClick={() => handleStart(tp.id)}
                    className="flex-1 py-2 px-4 rounded font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                    }}
                  >
                    Fortsetzen
                  </button>
                  <button
                    onClick={() => handlePause(tp.id)}
                    className="py-2 px-4 rounded font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--fg-primary)',
                    }}
                  >
                    Pausieren
                  </button>
                </>
              )}

              {tp.status === 'paused' && (
                <button
                  onClick={() => handleContinue(tp.id)}
                  className="flex-1 py-2 px-4 rounded font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                  }}
                >
                  Fortsetzen
                </button>
              )}

              {tp.status === 'completed' && (
                <button
                  onClick={() => handleStart(tp.id)}
                  className="flex-1 py-2 px-4 rounded font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--fg-primary)',
                  }}
                >
                  Erneut starten
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {themenpakete.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--fg-secondary)' }}>
          Keine Themenpakete verfügbar.
        </div>
      )}
    </div>
  );
};

export default Themenpakete;
