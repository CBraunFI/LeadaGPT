import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI, chatAPI } from '../services/api';
import { useStore } from '../store/useStore';
import MessageContent from '../components/MessageContent';
import LanguageSelector from '../components/LanguageSelector';
import { ChatSession } from '../types';

const Profile = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [summary, setSummary] = useState<string>('');
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState(user?.profile?.preferredLanguage || 'Deutsch');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProfileData = async () => {
    try {
      setIsLoadingSummary(true);
      setIsLoadingChat(true);

      // Load summary
      const summaryData = await profileAPI.getSummary();
      setSummary(summaryData.summary);
      setIsLoadingSummary(false);

      // Load or create reflection chat
      const chatData = await profileAPI.getReflectionChat();
      setChat(chatData);
      setIsLoadingChat(false);
    } catch (error) {
      console.error('Error loading profile data:', error);
      setIsLoadingSummary(false);
      setIsLoadingChat(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chat || isSending) return;

    const userMessage = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      const updatedSession = await chatAPI.sendMessage(chat.id, userMessage);
      setChat(updatedSession);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSending(false);
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

  const openChatFullscreen = () => {
    if (chat) {
      navigate(`/chat/${chat.id}`);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setPreferredLanguage(newLang);
    try {
      await profileAPI.update({ preferredLanguage: newLang });
      // Reload user to update language
      const updatedUser = await profileAPI.get();
      if (user) {
        setUser({ ...user, profile: updatedUser });
      }
      // Reload summary in new language
      loadProfileData();
      alert(`Sprache erfolgreich geändert zu: ${newLang}\n\nDer Chat-Coach wird ab jetzt auf ${newLang} antworten!`);
    } catch (error) {
      console.error('Failed to update language:', error);
      alert('Fehler beim Speichern der Sprache');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mein Profil</h1>
            <p style={{ color: 'var(--fg-secondary)' }}>
              Ihre persönliche Entwicklung im Überblick
            </p>
          </div>
          <button
            onClick={() => setShowLanguageSettings(!showLanguageSettings)}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--fg-primary)',
            }}
          >
            🌍 Sprache: {preferredLanguage}
          </button>
        </div>
      </div>

      {/* Language Settings */}
      {showLanguageSettings && (
        <div
          className="mb-8 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          <h2 className="text-xl font-bold mb-4">Spracheinstellungen</h2>
          <LanguageSelector
            value={preferredLanguage}
            onChange={handleLanguageChange}
            label="Bevorzugte Sprache"
            showCustomInput={true}
          />
        </div>
      )}

      {/* Profile Summary */}
      <div
        className="mb-8 p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--accent)',
          borderWidth: '2px',
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
          Ihre aktuelle Situation
        </h2>
        {isLoadingSummary ? (
          <div style={{ color: 'var(--fg-secondary)' }}>Lädt Zusammenfassung...</div>
        ) : (
          <p style={{ color: 'var(--fg-primary)' }} className="text-base leading-relaxed">
            {summary || 'Noch keine Zusammenfassung verfügbar. Nutzen Sie Leada Chat aktiv, um Ihre persönliche Zusammenfassung zu generieren.'}
          </p>
        )}
      </div>

      {/* Reflection Chat */}
      <div
        className="rounded-lg border"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-xl font-bold">👤 Reflexions-Chat</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-secondary)' }}>
              Reflektieren Sie Ihre Entwicklung, Herausforderungen und Ziele
            </p>
          </div>
          <button
            onClick={openChatFullscreen}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white',
            }}
          >
            Vollbild öffnen
          </button>
        </div>

        {isLoadingChat ? (
          <div className="p-8 text-center" style={{ color: 'var(--fg-secondary)' }}>
            Lädt Chat...
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="p-6 space-y-4 h-[400px] overflow-y-auto">
              {!chat?.messages || chat.messages.length === 0 ? (
                <div className="text-center space-y-4">
                  <p style={{ color: 'var(--fg-secondary)' }}>
                    Willkommen in Ihrem Reflexions-Chat! Hier können Sie:
                  </p>
                  <ul className="text-left max-w-md mx-auto space-y-2" style={{ color: 'var(--fg-secondary)' }}>
                    <li>• Ihre persönliche Entwicklung reflektieren</li>
                    <li>• Herausforderungen besprechen</li>
                    <li>• Ziele identifizieren und planen</li>
                    <li>• Konkrete Entwicklungsvorschläge erhalten</li>
                  </ul>
                </div>
              ) : (
                chat.messages
                  .filter(msg => msg.role !== 'system')
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          msg.role === 'user'
                            ? 'rounded-br-none'
                            : 'rounded-bl-none'
                        }`}
                        style={{
                          backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-primary)',
                          color: msg.role === 'user' ? 'white' : 'var(--fg-primary)',
                          border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        {msg.role === 'assistant' ? (
                          <MessageContent content={msg.content} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                        <div className="text-xs mt-2 opacity-70">
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
              )}
              {isSending && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[70%] rounded-lg rounded-bl-none p-4"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                    }}
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
  );
};

export default Profile;
