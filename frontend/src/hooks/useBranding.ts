import { useState, useEffect } from 'react';
import api from '../services/api';
import type { CompanyBranding } from '../types';

// Default Leada-Branding
const DEFAULT_BRANDING: CompanyBranding = {
  hasCompanyBranding: false,
  logoUrl: null,
  accentColor: '#5D9FAD',
};

export const useBranding = () => {
  const [branding, setBranding] = useState<CompanyBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const response = await api.get('/branding');
        setBranding(response.data);

        // CSS-Variablen dynamisch setzen
        applyBranding(response.data);
      } catch (error) {
        console.error('Error loading branding:', error);
        // Fallback auf Default
        setBranding(DEFAULT_BRANDING);
        applyBranding(DEFAULT_BRANDING);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();
  }, []);

  const applyBranding = (brandingData: CompanyBranding) => {
    const root = document.documentElement;

    // Akzentfarbe setzen
    if (brandingData.accentColor) {
      root.style.setProperty('--accent', brandingData.accentColor);

      // Hover-Farbe berechnen (etwas dunkler/heller)
      const hoverColor = adjustColorBrightness(brandingData.accentColor, -15);
      root.style.setProperty('--accent-hover', hoverColor);
    }
  };

  const adjustColorBrightness = (hex: string, percent: number): string => {
    // Entferne # wenn vorhanden
    hex = hex.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Anpassung
    const adjust = (color: number) => {
      const adjusted = color + (color * percent) / 100;
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };

    // Zurück zu Hex
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
  };

  return { branding, loading };
};
