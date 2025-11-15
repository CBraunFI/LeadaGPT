import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import api from '../services/api';
import MessageContent from '../components/MessageContent';
import type { ChatSession, Message, ThemenPaket } from '../types';

// Pool von Prompt-Vorschlägen
const PROMPT_SUGGESTIONS = [
  'Zeig mir, wie du mich unterstützen kannst!',
  'Ich möchte mich zu einem bestimmten Thema fortbilden',
  'Ich möchte ein bestimmtes Ziel erreichen',
  'Ich möchte eine konkrete Situation besprechen',
  'Ich möchte ein Gespräch vorbereiten',
  'Wie kann ich meine Führungskompetenzen verbessern?',
  'Hilf mir bei der Teamentwicklung',
  'Ich brauche Feedback zu einer Entscheidung',
  'Wie gehe ich mit Konflikten um?',
  'Welche Routinen empfiehlst du mir?',
];

// Hilfsfunktion: 3 zufällige Prompts auswählen
const getRandomPrompts = (count: number = 3): string[] => {
  const shuffled = [...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const Chat = () => {
  const { user } = useStore();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [activeThemenpaket, setActiveThemenpaket] = useState<ThemenPaket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll zu neuen Nachrichten
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initiale Prompt-Vorschläge laden
  useEffect(() => {
    setPromptSuggestions(getRandomPrompts(3));
  }, []);

  // Aktive Themenpakete laden
  useEffect(() => {
    const loadActiveThemenpaket = async () => {
      try {
        const response = await api.get('/themenpakete');
        const active = response.data.find(
          (tp: ThemenPaket) => tp.status === 'active'
        );
        setActiveThemenpaket(active || null);
      } catch (error) {
        console.error('Error loading active themenpaket:', error);
      }
    };

    loadActiveThemenpaket();
  }, []);

  // Session laden oder erstellen
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await api.get('/chat/sessions');
        const sessions = response.data;

        if (sessions.length > 0) {
          // Neueste Session verwenden
          const latest = sessions[0];
          const sessionResponse = await api.get(`/chat/sessions/${latest.id}`);
          setCurrentSession(sessionResponse.data);
          setMessages(sessionResponse.data.messages);
        } else {
          // Neue Session erstellen
          const newSession = await api.post('/chat/sessions', {
            title: 'Neue Unterhaltung',
          });
          setCurrentSession(newSession.data);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();
  }, []);

  // Nachricht senden
  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentSession || loading) return;

    setLoading(true);
    setInput('');

    try {
      const response = await api.post(
        `/chat/sessions/${currentSession.id}/messages`,
        { content }
      );

      // Beide Nachrichten (user + assistant) hinzufügen
      setMessages((prev) => [...prev, ...response.data]);

      // Nach ein paar Nachrichten: personalisierte Prompts einbauen
      if (messages.length > 6) {
        setPromptSuggestions([
          ...getRandomPrompts(2),
          'Lass uns über meine Fortschritte sprechen',
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prompt-Vorschlag klicken
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Enter-Taste zum Senden
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Weiter-Button: Nächster Impuls
  const handleNextImpulse = async () => {
    if (!activeThemenpaket || loading) return;

    setLoading(true);

    try {
      // Nächste Lerneinheit abrufen
      const unitResponse = await api.get(
        `/themenpakete/${activeThemenpaket.id}/next-unit`
      );
      const { unit, progress } = unitResponse.data;

      // Automatisch als Nachricht senden
      const impulseMessage = `Bitte gib mir den nächsten Impuls aus meinem Themenpaket "${activeThemenpaket.title}".`;

      const response = await api.post(
        `/chat/sessions/${currentSession!.id}/messages`,
        { content: impulseMessage }
      );

      setMessages((prev) => [...prev, ...response.data]);

      // Fortschritt aktualisieren
      await api.post(`/themenpakete/${activeThemenpaket.id}/advance`);

      // Themenpaket-Status aktualisieren
      const updatedTP = await api.get('/themenpakete');
      const active = updatedTP.data.find(
        (tp: ThemenPaket) => tp.status === 'active'
      );
      setActiveThemenpaket(active || null);
    } catch (error) {
      console.error('Error getting next impulse:', error);
    } finally {
      setLoading(false);
    }
  };

  // Persönliche Begrüßung
  const getGreeting = () => {
    const firstName = user?.profile?.firstName;
    if (firstName) {
      return `Wie kann ich dich unterstützen, ${firstName}?`;
    }
    return 'Wie kann ich dich unterstützen?';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat-Bereich */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--fg-primary)' }}>
              {getGreeting()}
            </h2>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'text-white'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
                style={
                  message.role === 'user'
                    ? { backgroundColor: 'var(--accent)' }
                    : { color: 'var(--fg-primary)' }
                }
              >
                {message.role === 'assistant' ? (
                  <MessageContent content={message.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div
              className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100 dark:bg-gray-800"
              style={{ color: 'var(--fg-secondary)' }}
            >
              <span className="animate-pulse">Leada denkt nach...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt-Vorschläge - Nur anzeigen, wenn keine Nachrichten */}
      {messages.length === 0 && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {promptSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-4 rounded-lg border-2 transition-all text-left"
                style={{
                  color: 'var(--fg-primary)',
                  borderColor: 'var(--border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <p className="text-sm font-medium">{suggestion}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weiter-Button - Nur anzeigen, wenn Themenpaket aktiv */}
      {activeThemenpaket && messages.length > 0 && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleNextImpulse}
              disabled={loading}
              className="w-full py-3 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              style={{
                backgroundColor: loading ? undefined : 'var(--accent)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }
              }}
            >
              {loading ? 'Wird geladen...' : 'Weiter zum nächsten Impuls'}
            </button>
          </div>
        </div>
      )}

      {/* Eingabefeld */}
      <div className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="px-4 py-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Schreib mir deine Nachricht..."
              className="flex-1 px-4 py-3 rounded-lg border resize-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--fg-primary)',
                borderColor: 'var(--border)',
              }}
              rows={1}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="px-6 py-3 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              style={{
                backgroundColor: loading || !input.trim() ? undefined : 'var(--accent)',
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }
              }}
            >
              Senden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
