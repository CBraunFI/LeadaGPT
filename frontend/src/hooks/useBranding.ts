import { useState, useEffect } from 'react';
import { brandingAPI } from '../services/api';
import type { CompanyBranding } from '../types';

const DEFAULT_BRANDING: CompanyBranding = {
  hasCompanyBranding: false,
  logoUrl: null,
  accentColor: '#5D9FAD',
  companyName: null,
};

export const useBranding = () => {
  const [branding, setBranding] = useState<CompanyBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const brandingData = await brandingAPI.get();
        setBranding(brandingData);
        applyBranding(brandingData);
      } catch (error) {
        console.error('Failed to load branding:', error);
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
    root.style.setProperty('--accent', brandingData.accentColor);

    // Calculate hover color (slightly darker/lighter)
    const hoverColor = adjustColorBrightness(brandingData.accentColor, -15);
    root.style.setProperty('--accent-hover', hoverColor);
  };

  return { branding, loading };
};

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)
    .toUpperCase();
}
