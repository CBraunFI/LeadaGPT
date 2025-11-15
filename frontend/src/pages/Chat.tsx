import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI, routinenAPI, themenpaketeAPI } from '../services/api';
import { ChatSession } from '../types';
import { useStore } from '../store/useStore';
import MessageContent from '../components/MessageContent';

// Prompt suggestion pool
const PROMPT_SUGGESTIONS = [
  'Zeig mir, wie du mich unterstützen kannst!',
  'Ich möchte mich zu einem bestimmten Thema fortbilden',
  'Wie kann ich mein Team besser motivieren?',
  'Hilf mir bei schwierigen Gesprächen',
  'Ich brauche Tipps für effektives Zeitmanagement',
  'Wie gehe ich mit Konflikten im Team um?',
  'Zeig mir Techniken für konstruktives Feedback',
  'Unterstütze mich beim Aufbau neuer Routinen',
  'Wie delegiere ich effektiv?',
  'Ich möchte meine Führungskompetenz entwickeln',
];

// Get random prompts from pool
const getRandomPrompts = (count: number = 3): string[] => {
  const shuffled = [...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const Chat = () => {
  const { user } = useStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [savingRoutine, setSavingRoutine] = useState<string | null>(null);
  const [promptSuggestions] = useState<string[]>(getRandomPrompts(3));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sessionId } = useParams<{ sessionId: string }>();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    // If we have a sessionId from URL, load that session
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        loadSession(sessionId);
      }
    }
  }, [sessionId, sessions]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await chatAPI.getSessions();
      console.log('Sessions data:', data);
      setSessions(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !currentSession) {
        loadSession(data[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const session = await chatAPI.getSession(sessionId);
      setCurrentSession(session);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const newSession = await chatAPI.createSession();
      console.log('New session created:', newSession);
      // Ensure messages array exists
      const sessionWithMessages = {
        ...newSession,
        messages: newSession.messages || []
      };
      setSessions([sessionWithMessages, ...sessions]);
      setCurrentSession(sessionWithMessages);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentSession || isSending) return;

    const userMessage = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      const updatedSession = await chatAPI.sendMessage(currentSession.id, userMessage);
      setCurrentSession(updatedSession);

      // Update sessions list
      setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSending(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Möchten Sie diese Chat-Session wirklich löschen?')) return;

    try {
      await chatAPI.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setCurrentSession(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSaveRoutine = async (messageId: string, routineData: any) => {
    try {
      setSavingRoutine(messageId);
      await routinenAPI.create(routineData);
      alert('Routine erfolgreich gespeichert!');
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Fehler beim Speichern der Routine');
    } finally {
      setSavingRoutine(null);
    }
  };

  const handleAdvance = async (themenpaketId: string) => {
    try {
      setIsSending(true);
      const result = await themenpaketeAPI.advance(themenpaketId);

      if (result.completed) {
        alert('Herzlichen Glückwunsch! Sie haben dieses Themenpaket abgeschlossen!');
      }

      // Reload the current session to get the new unit
      if (currentSession) {
        loadSession(currentSession.id);
      }
    } catch (error) {
      console.error('Error advancing to next unit:', error);
      alert('Fehler beim Fortfahren zur nächsten Einheit');
    } finally {
      setIsSending(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
  };

  const getGreeting = (): string => {
    if (user?.profile?.firstName) {
      return `Hallo ${user.profile.firstName}! Wie kann ich Ihnen heute helfen?`;
    }
    return 'Willkommen! Wie kann ich Ihnen heute helfen?';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Sidebar with Sessions */}
      <div className="w-80 border-r" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={createNewSession}
            className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white'
            }}
          >
            + Neuer Chat
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {isLoading ? (
            <div className="p-4 text-center" style={{ color: 'var(--fg-secondary)' }}>
              Lädt...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center" style={{ color: 'var(--fg-secondary)' }}>
              Noch keine Chats vorhanden
            </div>
          ) : (
            sessions.map((session) => {
              const chatIcon = {
                'profil': '👤',
                'ki-briefing': '📊',
                'themenpaket': '📚',
                'routine': '✓',
                'general': '💬',
              }[session.chatType || 'general'];

              return (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className="p-4 border-b cursor-pointer hover:bg-opacity-50 transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: currentSession?.id === session.id ? 'var(--bg-secondary)' : 'transparent'
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-lg">{chatIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate">
                            {session.title || 'Neuer Chat'}
                          </div>
                          {session.isPinned && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: 'var(--accent)',
                                color: 'white',
                              }}
                            >
                              Fixiert
                            </span>
                          )}
                        </div>
                        <div className="text-sm mt-1" style={{ color: 'var(--fg-secondary)' }}>
                          {formatTime(session.createdAt)}
                        </div>
                      </div>
                    </div>
                    {!session.isPinned && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!currentSession ? (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--fg-secondary)' }}>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Willkommen bei Leada Chat</h2>
              <p className="mb-4">Ihr KI-gestützter Coaching-Partner für Führungskräfte</p>
              <button
                onClick={createNewSession}
                className="py-2 px-6 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'white'
                }}
              >
                Chat starten
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!currentSession.messages || currentSession.messages.length === 0 ? (
                <div className="text-center space-y-6">
                  <p className="text-lg" style={{ color: 'var(--fg-secondary)' }}>
                    {getGreeting()}
                  </p>
                  <p style={{ color: 'var(--fg-secondary)' }}>
                    Stellen Sie mir eine Frage zu Führungsthemen, Ihrer Entwicklung oder starten Sie ein Themenpaket.
                  </p>

                  {/* Prompt Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
                    {promptSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptClick(suggestion)}
                        className="p-4 rounded-lg border-2 text-left transition-all hover:scale-105"
                        style={{
                          borderColor: 'var(--border)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--fg-primary)'
                        }}
                      >
                        <div className="font-medium">{suggestion}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                (currentSession.messages || [])
                  .filter(msg => msg.role !== 'system')
                  .map((msg) => {
                    // Parse metadata
                    const metadata = msg.metadata && typeof msg.metadata === 'string'
                      ? JSON.parse(msg.metadata)
                      : msg.metadata;

                    // Check if this is a Themenpaket unit
                    const isThemenPaketUnit = metadata?.type === 'themenpaket_unit';

                    // Check if this has a routine suggestion
                    const hasRoutineSuggestion = metadata?.routine_suggestion;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${
                            msg.role === 'user'
                              ? 'rounded-br-none'
                              : 'rounded-bl-none'
                          } ${isThemenPaketUnit ? 'border-2' : ''}`}
                          style={{
                            backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                            color: msg.role === 'user' ? 'white' : 'var(--fg-primary)',
                            borderColor: isThemenPaketUnit ? 'var(--accent)' : 'transparent',
                          }}
                        >
                          {isThemenPaketUnit && metadata && (
                            <div
                              className="text-xs font-semibold mb-2 pb-2 border-b"
                              style={{
                                color: 'var(--accent)',
                                borderColor: 'var(--accent)',
                                opacity: 0.8
                              }}
                            >
                              Themenpaket-Einheit • Tag {metadata.day} • Teil {metadata.unit}
                            </div>
                          )}
                          {msg.role === 'assistant' ? (
                            <MessageContent content={msg.content} />
                          ) : (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          )}

                          {hasRoutineSuggestion && (
                            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                              <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                                <div className="flex-1">
                                  <div className="font-semibold mb-1" style={{ color: 'var(--fg-primary)' }}>
                                    {metadata.routine_suggestion.title}
                                  </div>
                                  <div className="text-sm mb-2" style={{ color: 'var(--fg-secondary)' }}>
                                    {metadata.routine_suggestion.description}
                                  </div>
                                  <div className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
                                    {metadata.routine_suggestion.frequency === 'daily' ? 'Täglich' :
                                     metadata.routine_suggestion.frequency === 'weekly' ? 'Wöchentlich' :
                                     metadata.routine_suggestion.frequency === 'monthly' ? 'Monatlich' : 'Individuell'}
                                    {metadata.routine_suggestion.target && ` • ${metadata.routine_suggestion.target}x/Woche`}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleSaveRoutine(msg.id, metadata.routine_suggestion)}
                                disabled={savingRoutine === msg.id}
                                className="mt-3 w-full py-2 px-4 rounded font-medium transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: 'var(--accent)',
                                  color: 'white'
                                }}
                              >
                                {savingRoutine === msg.id ? 'Speichert...' : 'Als Routine speichern'}
                              </button>
                            </div>
                          )}

                          {isThemenPaketUnit && metadata?.themenpaket_id && (
                            <div className="mt-4">
                              <button
                                onClick={() => handleAdvance(metadata.themenpaket_id)}
                                disabled={isSending}
                                className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: 'var(--accent)',
                                  color: 'white'
                                }}
                              >
                                {isSending ? 'Lädt...' : 'Weiter →'}
                              </button>
                            </div>
                          )}

                          <div
                            className="text-xs mt-2 opacity-70"
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
              {isSending && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[70%] rounded-lg rounded-bl-none p-4"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent)', animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ihre Nachricht..."
                  disabled={isSending}
                  className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--fg-primary)'
                  }}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white'
                  }}
                >
                  {isSending ? 'Sendet...' : 'Senden'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default Chat;
