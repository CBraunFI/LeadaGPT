import { useState, useEffect } from 'react';
import { Language } from '../types';
import { languageAPI } from '../services/api';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  label?: string;
  showCustomInput?: boolean;
}

const LanguageSelector = ({ value, onChange, label, showCustomInput = true }: LanguageSelectorProps) => {
  const [commonLanguages, setCommonLanguages] = useState<Language[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customLang, setCustomLang] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setIsLoading(true);
      const langs = await languageAPI.getCommonLanguages();
      setCommonLanguages(langs);

      // Check if current value is custom (not in common list)
      const isCustom = !langs.some(l => l.name === value || l.code === value);
      if (isCustom && value) {
        setShowCustom(true);
        setCustomLang(value);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setCustomLang('');
      onChange(selected);
    }
  };

  const handleCustomSubmit = () => {
    if (customLang.trim()) {
      onChange(customLang.trim());
    }
  };

  if (isLoading) {
    return <div className="text-sm" style={{ color: 'var(--fg-secondary)' }}>Lädt...</div>;
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>
          {label}
        </label>
      )}

      <select
        value={showCustom ? 'custom' : value}
        onChange={handleSelectChange}
        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border)',
          color: 'var(--fg-primary)',
        }}
      >
        <option value="">Sprache wählen...</option>
        {commonLanguages.map((lang) => (
          <option key={lang.code} value={lang.name}>
            {lang.nativeName}
          </option>
        ))}
        {showCustomInput && <option value="custom">Andere Sprache...</option>}
      </select>

      {showCustom && showCustomInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customLang}
            onChange={(e) => setCustomLang(e.target.value)}
            placeholder="z.B. Schwäbisch, Bayerisch..."
            className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border)',
              color: 'var(--fg-primary)',
            }}
          />
          <button
            onClick={handleCustomSubmit}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'white',
            }}
          >
            OK
          </button>
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
        Der Chat-Coach passt sich automatisch Ihrer Sprache an
      </p>
    </div>
  );
};

export default LanguageSelector;
