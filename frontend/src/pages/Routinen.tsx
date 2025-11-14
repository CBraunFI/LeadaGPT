import { useState, useEffect } from 'react';
import { routinenAPI } from '../services/api';
import { Routine } from '../types';

const Routinen = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingRoutine, setCheckingRoutine] = useState<string | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const data = await routinenAPI.getAll();
      setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (routineId: string) => {
    try {
      setCheckingRoutine(routineId);
      const today = new Date().toISOString().split('T')[0];

      await routinenAPI.addEntry(routineId, {
        date: today,
        completed: true,
      });

      loadRoutines();
    } catch (error) {
      console.error('Error checking in routine:', error);
    } finally {
      setCheckingRoutine(null);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Täglich',
      weekly: 'Wöchentlich',
      monthly: 'Monatlich',
      custom: 'Individuell',
    };
    return labels[frequency] || frequency;
  };

  const wasCompletedToday = (routine: Routine) => {
    const today = new Date().toISOString().split('T')[0];
    return routine.entries?.some(
      (entry) => entry.date.split('T')[0] === today && entry.completed
    );
  };

  const getCompletionStats = (routine: Routine) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekEntries = routine.entries?.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo && entry.completed;
    }) || [];

    return {
      thisWeek: thisWeekEntries.length,
      target: routine.target || 0,
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Routinen & Gewohnheiten</h1>
        <div className="text-center py-12" style={{ color: 'var(--fg-secondary)' }}>
          Lädt...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Routinen & Gewohnheiten</h1>
        <p style={{ color: 'var(--fg-secondary)' }}>
          Verfolgen Sie Ihre wiederkehrenden Aktivitäten und bauen Sie nachhaltige Gewohnheiten auf.
        </p>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4" style={{ color: 'var(--fg-secondary)' }}>
            <p className="mb-2">Noch keine Routinen angelegt.</p>
            <p>Routinen werden automatisch vorgeschlagen, wenn Sie im Chat über wiederkehrende Aktivitäten sprechen.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => {
            const completedToday = wasCompletedToday(routine);
            const stats = getCompletionStats(routine);

            return (
              <div
                key={routine.id}
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--fg-primary)' }}>
                    {routine.title}
                  </h3>

                  {routine.description && (
                    <p className="text-sm mb-3" style={{ color: 'var(--fg-secondary)' }}>
                      {routine.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--fg-secondary)' }}>
                    <span>📅 {getFrequencyLabel(routine.frequency)}</span>
                    {routine.target && (
                      <span>• Ziel: {routine.target}x/Woche</span>
                    )}
                  </div>

                  {routine.target && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--fg-secondary)' }}>
                        <span>Diese Woche</span>
                        <span>{stats.thisWeek}/{stats.target}</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            backgroundColor: 'var(--accent)',
                            width: `${Math.min((stats.thisWeek / stats.target) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleCheckIn(routine.id)}
                  disabled={completedToday || checkingRoutine === routine.id}
                  className="w-full py-2 px-4 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: completedToday ? '#22c55e' : 'var(--accent)',
                    color: 'white',
                  }}
                >
                  {checkingRoutine === routine.id
                    ? 'Speichert...'
                    : completedToday
                    ? '✓ Heute erledigt'
                    : 'Als erledigt markieren'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Routinen;
