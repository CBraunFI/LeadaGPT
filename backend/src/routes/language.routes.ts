import { Router, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  translateUIStrings,
  getCommonLanguages,
  clearTranslationCache,
  getTranslationCacheStats,
} from '../services/translation.service';

const router = Router();

// Get common languages list
router.get('/common', (req, res: Response) => {
  const languages = getCommonLanguages();
  res.json(languages);
});

// Get translated UI strings for a specific language
router.get(
  '/translations',
  authenticate,
  [query('lang').optional().isString()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const targetLanguage = (req.query.lang as string) || 'Deutsch';

      const translations = await translateUIStrings(targetLanguage);

      res.json({
        language: targetLanguage,
        translations,
      });
    } catch (error) {
      console.error('Get translations error:', error);
      res.status(500).json({ error: 'Fehler beim Abrufen der Übersetzungen' });
    }
  }
);

// Clear translation cache (admin/development endpoint)
router.delete('/cache', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const language = req.query.lang as string | undefined;
    clearTranslationCache(language);

    res.json({
      message: language
        ? `Cache für ${language} gelöscht`
        : 'Gesamter Cache gelöscht',
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Caches' });
  }
});

// Get cache statistics
router.get('/cache/stats', authenticate, (req: AuthRequest, res: Response) => {
  const stats = getTranslationCacheStats();
  res.json(stats);
});

export default router;
