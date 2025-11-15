# Leada-GPT System Specification (spec.md)

**Version:** 2.0
**Letzte Aktualisierung:** 15. November 2024
**Status:** Production-Ready

---

## Inhaltsverzeichnis

1. [System-Übersicht](#system-übersicht)
2. [Architektur](#architektur)
3. [Datenmodell](#datenmodell)
4. [Features & Funktionen](#features--funktionen)
5. [API-Endpoints](#api-endpoints)
6. [KI-Integration](#ki-integration)
7. [All-Sprach-System](#all-sprach-system)
8. [Chat-Typen & Special Chats](#chat-typen--special-chats)
9. [Workflows](#workflows)
10. [Deployment & Infrastructure](#deployment--infrastructure)
11. [Security & Authentication](#security--authentication)
12. [Future Enhancements](#future-enhancements)

---

## System-Übersicht

### Was ist Leada-GPT?

Leada-GPT ist ein **KI-gestützter Coaching- und Entwicklungsassistent für Führungskräfte**. Das System kombiniert die Leistungsfähigkeit von OpenAI's GPT-4 mit einer strukturierten, progressiven Learning-Plattform, um Führungskräfte bei ihrer persönlichen und professionellen Entwicklung zu unterstützen.

### Kernziele

1. **Personalisiertes Coaching**: Individuell angepasste Beratung basierend auf Profil, Erfahrung und aktuellen Herausforderungen
2. **Strukturiertes Lernen**: 14-tägige Themenpakete mit täglichen Lerneinheiten
3. **Ad-hoc-Unterstützung**: Sofortige Hilfe bei akuten Fragestellungen
4. **Langfristige Entwicklung**: Tracking von Fortschritten, Zielen und Reflexionen
5. **Mehrsprachigkeit**: Unterstützung beliebiger Sprachen (nicht nur vordefiniert)

### Technologie-Stack

**Frontend:**
- React 18.2 (TypeScript)
- Vite 5.0 (Build Tool)
- Zustand 4.4 (State Management)
- React Router 6.20
- TailwindCSS 3.3
- PWA-fähig (vite-plugin-pwa)

**Backend:**
- Node.js 22.x
- Express.js
- TypeScript
- Prisma ORM 5.x
- PostgreSQL (Production)
- JWT Authentication

**KI & Services:**
- OpenAI GPT-4-turbo
- KI-gestützte Übersetzungen
- KI-generierte Zusammenfassungen
- KI-basierte Empfehlungen

**Infrastructure:**
- Render.com (Hosting)
- GitHub (Version Control)
- PostgreSQL Cloud Database

---

## Architektur

### System-Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Dashboard  │  │   Chats    │  │Themenpakete│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐                             │
│  │   Profil   │  │  Branding  │                             │
│  └────────────┘  └────────────┘                             │
│                                                               │
│                    React + Zustand                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
┌──────────────────────┴──────────────────────────────────────┐
│                     BACKEND (Express)                        │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Routes & Controllers                     │   │
│  │  - Auth    - Chat      - Themenpakete                │   │
│  │  - Profile - Dashboard - Language                    │   │
│  │  - Documents           - Branding                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                       │                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Services Layer                       │   │
│  │  - OpenAI Service (GPT-4 Integration)                │   │
│  │  - Summary Service (AI-Summaries)                    │   │
│  │  - Translation Service (AI-Translations + Cache)     │   │
│  │  - Recommendation Service (AI-Recommendations)       │   │
│  │  - Document Processor                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                       │                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Prisma ORM + Middleware                 │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  - Users & Profiles    - Chat Sessions & Messages           │
│  - Themenpakete        - Routines & Entries                 │
│  - Documents           - Weekly Reports                      │
│  - Companies & Branding                                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   External Services                           │
│  ┌────────────────┐        ┌──────────────────┐             │
│  │   OpenAI API   │        │  Future: OAuth   │             │
│  │    (GPT-4)     │        │ (Google/Microsoft)│             │
│  └────────────────┘        └──────────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

### Design-Prinzipien

1. **Chat-Centric Architecture**: Alle Funktionen sind über Chats erreichbar
2. **Progressive Enhancement**: Basis-Features zuerst, dann erweiterte Funktionen
3. **AI-First**: KI ist zentral, nicht Anhängsel
4. **Type-Safe**: Vollständige TypeScript-Typisierung Frontend + Backend
5. **Responsive & Accessible**: Mobile-First Design mit PWA-Unterstützung

---

## Datenmodell

### Entity-Relationship-Übersicht

```
User (1) ──< (N) ChatSession
         ──< (N) Routine
         ──< (N) Document
         ──< (N) WeeklyReport
         ──< (N) UserThemenPaketProgress
         ──┤ (1:1) UserProfile
         ──> (1:N) Company

ChatSession (1) ──< (N) Message
                ──┤ (1:0..1) UserThemenPaketProgress

ThemenPaket (1) ──< (N) LearningUnit
                ──< (N) UserThemenPaketProgress

Routine (1) ──< (N) RoutineEntry

Company (1) ──┤ (1:0..1) CompanyBranding
```

### Kern-Entitäten

#### User
```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  passwordHash   String?  // null for OAuth users
  authProvider   String   // "local" | "google" | "microsoft"
  authProviderId String?
  companyId      String?

  profile       UserProfile?
  sessions      ChatSession[]
  routines      Routine[]
  weeklyReports WeeklyReport[]
  themenPaketProgress UserThemenPaketProgress[]
  documents     Document[]
  company       Company?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### UserProfile
```prisma
model UserProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique

  firstName          String?
  age                Int?
  gender             String?
  role               String?   // z.B. "Teamleiter", "CEO"
  industry           String?   // z.B. "IT", "Finance"
  teamSize           Int?
  leadershipYears    Int?
  goals              String?   // JSON array
  preferredLanguage  String @default("Deutsch")  // ANY language!

  onboardingComplete Boolean @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

**Wichtig**: `preferredLanguage` akzeptiert **beliebige** Sprachen, inkl. Dialekte (z.B. "Schwäbisch", "中文", "हिन्दी")

#### ChatSession
```prisma
model ChatSession {
  id        String    @id @default(cuid())
  userId    String

  title     String?
  chatType  String @default("general")
  // Chat-Typen: "general" | "themenpaket" | "routine" | "profil" | "ki-briefing" | "onboarding"

  isPinned  Boolean @default(false)  // Special Chats sind gepinnt
  linkedEntityId String?  // ID von Routine/ThemenPaket falls verknüpft

  messages  Message[]
  themenPaketProgress UserThemenPaketProgress?
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Chat-Typen erklärt:**
- `general`: Normale Ad-hoc-Beratungschats
- `themenpaket`: Chat zu einem laufenden Themenpaket
- `routine`: Chat für Routine-Impulse
- `profil`: Reflexions-Chat ("Meine Entwicklung")
- `ki-briefing`: Dashboard-KI-Briefing-Chat
- `onboarding`: Onboarding-Chat für neue Nutzer

#### Message
```prisma
model Message {
  id        String      @id @default(cuid())
  sessionId String
  role      String   // "user" | "assistant" | "system"
  content   String   // Nachrichteninhalt (kann sehr lang sein)
  metadata  String?  // JSON string für zusätzliche Daten

  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

#### ThemenPaket
```prisma
model ThemenPaket {
  id          String   @id @default(cuid())
  title       String
  description String
  duration    Int @default(14)  // Tage
  unitsPerDay Int @default(2)   // Lerneinheiten pro Tag
  category    String?

  units    LearningUnit[]
  progress UserThemenPaketProgress[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Beispiel-Themenpakete** (25 vordefiniert):
- Konstruktives Feedback geben
- Konflikte im Team lösen
- Effektiv delegieren
- Mitarbeiter motivieren
- Schwierige Gespräche führen
- Agile Führung
- Resilienz aufbauen
- Remote Teams führen
- Change Management
- Emotionale Intelligenz
- ... (15 weitere)

#### LearningUnit
```prisma
model LearningUnit {
  id            String      @id @default(cuid())
  themenPaketId String
  day            Int    // 1-14
  unitNumber     Int    // 1 oder 2
  title          String
  content        String  // Max 400 Wörter
  reflectionTask String
  order          Int

  themenPaket ThemenPaket @relation(fields: [themenPaketId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}
```

#### UserThemenPaketProgress
```prisma
model UserThemenPaketProgress {
  id            String @id @default(cuid())
  userId        String
  themenPaketId String
  chatSessionId String @unique

  status        String   // "active" | "paused" | "completed"
  currentDay    Int @default(1)
  currentUnit   Int @default(1)

  startedAt     DateTime @default(now())
  lastAccessedAt DateTime @default(now())
  completedAt   DateTime?

  user          User @relation(fields: [userId], references: [id], onDelete: Cascade)
  themenPaket   ThemenPaket @relation(fields: [themenPaketId], references: [id], onDelete: Cascade)
  chatSession   ChatSession @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)

  @@unique([userId, themenPaketId])
}
```

#### Company & CompanyBranding
```prisma
model Company {
  id          String @id @default(cuid())
  name        String
  domain      String? @unique
  description String?

  users       User[]
  documents   Document[]
  branding    CompanyBranding?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CompanyBranding {
  id           String  @id @default(cuid())
  companyId    String  @unique
  logoUrl      String?
  accentColor  String @default("#06206f")

  company      Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## Features & Funktionen

### 1. Dashboard (Zentrale Übersicht)

**Route:** `/dashboard`

**Komponenten:**
- **Period Selector**: Wähle Zeitraum (7 Tage / 1 Monat / 3 Monate / 6 Monate / Alles)
- **KI-Aktivitäts-Zusammenfassung**: 3 Sätze (max 40 Wörter), generiert von GPT-4
- **KI-Briefing Button**: Öffnet speziellen Chat für detailliertes Briefing
- **Statistiken**: Anzahl Chats, Themenpakete-Fortschritt, Aktivitäts-Heatmap

**Backend:**
- `GET /api/dashboard/activity-summary?period=week` - KI-generierte Zusammenfassung
- `GET /api/dashboard/ki-briefing-chat` - Holt oder erstellt KI-Briefing-Chat
- `GET /api/dashboard/stats?period=week` - Statistiken für Zeitraum

**KI-Integration:**
```typescript
// services/summary.service.ts
export async function generateActivitySummary(
  userId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<string>
```

### 2. Chat-System (Chat-Centric Architecture)

**Route:** `/chat` oder `/chat/:sessionId`

**Features:**
- **Unbegrenzte parallele Chats**: Nutzer können beliebig viele Chats führen
- **Special Chats** (gepinnt, nicht löschbar):
  - 🎯 Onboarding-Chat: "Willkommen bei Leada"
  - 👤 Profil-Reflexion: "Meine Entwicklung"
  - 📊 KI-Briefing: Dashboard-Analysen
  - 📚 Themenpakete-Chats: Ein Chat pro aktivem Themenpaket
  - ✓ Routinen-Chats: Zeitgesteuerte Impulse

- **General Chats** (💬): Ad-hoc-Beratung, jederzeit löschbar
- **Prompt-Suggestions**: 3 zufällige Vorschläge beim leeren Chat
- **Markdown-Support**: Formatierung, Listen, Code-Blöcke
- **Echtzeit-Streaming**: Nachrichten erscheinen sofort

**Backend:**
- `GET /api/chat/sessions` - Liste aller Chats (sortiert: gepinnte zuerst)
- `POST /api/chat/sessions` - Neuen Chat erstellen
- `GET /api/chat/sessions/:id` - Chat-Details inkl. Messages
- `POST /api/chat/sessions/:id/messages` - Nachricht senden
- `DELETE /api/chat/sessions/:id` - Chat löschen (nur wenn nicht gepinnt)

**System-Prompt:**
```typescript
// config/system-prompt.ts
export function getLeadaSystemPrompt(userLanguage: string = 'Deutsch'): string
```

Das System-Prompt passt sich dynamisch an die Nutzer-Sprache an und definiert:
- Rolle: "Leada-GPT, KI-Lern- und Umsetzungs-Coach"
- Ton: Professionell, motivierend, konkret
- Fokus: Führungskompetenzen, praktische Umsetzung
- Spracheinstellung: **ALLE Antworten auf der gewählten Sprache**

### 3. Themenpakete (Strukturiertes Lernen)

**Route:** `/themenpakete`

**Features:**
- **25 vordefinierte Themenpakete** (seeded via `/api/themenpakete/seed`)
- **KI-Empfehlungen**: Top 5 empfohlene Themenpakete basierend auf:
  - Nutzer-Profil (Rolle, Ziele, Erfahrung)
  - Chat-Verlauf (diskutierte Themen)
  - Bisherige Themenpakete (aktiv/abgeschlossen)

- **Status-Badges**:
  - ✨ Empfohlen (neue AI-Funktion!)
  - 🟢 Aktiv
  - 🟠 Pausiert
  - 🔵 Abgeschlossen
  - ⚪ Nicht gestartet

- **14-Tage-Programm**: 2 Einheiten pro Tag (je ~10 Min)
- **Eigener Chat**: Jedes Themenpaket hat dedizierten Chat
- **Fortschritts-Tracking**: Aktueller Tag, abgeschlossene Einheiten

**Backend:**
- `GET /api/themenpakete` - Alle Themenpakete mit `isRecommended` Flag
- `GET /api/themenpakete/recommended` - Nur empfohlene IDs
- `GET /api/themenpakete/:id` - Einzelnes Themenpaket mit Units
- `POST /api/themenpakete/:id/start` - Themenpaket starten
- `POST /api/themenpakete/:id/pause` - Pausieren
- `POST /api/themenpakete/:id/continue` - Fortsetzen
- `GET /api/themenpakete/:id/next-unit` - Nächste Lerneinheit
- `POST /api/themenpakete/:id/advance` - Zur nächsten Einheit springen

**Empfehlungs-Engine:**
```typescript
// services/recommendation.service.ts
export async function generateRecommendations(userId: string): Promise<string[]>
```

Verwendet GPT-4 zur Analyse von:
1. Nutzer-Profil (Rolle, Branche, Team-Größe, Ziele)
2. Chat-Topics (Keyword-Extraktion aus letzten 50 Nachrichten)
3. Aktive/abgeschlossene Themenpakete
4. Lernpfad-Logik (Grundlagen → Fortgeschritten)

### 4. Profil-Seite (Persönliche Entwicklung)

**Route:** `/profil`

**Features:**
- **KI-generierte Zusammenfassung**: 100-Wort-Summary der aktuellen Situation
  - Basiert auf: Profil, Chats, Themenpakete, Routinen
  - Automatisch regeneriert bei Änderungen

- **Embedded Reflexions-Chat**: "Meine Entwicklung"
  - Direkter Chat auf Profil-Seite
  - Vollbild-Modus verfügbar
  - Für langfristige Zielverfolgung und Reflexion

- **Spracheinstellungen**:
  - Toggle-Button: "🌍 Sprache: {aktuelle Sprache}"
  - Expandierbares Panel mit LanguageSelector
  - 13 häufige Sprachen + Custom-Input für Dialekte
  - Live-Aktualisierung: Summary wird in neuer Sprache regeneriert

**Backend:**
- `GET /api/profile` - Profil-Daten
- `PUT /api/profile` - Profil aktualisieren (inkl. `preferredLanguage`)
- `GET /api/profile/summary` - KI-generierte Zusammenfassung
- `GET /api/profile/reflection-chat` - Reflexions-Chat holen/erstellen
- `GET /api/profile/onboarding-chat` - Onboarding-Chat holen/erstellen

**Profile Summary Generation:**
```typescript
// services/summary.service.ts
export async function generateProfileSummary(userId: string): Promise<string>
```

Sammelt:
- Profil-Informationen
- Aktive Themenpakete + Fortschritt
- Chat-Zusammenfassung (Hauptthemen)
- Routinen-Status
- Generiert 100-Wort-Zusammenfassung

### 5. Onboarding-System

**Route:** Automatisch beim ersten Login via `/profil/onboarding-chat`

**Ziele:**
1. **Warmherzige Begrüßung**: Vertrauensvolle Atmosphäre schaffen
2. **Profil-Vervollständigung**: Wichtige Informationen erfragen
   - Vorname
   - Rolle/Position
   - Branche
   - Teamgröße
   - Führungserfahrung
   - Ziele/Herausforderungen

3. **System-Vorstellung**: Features präsentieren
   - 📚 Themenpakete
   - 💬 Ad-hoc-Beratung
   - 👤 Profil-Reflexion
   - 📊 KI-Briefing
   - 🎯 Dashboard

**Onboarding-Prompt:**
```typescript
// config/onboarding-prompt.ts
export function getOnboardingSystemPrompt(userLanguage: string): string
```

**Ablauf:**
1. Begrüßung (1 Nachricht)
2. Informationserfassung (3-5 Nachrichten, je 2-3 Fragen)
3. Systemvorstellung (parallel zur Erfassung)
4. Abschluss & nächste Schritte

**Special Features:**
- Gepinnter Chat (🎯 Icon)
- Nicht löschbar
- Sprachabhängiges Onboarding
- Natürlicher Gesprächsfluss (KEINE Fragebögen!)

### 6. All-Sprach-System

**Philosophie:** NICHT "multi-language" (vordefinierte Sprachen), sondern **"all-language"** - jede Sprache ist möglich!

**Unterstützte Sprachen:**
- **13 häufige Sprachen**: Deutsch, English, Español, Français, Italiano, Português, Nederlands, Polski, Русский, 中文, 日本語, العربية, Türkçe
- **Unbegrenzte Custom-Sprachen**: Schwäbisch, Bayerisch, Kölsch, Sächsisch, हिन्दी, 한국어, etc.

**Komponenten:**

#### Frontend: `LanguageSelector.tsx`
```tsx
<LanguageSelector
  value={preferredLanguage}
  onChange={handleLanguageChange}
  label="Bevorzugte Sprache"
  showCustomInput={true}
/>
```

Features:
- Dropdown mit 13 häufigen Sprachen
- "Andere Sprache..." Option
- Custom-Input-Feld für freie Eingabe
- Live-Preview: "Der Chat-Coach passt sich automatisch an"

#### Backend: Translation Service
```typescript
// services/translation.service.ts

// In-Memory Cache für Übersetzungen
const translationCache = new Map<string, Record<string, string>>();

// Base UI Strings (Deutsch)
const BASE_UI_STRINGS: Record<string, string> = {
  'nav.dashboard': 'Dashboard',
  'nav.chat': 'Chat',
  'common.loading': 'Lädt...',
  // ... 80+ Strings
};

export async function translateUIStrings(
  targetLanguage: string
): Promise<Record<string, string>>

export function getCommonLanguages(): Language[]
```

**Übersetzungs-Workflow:**
1. Nutzer wählt Sprache (Login oder Profil)
2. `preferredLanguage` wird in DB gespeichert
3. System-Prompt wird mit `getLeadaSystemPrompt(userLanguage)` angepasst
4. UI-Strings werden on-demand übersetzt (mit Caching)
5. Alle AI-Antworten erfolgen auf der gewählten Sprache

**API-Endpoints:**
- `GET /api/languages/common` - Liste der 13 häufigen Sprachen
- `GET /api/languages/translations?lang=English` - UI-Strings für Sprache
- `DELETE /api/languages/cache?lang=English` - Cache leeren
- `GET /api/languages/cache/stats` - Cache-Statistiken

**Caching-Strategie:**
- In-Memory Cache (Map)
- Cache Key: Sprachname
- Cache Value: Übersetztes UI-Strings-Objekt
- Lebensdauer: Bis Server-Neustart (könnte auf Redis erweitert werden)

### 7. Dokumenten-Management

**Route:** `/documents` (noch nicht im Frontend implementiert)

**Features:**
- Dokumenten-Upload (PDF, DOCX, TXT)
- Kategorien: "personal" | "company"
- Text-Extraktion für KI-Kontext
- Metadaten: Wortanzahl, Seitenzahl

**Backend:**
- `GET /api/documents` - Alle Dokumente
- `GET /api/documents?category=personal` - Filter nach Kategorie
- `POST /api/documents/upload` - Dokument hochladen
- `DELETE /api/documents/:id` - Dokument löschen

**Future Enhancement:** RAG (Retrieval-Augmented Generation) für dokumenten-basierte Beratung

### 8. Company Branding

**Route:** `/branding` (API-Level)

**Features:**
- Firmen-Logo hochladen
- Accent-Color anpassen
- CSS-Variablen dynamisch setzen

**Backend:**
- `GET /api/branding` - Branding-Daten holen

**Frontend:**
```typescript
// hooks/useBranding.ts
export function useBranding() {
  // Lädt Branding und setzt CSS-Variablen
  // --accent, --logo-url
}
```

---

## API-Endpoints

### Vollständige API-Referenz

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Nutzer registrieren | ❌ |
| POST | `/auth/login` | Nutzer anmelden | ❌ |
| POST | `/auth/logout` | Nutzer abmelden | ✅ |
| GET | `/auth/me` | Aktuellen Nutzer abrufen | ✅ |

**Request/Response Examples:**

```typescript
// POST /auth/register
Request: { email: string; password: string }
Response: { token: string; user: User }

// POST /auth/login
Request: { email: string; password: string }
Response: { token: string; user: User }
```

#### Profile (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Profil-Daten | ✅ |
| PUT | `/profile` | Profil aktualisieren | ✅ |
| POST | `/profile/onboarding` | Onboarding abschließen | ✅ |
| GET | `/profile/summary` | KI-Zusammenfassung | ✅ |
| GET | `/profile/reflection-chat` | Reflexions-Chat | ✅ |
| GET | `/profile/onboarding-chat` | Onboarding-Chat | ✅ |

```typescript
// PUT /profile
Request: {
  age?: number;
  role?: string;
  industry?: string;
  teamSize?: number;
  leadershipYears?: number;
  goals?: string[];
  preferredLanguage?: string;
}
Response: UserProfile

// GET /profile/summary
Response: { summary: string }  // Max 100 Wörter, GPT-4-generiert
```

#### Chat (`/api/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/chat/sessions` | Alle Chat-Sessions | ✅ |
| POST | `/chat/sessions` | Neuen Chat erstellen | ✅ |
| GET | `/chat/sessions/:id` | Chat-Details | ✅ |
| POST | `/chat/sessions/:id/messages` | Nachricht senden | ✅ |
| DELETE | `/chat/sessions/:id` | Chat löschen | ✅ |

```typescript
// POST /chat/sessions
Request: {
  title?: string;
  chatType?: 'general' | 'themenpaket' | 'routine' | 'profil' | 'ki-briefing' | 'onboarding';
  isPinned?: boolean;
  linkedEntityId?: string;
}
Response: ChatSession

// POST /chat/sessions/:id/messages
Request: { content: string }
Response: ChatSession  // Inkl. AI-Antwort
```

#### Themenpakete (`/api/themenpakete`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/themenpakete/seed` | Themenpakete seeden (Admin) | ❌ |
| GET | `/themenpakete` | Alle Themenpakete + Empfehlungen | ✅ |
| GET | `/themenpakete/recommended` | Nur empfohlene IDs | ✅ |
| GET | `/themenpakete/:id` | Themenpaket-Details | ✅ |
| POST | `/themenpakete/:id/start` | Themenpaket starten | ✅ |
| POST | `/themenpakete/:id/pause` | Pausieren | ✅ |
| POST | `/themenpakete/:id/continue` | Fortsetzen | ✅ |
| GET | `/themenpakete/:id/next-unit` | Nächste Lerneinheit | ✅ |
| POST | `/themenpakete/:id/advance` | Zum nächsten Unit | ✅ |

```typescript
// GET /themenpakete
Response: ThemenPaket[] // Mit isRecommended: boolean

// POST /themenpakete/:id/start
Response: {
  progress: UserThemenPaketProgress;
  chatSessionId: string;
}
```

#### Dashboard (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard/activity-summary?period=week` | KI-Aktivitätszusammenfassung | ✅ |
| GET | `/dashboard/ki-briefing-chat` | KI-Briefing-Chat | ✅ |
| GET | `/dashboard/stats?period=week` | Statistiken | ✅ |

```typescript
// GET /dashboard/activity-summary
Query: period = 'week' | 'month' | '3months' | '6months' | 'all'
Response: { summary: string; period: string }  // Max 40 Wörter, 3 Sätze

// GET /dashboard/stats
Response: {
  totalChats: number;
  activeThemenpakete: number;
  // ... weitere Stats
}
```

#### Languages (`/api/languages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/languages/common` | 13 häufige Sprachen | ✅ |
| GET | `/languages/translations?lang=English` | UI-Übersetzungen | ✅ |
| DELETE | `/languages/cache?lang=English` | Cache leeren | ✅ |
| GET | `/languages/cache/stats` | Cache-Statistiken | ✅ |

```typescript
// GET /languages/common
Response: Language[]  // { code, name, nativeName }

// GET /languages/translations
Response: {
  language: string;
  translations: Record<string, string>;  // 80+ UI-Strings
}
```

#### Documents (`/api/documents`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/documents` | Alle Dokumente | ✅ |
| GET | `/documents?category=personal` | Gefiltert | ✅ |
| GET | `/documents/:id` | Dokument-Details | ✅ |
| POST | `/documents/upload` | Hochladen | ✅ |
| DELETE | `/documents/:id` | Löschen | ✅ |

#### Branding (`/api/branding`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/branding` | Firmen-Branding | ✅ |

---

## KI-Integration

### OpenAI Service

**Datei:** `backend/src/services/openai.service.ts`

**Kern-Funktion:**
```typescript
export const getChatCompletion = async (
  messages: ChatMessage[],
  userContext?: UserContext
): Promise<string>
```

**UserContext Interface:**
```typescript
export interface UserContext {
  profile?: {
    firstName?: string;
    age?: number;
    role?: string;
    teamSize?: number;
    goals?: string[];
    onboardingComplete?: boolean;
    preferredLanguage?: string;  // Wichtig für Sprachanpassung!
  };
  recentTopics?: string[];
  activeThemenpakete?: string[];
}
```

**Verwendete Modelle:**
- **GPT-4-turbo** (Hauptmodell)
- Temperature: 0.7 (ausgewogen zwischen Kreativität und Konsistenz)
- Max Tokens: 800-1500 (je nach Use Case)

**System-Prompt-Integration:**
```typescript
const userLanguage = userContext?.profile?.preferredLanguage || 'Deutsch';

const systemMessages: ChatMessage[] = [
  { role: 'system', content: getLeadaSystemPrompt(userLanguage) },
];

// Context-Nachrichten hinzufügen
if (userContext?.profile?.firstName) {
  systemMessages.push({
    role: 'system',
    content: `Der Nutzer heißt ${userContext.profile.firstName}.`,
  });
}
// ... weitere Kontext-Infos
```

### KI-Use-Cases

#### 1. Chat-Antworten (Chat-Seite)
- **Trigger:** Nutzer sendet Nachricht
- **Kontext:** Profil, Chat-Verlauf, aktive Themenpakete
- **Output:** Coaching-Antwort auf präferierter Sprache

#### 2. Profil-Zusammenfassung
```typescript
// services/summary.service.ts
export async function generateProfileSummary(userId: string): Promise<string>
```

**Prompt-Template:**
```
Erstelle eine prägnante 100-Wort-Zusammenfassung der aktuellen Situation dieser Führungskraft:

PROFIL:
- Rolle: {role}
- Branche: {industry}
- Teamgröße: {teamSize}
- Ziele: {goals}

AKTIVE THEMENPAKETE:
- {themenpaket1}: Tag {currentDay}/{totalDays}
- {themenpaket2}: ...

HAUPTTHEMEN AUS CHATS:
- {topic1}
- {topic2}

Fokussiere auf: Aktuelle Situation, Hauptherausforderungen, Entwicklungsfokus.
```

#### 3. Aktivitäts-Zusammenfassung (Dashboard)
```typescript
export async function generateActivitySummary(
  userId: string,
  period: 'week' | 'month' | '3months' | '6months' | 'all'
): Promise<string>
```

**Constraints:**
- Max 3 Sätze
- Max 40 Wörter
- Fokus: Schwerpunkte, Frequenz, Herausforderungen

#### 4. Themenpakete-Empfehlungen
```typescript
// services/recommendation.service.ts
export async function generateRecommendations(userId: string): Promise<string[]>
```

**Analyse-Kriterien:**
1. Nutzer-Profil (Rolle, Erfahrung, Ziele)
2. Diskutierte Themen (Keyword-Extraktion aus letzten 50 Messages)
3. Aktive/abgeschlossene Themenpakete
4. Logische Progression (Grundlagen → Fortgeschritten)
5. Kategorie-Diversität

**Output:** 5 Themenpaket-IDs

#### 5. Chat-Topic-Extraktion
```typescript
async function extractChatTopics(userId: string): Promise<string[]>
```

Extrahiert aus letzten 50 Nutzer-Nachrichten die 5-7 wichtigsten Themen.

#### 6. UI-String-Übersetzung
```typescript
// services/translation.service.ts
export async function translateUIStrings(
  targetLanguage: string
): Promise<Record<string, string>>
```

**Prompt:**
```
Übersetze die folgenden UI-Strings von Deutsch nach {targetLanguage}.
Bewahre die JSON-Schlüssel, übersetze nur die Werte.
Achte auf natürliche, kontextgerechte Übersetzungen für eine Coaching-Plattform.

JSON:
{BASE_UI_STRINGS}

Gib das übersetzte JSON zurück.
```

---

## Chat-Typen & Special Chats

### Chat-Typ-Übersicht

| Chat-Typ | Icon | Gepinnt? | Löschbar? | Zweck |
|----------|------|----------|-----------|-------|
| `onboarding` | 🎯 | ✅ | ❌ | Neue Nutzer begrüßen & System vorstellen |
| `profil` | 👤 | ✅ | ❌ | Langfristige Reflexion & Entwicklung |
| `ki-briefing` | 📊 | ✅ | ❌ | Dashboard-Analysen & Insights |
| `themenpaket` | 📚 | ✅ | ❌ | Begleitung während 14-Tage-Programm |
| `routine` | ✓ | ✅ | ❌ | Zeitgesteuerte Impulse |
| `general` | 💬 | ❌ | ✅ | Ad-hoc-Beratung |

### Detaillierte Beschreibungen

#### 🎯 Onboarding-Chat
**Titel:** "Willkommen bei Leada"

**Erstellt:** Automatisch beim ersten Aufruf von `/api/profile/onboarding-chat`

**Initialisierung:**
1. Chat-Session wird erstellt (`chatType: 'onboarding'`, `isPinned: true`)
2. System-Nachricht mit `getOnboardingSystemPrompt(userLanguage)`
3. Erste AI-Nachricht: Warmherzige Begrüßung

**Ablauf:**
1. **Begrüßung**: "Herzlich willkommen! Ich bin dein Onboarding-Coach..."
2. **Profilfragen**: Vorname, Rolle, Branche, Team, Erfahrung, Ziele
3. **System-Tour**: Parallel werden Features vorgestellt
4. **Abschluss**: "Basierend auf deinem Profil habe ich 5 Themenpakete empfohlen..."

**Besonderheiten:**
- Natürlicher Dialog (KEINE Fragebögen!)
- 2-3 Fragen pro AI-Nachricht
- Features werden kontextbezogen vorgestellt
- Sprachabhängig

#### 👤 Profil-Reflexions-Chat
**Titel:** "Meine Entwicklung"

**Erstellt:** Automatisch beim ersten Zugriff auf Profil-Seite

**Zweck:**
- Langfristige Zielverfolgung
- Reflexion über Fortschritte
- Persönliche Entwicklungsplanung
- Herausforderungen besprechen

**Besonderheiten:**
- Embedded auf `/profil` Seite
- Vollbild-Modus verfügbar
- Kontext: Profil-Summary wird in System-Prompt integriert

#### 📊 KI-Briefing-Chat
**Titel:** "KI-Briefing"

**Erstellt:** Beim Klick auf "KI-Briefing" im Dashboard

**Zweck:**
- Detaillierte Analyse der Aktivitäten
- Erkenntnisse und Muster
- Empfehlungen für nächste Schritte

**System-Prompt-Erweiterung:**
```typescript
Du bist ein Analyst und fasst die Aktivitäten einer Führungskraft zusammen.
Nutze die folgenden Daten:
- Zeitraum: {period}
- Chats: {chatCount}, Hauptthemen: {topics}
- Themenpakete: {activePackages}
- Statistiken: {stats}

Gib Insights, Muster und Empfehlungen.
```

#### 📚 Themenpaket-Chats
**Titel:** "Themenpaket: {Titel}"

**Erstellt:** Beim Start eines Themenpakets (`POST /api/themenpakete/:id/start`)

**Zweck:**
- Begleitung durch 14-Tage-Programm
- Diskussion der Lerneinheiten
- Reflexionsaufgaben bearbeiten
- Praxistransfer unterstützen

**Verknüpfung:**
- `linkedEntityId` = ThemenPaket-ID
- Progress-Tracking in `UserThemenPaketProgress`

**Ablauf:**
1. Nutzer startet Themenpaket
2. Chat wird erstellt
3. Täglich 2 Lerneinheiten (morgens/abends)
4. Nach jeder Einheit: Reflexionsfrage
5. Chat begleitet durch alle 28 Units

#### ✓ Routinen-Chats
**Titel:** "Routine: {Titel}"

**Erstellt:** Beim Erstellen einer Routine (geplant)

**Zweck:**
- Zeitgesteuerte Impulse
- Erinnerungen
- Fortschritts-Checks

**Status:** Grundstruktur vorhanden, nicht voll implementiert

#### 💬 General Chats
**Titel:** User-definiert oder "Neuer Chat"

**Erstellt:** Jederzeit durch Nutzer

**Zweck:**
- Ad-hoc-Beratung
- Spontane Fragen
- Situationsspezifische Unterstützung

**Besonderheiten:**
- Einziger löschbarer Chat-Typ
- Unbegrenzte Anzahl möglich
- Prompt-Suggestions beim leeren Chat

---

## Workflows

### Workflow 1: Nutzer-Registrierung & Onboarding

```
1. Nutzer ruft /login auf
   ↓
2. Klickt "Registrieren"
   ↓
3. Gibt Email, Passwort, Sprache ein
   ↓
4. POST /api/auth/register
   ↓
5. Backend erstellt User + UserProfile (mit preferredLanguage)
   ↓
6. Token wird zurückgegeben
   ↓
7. Frontend setzt Token, navigiert zu /chat
   ↓
8. Chat-Seite lädt Sessions
   ↓
9. Keine Sessions → "Willkommen"-Bildschirm
   ↓
10. Nutzer kann:
    - Neuen Chat starten (General)
    - Oder auf "Profil" gehen
   ↓
11. Auf Profil-Seite:
    - GET /api/profile/onboarding-chat
    - Onboarding-Chat wird erstellt (falls nicht existent)
    - Erste AI-Nachricht: Begrüßung
   ↓
12. Onboarding-Dialog:
    - Profil-Fragen werden gestellt
    - System-Features werden vorgestellt
    - Nach Abschluss: "Themenpakete wurden empfohlen"
   ↓
13. Nutzer erkundet System
```

### Workflow 2: Themenpaket starten

```
1. Nutzer navigiert zu /themenpakete
   ↓
2. GET /api/themenpakete
   ↓
3. Backend:
   - Holt alle Themenpakete
   - Generiert Empfehlungen via AI
   - Markiert Top 5 mit isRecommended: true
   ↓
4. Frontend zeigt:
   - Empfohlene Themenpakete oben (mit ✨ Badge)
   - Sortiert: Empfohlen → Aktiv → Rest
   ↓
5. Nutzer klickt "Starten" bei einem Themenpaket
   ↓
6. POST /api/themenpakete/:id/start
   ↓
7. Backend:
   - Erstellt ChatSession (chatType: 'themenpaket', isPinned: true)
   - Erstellt UserThemenPaketProgress (status: 'active', currentDay: 1, currentUnit: 1)
   - Verknüpft Chat mit Progress
   ↓
8. Response: { chatSessionId }
   ↓
9. Frontend navigiert zu /chat/{chatSessionId}
   ↓
10. Chat lädt mit erstem Learning Unit
   ↓
11. Nutzer arbeitet durch Units:
    - Liest Inhalt
    - Beantwortet Reflexionsfrage im Chat
    - Klickt "Weiter" → POST /api/themenpakete/:id/advance
   ↓
12. Nach 14 Tagen / 28 Units:
    - Status wird 'completed'
    - Chat bleibt bestehen (Archiv-Funktion)
```

### Workflow 3: Sprache ändern

```
1. Nutzer ist auf /profil
   ↓
2. Klickt auf "🌍 Sprache: Deutsch"
   ↓
3. Spracheinstellungs-Panel expandiert
   ↓
4. LanguageSelector zeigt:
   - Dropdown: 13 häufige Sprachen
   - "Andere Sprache..." Option
   ↓
5. Nutzer wählt "Andere Sprache..."
   ↓
6. Custom-Input-Feld erscheint
   ↓
7. Nutzer gibt "Schwäbisch" ein, klickt OK
   ↓
8. Frontend:
   - PUT /api/profile { preferredLanguage: "Schwäbisch" }
   ↓
9. Backend:
   - Speichert preferredLanguage in UserProfile
   ↓
10. Frontend:
    - Reload Profil-Daten
    - GET /api/profile/summary (wird neu auf Schwäbisch generiert!)
    ↓
11. Alert: "Sprache erfolgreich geändert zu: Schwäbisch
            Der Chat-Coach wird ab jetzt auf Schwäbisch antworten!"
   ↓
12. Alle zukünftigen AI-Antworten:
    - System-Prompt enthält: "Der Nutzer kommuniziert bevorzugt auf: Schwäbisch"
    - GPT-4 antwortet auf Schwäbisch
```

### Workflow 4: Dashboard-Nutzung

```
1. Nutzer navigiert zu /dashboard
   ↓
2. Frontend lädt:
   - GET /api/dashboard/activity-summary?period=week
   - GET /api/dashboard/stats?period=week
   ↓
3. Backend (activity-summary):
   - Sammelt Daten für letzte 7 Tage
   - Zählt Chats, extrahiert Topics
   - Generiert 3-Satz-Summary via GPT-4
   ↓
4. Dashboard zeigt:
   - Period-Selector (7 Tage, 1 Monat, etc.)
   - KI-Zusammenfassung (40 Wörter)
   - Statistiken
   - "KI-Briefing"-Button
   ↓
5. Nutzer ändert Period zu "1 Monat"
   ↓
6. Re-Fetch:
   - GET /api/dashboard/activity-summary?period=month
   - GET /api/dashboard/stats?period=month
   ↓
7. UI aktualisiert sich
   ↓
8. Nutzer klickt "KI-Briefing"
   ↓
9. GET /api/dashboard/ki-briefing-chat
   ↓
10. Backend:
    - Sucht existierenden KI-Briefing-Chat
    - Falls nicht vorhanden: Erstellt (chatType: 'ki-briefing', isPinned: true)
   ↓
11. Frontend navigiert zu /chat/{briefingChatId}
   ↓
12. Nutzer kann detaillierte Fragen stellen:
    "Welche Muster erkennst du in meinen Aktivitäten?"
```

---

## Deployment & Infrastructure

### Hosting-Architektur

**Platform:** Render.com

**Services:**
1. **Backend (Web Service)**
   - URL: `leadagpt-backend.onrender.com`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Environment: Node.js 22.x
   - Auto-Deploy: Bei jedem Push zu `main` Branch

2. **Frontend (Static Site)**
   - URL: `leadagpt-frontend.onrender.com`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment: Node.js 22.x
   - SPA-Routing: `_redirects` File (`/* /index.html 200`)

3. **PostgreSQL Database**
   - Managed PostgreSQL auf Render
   - Auto-Backups
   - Connection String in Backend-ENV

### Environment Variables

**Backend (.env):**
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT
JWT_SECRET="your-secret-key"

# OpenAI
OPENAI_API_KEY="sk-..."

# Server
PORT=3000
NODE_ENV="production"
```

**Frontend (.env):**
```bash
VITE_API_URL="https://leadagpt-backend.onrender.com/api"
```

### Deployment-Workflow

```
1. Developer pushed zu GitHub (main Branch)
   ↓
2. GitHub Webhook triggert Render
   ↓
3. Render Backend:
   - Git Pull
   - npm install
   - npx prisma generate (Prisma Client)
   - npm run build (TypeScript → JavaScript)
   - npx prisma db push (DB-Migrationen)
   - npm start
   ↓
4. Render Frontend:
   - Git Pull
   - npm install
   - npm run build (Vite Build)
   - Publish dist/ Folder
   ↓
5. Services sind live!
```

### Database Migrations

**Strategie:** Prisma DB Push (nicht Prisma Migrate)

```bash
# Lokal testen
npx prisma db push

# Production (automatisch in Render Build)
npx prisma db push
```

**Schema-Änderungen:**
1. Ändere `backend/prisma/schema.prisma`
2. Teste lokal: `npx prisma db push`
3. Commit & Push zu GitHub
4. Render führt automatisch `db push` aus

### Monitoring & Logs

**Render Dashboard:**
- Service Logs (Echtzeit)
- Metrics (CPU, Memory, Requests)
- Deploy-Historie

**Application Logs:**
```typescript
console.log('Info:', ...);
console.error('Error:', ...);
// Werden in Render Logs gestreamt
```

---

## Security & Authentication

### Authentifizierung

**Methode:** JWT (JSON Web Tokens)

**Flow:**
```
1. POST /api/auth/login { email, password }
   ↓
2. Backend:
   - Validiert Credentials
   - Generiert JWT mit userId
   - Expiry: 7 Tage
   ↓
3. Response: { token, user }
   ↓
4. Frontend:
   - Speichert Token in localStorage
   - Setzt Authorization-Header für alle Requests
   ↓
5. Jeder Request:
   - Header: "Authorization: Bearer {token}"
   ↓
6. Backend Middleware:
   - Verifiziert Token
   - Extrahiert userId
   - Hängt user an req.user
```

**Token-Struktur:**
```typescript
// Payload
{
  userId: string;
  email: string;
  iat: number;   // Issued At
  exp: number;   // Expiry
}
```

**Middleware:**
```typescript
// middleware/auth.ts
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ungültiges Token' });
  }
};
```

### Passwort-Hashing

**Bibliothek:** bcrypt

```typescript
import bcrypt from 'bcryptjs';

// Bei Registrierung
const passwordHash = await bcrypt.hash(password, 10);

// Bei Login
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### OAuth (Future)

**Geplant:**
- Google OAuth
- Microsoft OAuth

**Platzhalter im Code:**
```typescript
authProvider: "local" | "google" | "microsoft"
authProviderId: string?  // ID vom Provider
```

### API-Rate-Limiting

**Status:** Nicht implementiert (TODO)

**Empfehlung:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 Minuten
  max: 100,  // Max 100 Requests pro IP
});

app.use('/api/', limiter);
```

### Input-Validation

**Bibliothek:** express-validator

```typescript
import { body, validationResult } from 'express-validator';

router.put(
  '/profile',
  authenticate,
  [
    body('age').optional().isInt({ min: 18, max: 100 }),
    body('email').optional().isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ...
  }
);
```

### CORS

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### Secrets Management

**Entwicklung:** `.env` Files (gitignored)

**Production:** Render Environment Variables (Dashboard)

**Best Practices:**
- JWT_SECRET: Min. 32 Zeichen, zufällig generiert
- OPENAI_API_KEY: Nur in Backend, nie im Frontend
- DATABASE_URL: Automatisch von Render gesetzt

---

## Future Enhancements

### Phase 1: Core-Verbesserungen

1. **OAuth-Integration**
   - Google OAuth
   - Microsoft OAuth
   - Bereits vorbereitet (authProvider-Feld)

2. **Routine-System ausbauen**
   - Vollständige Implementierung
   - Zeitgesteuerte Impulse
   - Automatische Erinnerungen

3. **Learning-Units Content**
   - Aktuell: Nur Schema vorhanden
   - TODO: 25 Themenpakete × 28 Units = 700 Lerneinheiten schreiben

4. **Weekly Reports**
   - Auto-generierte Wochen-Zusammenfassungen
   - PDF-Export

### Phase 2: Advanced Features

5. **RAG (Retrieval-Augmented Generation)**
   - Dokumente in Vektor-DB (Pinecone/Weaviate)
   - Dokumenten-basierte Beratung
   - "Was steht in unserem Handbuch zu...?"

6. **Voice-Interface**
   - Whisper API für Spracherkennung
   - Text-to-Speech für AI-Antworten
   - Mobile-First Voice-Chat

7. **Team-Features**
   - Firmen-Account mit Multi-User
   - Team-Analytics
   - Shared Themenpakete

8. **Gamification**
   - Achievements & Badges
   - Streak-Tracking
   - Leaderboards (optional, Privacy-focused)

### Phase 3: Enterprise

9. **Custom Themenpakete**
   - Unternehmen können eigene Themenpakete erstellen
   - Template-System für Lerneinheiten
   - Firmenspezifische Inhalte

10. **Advanced Analytics**
    - Engagement-Metriken
    - Topic-Trends
    - ROI-Tracking

11. **Integration APIs**
    - Slack-Integration
    - Microsoft Teams
    - Calendar-Sync (Routinen)

12. **White-Label**
    - Vollständig gebrandete Instanzen
    - Custom-Domain
    - Eigenes Branding

### Technical Debt & Optimizations

- **Translation Cache**: Von In-Memory zu Redis
- **Rate Limiting**: Implementieren
- **Error Tracking**: Sentry-Integration
- **Performance Monitoring**: New Relic / DataDog
- **Test-Coverage**: Jest/Vitest Unit-Tests
- **E2E-Tests**: Playwright
- **CI/CD**: GitHub Actions für automatische Tests

---

## Changelog

### Version 2.0 (15. November 2024)

**Major Features:**
- ✅ All-Sprach-System mit KI-Übersetzungen
- ✅ KI-basierte Themenpakete-Empfehlungen
- ✅ Onboarding-Chat-System
- ✅ Dashboard mit Period-Selector & KI-Summaries
- ✅ Chat-zentrische Architektur
- ✅ Special Chats (Profil, KI-Briefing, Onboarding)
- ✅ PWA-Icons & SPA-Routing-Fix

**Architektur-Änderungen:**
- Entfernt: Routinen-Seite, Reports-Seite
- Neu: Dashboard erweitert, Profil mit embedded Chat
- System-Prompt dynamisch (Sprach-angepasst)

**Bug-Fixes:**
- 404-Fehler bei PWA-Icons behoben
- SPA-Routing mit `_redirects` File
- TypeScript-Fehler in useTranslation.tsx behoben
- Sharp-Dependency-Problem gelöst

### Version 1.0 (13. November 2024)

**Initial Release:**
- Basic Chat-System
- Themenpakete (25 vordefiniert)
- Profil-Management
- JWT-Authentication
- PostgreSQL-Integration
- OpenAI GPT-4-Integration

---

## Kontakt & Support

**Repository:** https://github.com/CBraunFI/LeadaGPT

**Issues:** https://github.com/CBraunFI/LeadaGPT/issues

**Dokumentation:** Diese spec.md

---

**Ende der Spezifikation**
**Letzte Aktualisierung:** 15. November 2024
**Version:** 2.0
