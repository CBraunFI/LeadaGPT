import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Register with Email/Password
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'E-Mail bereits registriert' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          authProvider: 'local',
        },
      });

      // Create empty profile
      await prisma.userProfile.create({
        data: {
          userId: user.id,
        },
      });

      // Generate JWT
      const token = generateToken({ userId: user.id, email: user.email });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
    }
  }
);

// Login with Email/Password
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // Check password
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      // Generate JWT
      const token = generateToken({ userId: user.id, email: user.email });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          profile: user.profile,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Anmeldung fehlgeschlagen' });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Nutzer nicht gefunden' });
    }

    res.json({
      id: user.id,
      email: user.email,
      profile: user.profile,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Nutzers' });
  }
});

// Logout (client-side token deletion, but endpoint for consistency)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Erfolgreich abgemeldet' });
});

export default router;
