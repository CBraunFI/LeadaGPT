# Leada Chat - KI-Coach für Führungskräfte

Eine vollständige Progressive Web App (PWA) mit KI-gestütztem Lern- und Umsetzungs-Coach für Führungskräfte.

## Features

✅ **Authentication**: Google, Microsoft OAuth + E-Mail/Passwort
✅ **Profilbasierte Personalisierung**: Individuelles Onboarding
✅ **Themenpakete**: 14-Tage Microlearning-Programme
✅ **Routinen & Ziele**: Tracking und Erinnerungen
✅ **Chat mit Leada GPT**: Kontextsensitiver AI-Coach
✅ **Wöchentliche Auswertungen**: Fortschritts-Reports
✅ **PWA**: Installierbar auf Desktop & Mobile
✅ **Dark/Light Mode**: Automatisch oder manuell

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (via Prisma ORM)
- OpenAI GPT-4 API
- JWT Authentication
- Passport.js (OAuth)

### Frontend
- React 18 + TypeScript
- Vite (Build Tool)
- Tailwind CSS
- Zustand (State Management)
- React Router v6
- PWA (Service Worker)

---

## Setup-Anleitung

### Voraussetzungen

- Node.js 18+ installiert
- PostgreSQL installiert und laufend
- OpenAI API Key ([hier erhalten](https://platform.openai.com/api-keys))
- (Optional) Google/Microsoft OAuth Credentials

### 1. Repository klonen / Projekt entpacken

```bash
cd LeadaGPT
```

### 2. Backend Setup

```bash
cd backend

# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
```

**Backend .env bearbeiten:**

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/leadagpt?schema=public"

# JWT
JWT_SECRET=dein-super-geheimer-jwt-schlüssel
JWT_EXPIRY=7d

# OpenAI
OPENAI_API_KEY=sk-dein-openai-api-key

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_CALLBACK_URL=http://localhost:3000/api/auth/microsoft/callback

# CORS
ALLOWED_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=60
```

**Datenbank migrieren & seeden:**

```bash
# Prisma Client generieren
npm run prisma:generate

# Datenbank-Migrationen ausführen
npm run prisma:migrate

# Seed-Daten (Beispiel-Themenpakete) einfügen
npx prisma db seed
```

**Backend starten:**

```bash
npm run dev
```

Backend läuft jetzt auf: `http://localhost:3000`

### 3. Frontend Setup

```bash
cd ../frontend

# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
```

**Frontend .env bearbeiten:**

```env
VITE_API_URL=http://localhost:3000/api
```

**Frontend starten:**

```bash
npm run dev
```

Frontend läuft jetzt auf: `http://localhost:5173`

---

## Verwendung

### 1. Registrierung

1. Öffne `http://localhost:5173`
2. Klicke auf "Jetzt starten"
3. Registriere dich mit E-Mail und Passwort (min. 8 Zeichen)

### 2. Onboarding

Nach der Registrierung wirst du durch das Onboarding geführt:
- Profildaten eingeben (Alter, Rolle, Team, Ziele)
- Erste Empfehlungen erhalten

### 3. Dashboard

- Übersicht über aktive Themenpakete
- Routinen-Status
- Letzte Chat-Sessions

### 4. Chat mit Leada GPT

- Stelle Fragen zu Führung & Lernen
- Erhalte kontextsensitive Antworten
- Leada GPT kennt dein Profil und deine Ziele

### 5. Themenpakete

- Durchsuche den Katalog
- Starte ein 14-Tage-Programm
- Erhalte täglich 2 Micro-Learning-Einheiten

### 6. Routinen

- Setze dir Routinen (z.B. "Täglich 10 Min Journaling")
- Tracke deine Fortschritte
- Lass dich erinnern

---

## Prisma Studio (Datenbank-UI)

Um die Datenbank grafisch zu verwalten:

```bash
cd backend
npm run prisma:studio
```

Öffnet sich auf: `http://localhost:5555`

---

## Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

Das `dist/` Verzeichnis kann dann auf einem Static-Host (Vercel, Netlify, etc.) deployed werden.

---

## Deployment

### Backend Deployment

**Empfohlene Plattformen:**
- [Railway](https://railway.app/) (einfach, inkl. PostgreSQL)
- [Render](https://render.com/)
- [Heroku](https://www.heroku.com/)

**Umgebungsvariablen setzen:**
- Alle Variablen aus `.env.example`
- `DATABASE_URL` auf Production-DB setzen
- `ALLOWED_ORIGIN` auf Frontend-URL setzen

### Frontend Deployment

**Empfohlene Plattformen:**
- [Vercel](https://vercel.com/) (optimal für Vite)
- [Netlify](https://www.netlify.com/)

**Umgebungsvariablen setzen:**
- `VITE_API_URL`: URL des deployed Backends

---

## Projektstruktur

```
LeadaGPT/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, System-Prompt
│   │   ├── middleware/     # Auth Middleware
│   │   ├── routes/         # API Routes
│   │   ├── services/       # OpenAI Service
│   │   ├── utils/          # JWT, Password
│   │   └── index.ts        # Hauptserver
│   ├── prisma/
│   │   ├── schema.prisma   # Datenbank-Schema
│   │   └── seed.ts         # Seed-Daten
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React-Komponenten
│   │   ├── pages/          # Seiten (Dashboard, Chat, etc.)
│   │   ├── hooks/          # Custom Hooks (useTheme)
│   │   ├── services/       # API Service (axios)
│   │   ├── store/          # Zustand Store
│   │   ├── types/          # TypeScript Types
│   │   ├── App.tsx         # Router
│   │   ├── main.tsx        # Entry Point
│   │   └── index.css       # Global Styles + Theme
│   ├── .env.example
│   ├── vite.config.ts      # Vite + PWA Config
│   ├── tailwind.config.js
│   └── package.json
│
├── spec.md                 # Vollständige Spezifikation
├── system_prompt.md        # Leada GPT System-Prompt
└── README.md               # Diese Datei
```

---

## API-Endpunkte

### Authentication
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Aktueller User
- `POST /api/auth/logout` - Logout

### Profile
- `GET /api/profile` - Profil abrufen
- `PUT /api/profile` - Profil aktualisieren
- `POST /api/profile/onboarding` - Onboarding abschließen

### Chat
- `GET /api/chat/sessions` - Alle Sessions
- `POST /api/chat/sessions` - Neue Session
- `GET /api/chat/sessions/:id` - Session mit Messages
- `POST /api/chat/sessions/:id/messages` - Nachricht senden
- `DELETE /api/chat/sessions/:id` - Session löschen

### Themenpakete
- `GET /api/themenpakete` - Alle Themenpakete
- `GET /api/themenpakete/:id` - Einzelnes Themenpaket
- `POST /api/themenpakete/:id/start` - Themenpaket starten
- `POST /api/themenpakete/:id/pause` - Pausieren
- `POST /api/themenpakete/:id/continue` - Fortsetzen

### Routinen
- `GET /api/routines` - Alle Routinen
- `POST /api/routines` - Neue Routine
- `PUT /api/routines/:id` - Aktualisieren
- `DELETE /api/routines/:id` - Löschen
- `POST /api/routines/:id/entries` - Eintrag hinzufügen
- `GET /api/routines/:id/stats` - Statistiken

### Reports
- `GET /api/reports/weekly` - Alle Reports
- `GET /api/reports/weekly/latest` - Neuester Report
- `POST /api/reports/weekly/generate` - Neuen Report generieren

---

## Troubleshooting

### Backend startet nicht

**Fehler: "Cannot connect to database"**
- PostgreSQL läuft nicht → `brew services start postgresql` (Mac) oder `sudo service postgresql start` (Linux)
- Falsche `DATABASE_URL` in `.env`

**Fehler: "Prisma Client not generated"**
```bash
npm run prisma:generate
```

### Frontend startet nicht

**Fehler: "Cannot connect to API"**
- Backend läuft nicht auf Port 3000
- Falsche `VITE_API_URL` in `.env`

### OpenAI API Fehler

**Fehler: "Invalid API Key"**
- OpenAI API Key in `.env` prüfen
- Guthaben auf OpenAI-Account prüfen

**Fehler: "Rate limit exceeded"**
- Zu viele Requests → Warten oder Rate-Limiting in `.env` anpassen

---

## Nächste Schritte (Erweiterungen)

Das Basis-System ist komplett. Mögliche Erweiterungen:

### Backend
- [ ] Google/Microsoft OAuth vollständig implementieren
- [ ] File-Upload für Dokumente (OpenAI File-Search)
- [ ] Streaming für Chat-Responses (bessere UX)
- [ ] Cronjob für automatische Weekly Reports
- [ ] Admin-Dashboard für Themenpakete-Verwaltung

### Frontend
- [ ] Dashboard mit Diagrammen/Visualisierungen
- [ ] Chat mit Markdown-Rendering
- [ ] Themenpakete-Detailansicht mit allen Units
- [ ] Routinen mit Kalender-View
- [ ] Drag & Drop für Datei-Upload
- [ ] Notifications für Erinnerungen
- [ ] Mehrsprachigkeit (i18n)
- [ ] Vollständige PWA-Offline-Funktionalität

---

## Lizenz

Developed by **SYNK GROUP GmbH & Co. KG**

---

## Support

Bei Fragen oder Problemen:
- Issues auf GitHub erstellen
- E-Mail an: support@synk-group.de

---

**Viel Erfolg mit Leada Chat!** 🚀
