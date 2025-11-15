# Leada GPT - Vollständige Spezifikation v1.0

## Vorbemerkung

**Custom GPT vs. API**: Dein „Leada GPT" als Custom GPT lässt sich nicht direkt per API aus einer eigenen App aufrufen. Das Backend muss sein Verhalten über die OpenAI-API nachbauen (System-Prompt, Dateien, ggf. Tools) – also einen „Leada-Assistant" definieren, der inhaltlich deinem Custom GPT entspricht. ([OpenAI Developer Community](https://community.openai.com/t/about-integration-of-custom-gpts-on-my-application/928118))

---

## 1. Zielbild

Eine **Progressive Web App (PWA)** namens **„Leada Chat"**, die:

* auf Desktop und Mobile läuft, installierbar ist
* einen **KI-gestützten Lern- und Umsetzungs-Coach** für Führungskräfte bietet
* **Microlearning-Themenpakete**, **Ad-hoc-Tipps** und **Routinen-Tracking** ermöglicht
* **User Authentication** (Google, Microsoft, E-Mail/Passwort) für personalisierte Erfahrung
* **standardmäßig Hell- und Dunkelmodus** unterstützt (systemgesteuert + manuelle Umschaltung)

Version 1.0 umfasst: **Authentication, User Profile, Chat, Themenpakete, Routinen-Tracking, Fortschritts-Analysen**.

---

## 2. Funktionsumfang v1.0 (fachlich)

### 2.1 Core User Stories

#### 2.1.1 Authentication & Onboarding

1. **Login/Registrierung**
   * Als Nutzer:in möchte ich mich mit **Google**, **Microsoft** oder **E-Mail/Passwort** registrieren und anmelden.
   * Nach erfolgreicher Registrierung durchlaufe ich einen **Onboarding-Flow**.

2. **Onboarding (dialogisch)**
   * Als neue:r Nutzer:in werde ich von Leada GPT begrüßt und nach meinen Profilmerkmalen gefragt:
     * Alter
     * Geschlecht
     * Rolle (z.B. Team Lead, Senior Manager, etc.)
     * Branche
     * Teamgröße
     * Führungserfahrung (Jahre)
     * Persönliche Ziele
   * Der Onboarding-Chat ist **dialogisch und ausführlich** – Leada GPT findet heraus, was ich brauche.
   * Nach dem Onboarding erhalte ich **sofort individuell passende Angebote** (Themenpakete, Tipps).

#### 2.1.2 Chatten & Lernen

3. **Chat mit Leada GPT**
   * Als Nutzer:in möchte ich Fragen zu Führung, Lernen, Leada-Themenpaketen stellen und kontextsensitive Antworten erhalten.
   * Der Chat berücksichtigt mein **Profil** und meinen **bisherigen Verlauf**.

4. **Themenpakete-Katalog**
   * Als Nutzer:in kann ich mir einen **umfassenden Katalog von Themenpaketen** anzeigen lassen (z.B. Feedback, Konfliktklärung, OKRs, Resilienz, Zeitmanagement, Design Thinking).
   * Jedes Themenpaket:
     * Dauert **14 Tage**
     * Bietet **2 Micro-Learning-Einheiten pro Tag** (max. 400 Wörter)
     * Endet jede Einheit mit einer **Reflexions- oder Umsetzungsaufgabe**
   * Ich kann ein Themenpaket **starten, pausieren oder fortsetzen**.

5. **Tägliche Micro-Learning-Einheiten**
   * Als Nutzer:in erhalte ich täglich (wenn ein Paket aktiv ist) zwei kurze Lerneinheiten.
   * Jede Einheit ist **praxisnah, klar, motivierend** (max. 400 Wörter).
   * Am Ende jeder Einheit: **Reflexionsfrage oder Umsetzungsaufgabe**.

6. **Ad-hoc-Tipps & Situationshilfe**
   * Als Nutzer:in kann ich jederzeit um Rat zu einer **akuten Situation** bitten (z.B. Konfliktgespräch, Feedbacksituation).
   * Leada GPT antwortet mit:
     * **Konkreten Best Practices**
     * **Klaren Handlungsschritten**
     * **Reflexionsfragen**
   * Verknüpfung mit relevanten Themenpaketen, falls sinnvoll.

#### 2.1.3 Routinen & Umsetzungsziele

7. **Routinen & Ziele setzen**
   * Als Nutzer:in kann ich mir **Routinen oder Umsetzungsziele** setzen:
     * z.B. „Täglich 10 Minuten Journaling"
     * z.B. „Jede Woche 1 konstruktives Feedbackgespräch"
   * Leada GPT hilft mir bei der **Formulierung** (klar, spezifisch, erreichbar).

8. **Routinen-Tracking & Erinnerungen**
   * Als Nutzer:in werden meine Routinen und Ziele **im Gesprächsverlauf getrackt**.
   * Leada GPT erinnert mich **regelmäßig** an meine Ziele.
   * Leada GPT spiegelt meinen **Fortschritt aktiv zurück**:
     * „Sie haben diese Woche bereits 2 von 3 Feedbackgesprächen umgesetzt – sehr gut!"

#### 2.1.4 Tracking & Auswertungen

9. **Fortschritts-Tracking**
   * Als Nutzer:in werden **alle meine Eingaben und Interaktionen** getrackt.
   * Leada GPT passt seine Antworten an meine **Fragen, Themen und Interessen** an.

10. **Wöchentliche Auswertung**
    * Als Nutzer:in erhalte ich **einmal pro Woche** eine **kurze, attraktive Auswertung**:
      * Welche Themen haben mich beschäftigt?
      * Woran habe ich gearbeitet?
      * Welche weiteren Themen empfiehlt Leada mir jetzt?

#### 2.1.5 Weitere Features

11. **Sessions & Historie**
    * Als Nutzer:in kann ich:
      * Eine **neue Session** starten (`/new` oder „Neue Unterhaltung starten")
      * Meine **Chat-Historie** einsehen (alle Sessions)
      * Zu früheren Sessions zurückkehren

12. **Hilfe & Onboarding**
    * Als Nutzer:in kann ich jederzeit `/help` oder „Was kannst du?" eingeben und erhalte:
      * Erklärung, was Leada GPT ist
      * Beispiele für gute Prompts
      * Hinweis auf Datenschutz

13. **Theme (Light/Dark)**
    * Als Nutzer:in möchte ich:
      * Standard: App folgt **System-Theme**
      * Manueller Wechsel: Icon oben rechts (Light / Dark / System)
      * Chat-Befehl: `/theme dark`, `/theme light`, `/theme system`

14. **Fehler-Feedback**
    * Bei API-Fehlern:
      * Klarer Hinweis im Chat („Die Verbindung zur Leada-Engine ist gerade gestört…")
      * Erneutes Senden ermöglichen

---

## 3. Nicht-funktionale Anforderungen

* **PWA-fähig**: Manifest + Service Worker + HTTPS, installierbar auf Smartphone/PC
* **Performance**: Snappy UI, optimierte Bundles
* **Barrierearm**: Kontraste, ARIA-Labels, Tastaturbedienung
* **Datenschutz**:
  * DSGVO-konform
  * Klare Einwilligungen bei Registrierung
  * API-Key **niemals** im Client
  * Verschlüsselte Speicherung sensibler Daten
* **Sicherheit**:
  * OAuth 2.0 für Google/Microsoft
  * Password Hashing (bcrypt/argon2)
  * JWT für Session-Management
  * HTTPS-only
  * Rate-Limiting

---

## 4. Architektur

### 4.1 High-Level

```
┌─────────────────────────────────────────┐
│         Frontend (PWA)                  │
│  React + TypeScript + Vite              │
│  Tailwind CSS                           │
│  PWA (Manifest + Service Worker)        │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTPS / REST API
                  │
┌─────────────────▼───────────────────────┐
│         Backend (Node.js)               │
│  Express + TypeScript                   │
│  Authentication (Passport.js)           │
│  OpenAI API Integration                 │
└─────────────────┬───────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────┐
│      Database (MongoDB/PostgreSQL)      │
│  Users, Profiles, Chats, Progress       │
└─────────────────────────────────────────┘
```

### 4.2 Frontend (PWA)

* **Framework**: React + TypeScript
* **Build-Tool**: Vite
* **Styling**: Tailwind CSS + CSS Custom Properties (für Theming)
* **State-Management**: Context API oder Zustand
* **Routing**: React Router (für Login, Dashboard, Chat)
* **HTTP-Client**: Axios oder Fetch API
* **PWA**: Vite PWA Plugin

### 4.3 Backend (API)

* **Runtime**: Node.js + TypeScript
* **Framework**: Express.js
* **Authentication**:
  * Passport.js (Google OAuth, Microsoft OAuth, Local Strategy)
  * JWT für Session-Management
* **Database ORM**: Prisma (für PostgreSQL) oder Mongoose (für MongoDB)
* **OpenAI Integration**: OpenAI SDK
* **Security**: Helmet, CORS, Rate-Limiting (express-rate-limit)

### 4.4 Database

**Option A: PostgreSQL** (empfohlen für strukturierte Daten)
**Option B: MongoDB** (flexibler für Chat-Historie)

**Schema-Design** (siehe Abschnitt 6)

---

## 5. Authentication System

### 5.1 Authentifizierungsmethoden

1. **Google OAuth 2.0**
   * Passport-Google-OAuth20
   * Scopes: `profile`, `email`

2. **Microsoft OAuth 2.0**
   * Passport-Microsoft (Azure AD)
   * Scopes: `openid`, `profile`, `email`

3. **E-Mail/Passwort**
   * Registrierung: E-Mail, Passwort (min. 8 Zeichen)
   * Login: E-Mail, Passwort
   * Password Hashing: bcrypt (cost factor 12) oder argon2

### 5.2 Authentication Flow

#### 5.2.1 OAuth Flow (Google/Microsoft)

```
User → Frontend → Backend /auth/google → Google OAuth → Callback → Backend
→ JWT Token → Frontend → Store Token → Redirect to Dashboard
```

#### 5.2.2 Email/Password Flow

**Registrierung:**
```
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "token": "jwt-token",
  "user": { "id": "...", "email": "..." }
}
```

**Login:**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "token": "jwt-token",
  "user": { "id": "...", "email": "...", "profile": {...} }
}
```

### 5.3 Session-Management

* **JWT Token**: Stored in `localStorage` oder `httpOnly Cookie` (sicherer)
* **Token Expiry**: 7 Tage
* **Refresh Token**: Optional (für v1.0 nicht zwingend)

### 5.4 Backend Endpoints

```
POST   /api/auth/register          # E-Mail/Passwort Registrierung
POST   /api/auth/login             # E-Mail/Passwort Login
GET    /api/auth/google            # Google OAuth Start
GET    /api/auth/google/callback   # Google OAuth Callback
GET    /api/auth/microsoft         # Microsoft OAuth Start
GET    /api/auth/microsoft/callback # Microsoft OAuth Callback
POST   /api/auth/logout            # Logout (Token invalidieren)
GET    /api/auth/me                # Aktueller User (JWT-protected)
```

---

## 6. Database Schema

### 6.1 PostgreSQL Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?   // null für OAuth-User
  authProvider  String    // "local" | "google" | "microsoft"
  authProviderId String? // ID vom OAuth-Provider
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       UserProfile?
  sessions      ChatSession[]
  routines      Routine[]
  weeklyReports WeeklyReport[]
}

model UserProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  age                Int?
  gender             String?
  role               String?
  industry           String?
  teamSize           Int?
  leadershipYears    Int?
  goals              String[] // Array von Zielen

  onboardingComplete Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model ChatSession {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  title       String?   // Optional: "Feedback-Coaching", etc.
  messages    Message[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Message {
  id          String      @id @default(cuid())
  sessionId   String
  session     ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  role        String      // "user" | "assistant" | "system"
  content     String      @db.Text
  metadata    Json?       // z.B. Themenpaket-ID, Einheit-Nummer
  createdAt   DateTime    @default(now())
}

model ThemenPaket {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  duration    Int      @default(14) // Tage
  unitsPerDay Int      @default(2)

  units       LearningUnit[]
  progress    UserThemenPaketProgress[]
}

model LearningUnit {
  id              String      @id @default(cuid())
  themenPaketId   String
  themenPaket     ThemenPaket @relation(fields: [themenPaketId], references: [id], onDelete: Cascade)

  day             Int         // 1-14
  unitNumber      Int         // 1 oder 2
  title           String
  content         String      @db.Text // Max 400 Wörter
  reflectionTask  String      @db.Text

  order           Int         // Gesamtreihenfolge
}

model UserThemenPaketProgress {
  id              String      @id @default(cuid())
  userId          String
  themenPaketId   String
  themenPaket     ThemenPaket @relation(fields: [themenPaketId], references: [id], onDelete: Cascade)

  status          String      // "active" | "paused" | "completed"
  currentDay      Int         @default(1)
  currentUnit     Int         @default(1)

  startedAt       DateTime    @default(now())
  lastAccessedAt  DateTime    @updatedAt
  completedAt     DateTime?

  @@unique([userId, themenPaketId])
}

model Routine {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title       String
  description String?
  frequency   String   // "daily" | "weekly" | "custom"
  target      Int?     // z.B. 3x pro Woche

  status      String   @default("active") // "active" | "paused" | "completed"

  entries     RoutineEntry[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RoutineEntry {
  id         String   @id @default(cuid())
  routineId  String
  routine    Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)

  date       DateTime
  completed  Boolean  @default(false)
  note       String?

  createdAt  DateTime @default(now())
}

model WeeklyReport {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  weekStart  DateTime
  weekEnd    DateTime

  topics     String[] // Themen, die den User beschäftigt haben
  progress   Json     // Fortschritt bei Themenpaketen, Routinen
  recommendations String[] // Empfohlene Themenpakete

  createdAt  DateTime @default(now())
}
```

### 6.2 MongoDB Schema (Alternative)

Ähnliche Struktur, aber mit embedded documents für Messages, RoutineEntries, etc.

---

## 7. Backend API Spezifikation

### 7.1 Authentication (siehe Abschnitt 5.4)

### 7.2 User Profile

```
GET    /api/profile              # Profil abrufen
PUT    /api/profile              # Profil aktualisieren
POST   /api/profile/onboarding   # Onboarding abschließen
```

**PUT /api/profile**
```json
{
  "age": 35,
  "gender": "male",
  "role": "Team Lead",
  "industry": "Tech",
  "teamSize": 8,
  "leadershipYears": 5,
  "goals": ["Besseres Feedback geben", "Konflikte professionell lösen"]
}
```

### 7.3 Chat

```
GET    /api/chat/sessions        # Alle Sessions abrufen
POST   /api/chat/sessions        # Neue Session erstellen
GET    /api/chat/sessions/:id    # Session mit Messages abrufen
POST   /api/chat/sessions/:id/messages  # Neue Message senden
DELETE /api/chat/sessions/:id    # Session löschen
```

**POST /api/chat/sessions/:id/messages**
```json
{
  "content": "Wie gebe ich konstruktives Feedback?"
}

Response:
{
  "userMessage": {
    "id": "msg-123",
    "role": "user",
    "content": "Wie gebe ich konstruktives Feedback?",
    "createdAt": "2025-11-13T10:00:00Z"
  },
  "assistantMessage": {
    "id": "msg-124",
    "role": "assistant",
    "content": "Konstruktives Feedback zu geben ist eine wichtige Führungskompetenz...",
    "createdAt": "2025-11-13T10:00:05Z"
  }
}
```

### 7.4 Themenpakete

```
GET    /api/themenpakete         # Alle Themenpakete abrufen
GET    /api/themenpakete/:id     # Einzelnes Themenpaket mit Units
POST   /api/themenpakete/:id/start    # Themenpaket starten
POST   /api/themenpakete/:id/pause    # Themenpaket pausieren
POST   /api/themenpakete/:id/continue # Themenpaket fortsetzen
GET    /api/themenpakete/progress     # Fortschritt aller Pakete
```

**GET /api/themenpakete**
```json
[
  {
    "id": "tp-1",
    "title": "Konstruktives Feedback geben",
    "description": "Lernen Sie, wie Sie Feedback so formulieren, dass es motiviert und weiterbringt.",
    "duration": 14,
    "unitsPerDay": 2,
    "status": "not_started", // oder "active", "paused", "completed"
    "progress": null
  },
  ...
]
```

### 7.5 Routinen & Ziele

```
GET    /api/routines             # Alle Routinen abrufen
POST   /api/routines             # Neue Routine erstellen
PUT    /api/routines/:id         # Routine aktualisieren
DELETE /api/routines/:id         # Routine löschen
POST   /api/routines/:id/entries # Eintrag hinzufügen (Routine erfüllt)
GET    /api/routines/:id/stats   # Statistiken zur Routine
```

**POST /api/routines**
```json
{
  "title": "Täglich 10 Minuten Journaling",
  "description": "Reflektiere über den Tag",
  "frequency": "daily",
  "target": null
}
```

**POST /api/routines/:id/entries**
```json
{
  "date": "2025-11-13",
  "completed": true,
  "note": "Heute über Teammeeting reflektiert"
}
```

### 7.6 Weekly Reports

```
GET    /api/reports/weekly       # Alle wöchentlichen Reports
GET    /api/reports/weekly/latest # Neuester Report
POST   /api/reports/weekly/generate # Neuen Report generieren (kann auch automatisch passieren)
```

**GET /api/reports/weekly/latest**
```json
{
  "id": "wr-1",
  "weekStart": "2025-11-11",
  "weekEnd": "2025-11-17",
  "topics": ["Feedback", "Konfliktlösung", "Zeitmanagement"],
  "progress": {
    "themenpakete": [
      {
        "title": "Konstruktives Feedback geben",
        "currentDay": 5,
        "totalDays": 14
      }
    ],
    "routines": [
      {
        "title": "Täglich Journaling",
        "completedDays": 5,
        "targetDays": 7
      }
    ]
  },
  "recommendations": [
    "OKRs erfolgreich einführen",
    "Resilienz aufbauen"
  ],
  "createdAt": "2025-11-18T00:00:00Z"
}
```

---

## 8. OpenAI Integration (Backend)

### 8.1 System-Prompt

Der **System-Prompt** aus `system_prompt.md` wird als Konstante im Backend verwendet:

```typescript
const LEADA_SYSTEM_PROMPT = `
Du bist *Leada-GPT*, ein KI-gestützter Lern- und Umsetzungs-Coach für Berufstätige, insbesondere Führungskräfte.
...
[Vollständiger Prompt aus system_prompt.md]
`;
```

### 8.2 Context Injection

Bei jedem Chat-Request wird zusätzlich zum System-Prompt der **User-Kontext** injiziert:

```typescript
const userContext = `
# Nutzerprofil
- Alter: ${profile.age}
- Rolle: ${profile.role}
- Teamgröße: ${profile.teamSize}
- Ziele: ${profile.goals.join(", ")}

# Aktive Themenpakete
${activeThemenpakete.map(tp => `- ${tp.title} (Tag ${tp.currentDay}/14)`).join("\n")}

# Aktive Routinen
${activeRoutines.map(r => `- ${r.title} (${r.completedThisWeek}/${r.target} diese Woche)`).join("\n")}
`;

const messages = [
  { role: "system", content: LEADA_SYSTEM_PROMPT },
  { role: "system", content: userContext },
  ...chatHistory
];
```

### 8.3 OpenAI API Call

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getChatResponse(messages: Message[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini", // oder "gpt-4.1"
    messages: messages,
    max_tokens: 600, // Max 400 Wörter ≈ 500-600 tokens
    temperature: 0.7
  });

  return response.choices[0].message.content;
}
```

### 8.4 Streaming (Optional)

Für bessere UX kann Streaming aktiviert werden:

```typescript
const stream = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: messages,
  max_tokens: 600,
  stream: true
});

// Stream an Frontend weiterleiten (Server-Sent Events)
```

---

## 9. Frontend Spezifikation

### 9.1 Seiten & Routing

```
/                     → Landing Page (öffentlich)
/login                → Login/Registrierung
/onboarding           → Onboarding-Flow (nach Registrierung)
/dashboard            → Dashboard (Übersicht)
/chat                 → Chat mit Leada GPT (Hauptbereich)
/chat/:sessionId      → Spezifische Chat-Session
/themenpakete         → Themenpakete-Katalog
/themenpakete/:id     → Einzelnes Themenpaket (Details + Start)
/routinen             → Routinen & Ziele Übersicht
/profil               → User-Profil bearbeiten
/reports              → Wöchentliche Auswertungen
```

### 9.2 Layout-Komponenten

#### 9.2.1 Header/Navbar

* Logo: „Leada Chat"
* Navigation (für eingeloggte User):
  * Dashboard
  * Chat
  * Themenpakete
  * Routinen
  * Profil
* Rechts:
  * Theme-Toggle (Light/Dark/System)
  * User-Menü (Dropdown: Profil, Reports, Logout)

#### 9.2.2 Login/Registrierung Page

**Tabs**: Login | Registrierung

**Login:**
* E-Mail-Feld
* Passwort-Feld
* Button: „Anmelden"
* Divider: „oder"
* Button: „Mit Google anmelden"
* Button: „Mit Microsoft anmelden"

**Registrierung:**
* E-Mail-Feld
* Passwort-Feld (mit Stärke-Indikator)
* Passwort wiederholen
* Checkbox: „Ich akzeptiere die Datenschutzerklärung"
* Button: „Registrieren"
* Divider: „oder"
* Button: „Mit Google registrieren"
* Button: „Mit Microsoft registrieren"

#### 9.2.3 Onboarding Page

**Multi-Step-Form:**

* **Schritt 1**: Begrüßung + Erklärung
* **Schritt 2**: Profilangaben (Alter, Geschlecht, Rolle, Branche, Teamgröße)
* **Schritt 3**: Führungserfahrung + Ziele (Freitext oder Checkboxen)
* **Schritt 4**: Themenpaket-Empfehlungen basierend auf Profil
* **Schritt 5**: Abschluss + „Los geht's"

Alternativ: **Onboarding als Chat** (noch besser für dialogische UX):
* Nach Login wird User in einen Onboarding-Chat geleitet
* Leada GPT führt durch das Onboarding (Fragen stellen, Antworten verarbeiten)
* Am Ende: Profil komplett + erste Empfehlungen

#### 9.2.4 Dashboard Page

* **Begrüßung**: „Hallo, [Name]! Hier ist dein Überblick:"
* **Aktive Themenpakete** (Kacheln):
  * Titel, Fortschritt (Tag 5/14), Button „Weiter"
* **Routinen** (kompakte Liste):
  * Titel, Status diese Woche (3/7), Button „Eintragen"
* **Letzte Chat-Sessions** (Liste):
  * Titel, Zeitstempel, Button „Fortsetzen"
* **Quick Actions**:
  * „Neuer Chat"
  * „Themenpakete durchsuchen"
  * „Routine hinzufügen"

#### 9.2.5 Chat Page

**Layout:**
```
┌────────────────────────────────────────┐
│  Header (Session-Titel + Actions)     │
├────────────────────────────────────────┤
│                                        │
│  Chat Messages (scrollbar)             │
│  - User Message (rechts, farbig)       │
│  - Assistant Message (links, Avatar)   │
│  - System Message (zentriert, grau)    │
│                                        │
│                                        │
├────────────────────────────────────────┤
│  Input Area (Textarea + Send-Button)   │
└────────────────────────────────────────┘
```

**Features:**
* **Auto-Scroll** zu neuen Messages
* **Typing Indicator** („Leada denkt…") während API-Call
* **Textarea**: Auto-resizing, `Enter` = Senden, `Shift+Enter` = Neue Zeile
* **Slash-Commands**:
  * `/new` → Neue Session
  * `/help` → Hilfe anzeigen
  * `/theme light|dark|system` → Theme wechseln
  * `/themenpakete` → Katalog anzeigen
  * `/routinen` → Routinen anzeigen

#### 9.2.6 Themenpakete Page

* **Katalog** (Grid oder Liste):
  * Jedes Paket:
    * Titel
    * Beschreibung (kurz)
    * Dauer (14 Tage)
    * Status (nicht gestartet / aktiv / abgeschlossen)
    * Button: „Starten" oder „Fortsetzen" oder „Details"
* **Detailansicht** (Modal oder separate Page):
  * Vollständige Beschreibung
  * Liste aller Learning Units (Tag 1, Einheit 1, etc.)
  * Button: „Starten"

#### 9.2.7 Routinen Page

* **Liste aller Routinen**:
  * Titel
  * Beschreibung
  * Fortschritt (diese Woche / letzten 30 Tage)
  * Buttons: „Eintragen", „Bearbeiten", „Löschen"
* **Button**: „Neue Routine hinzufügen" (öffnet Modal)
* **Modal: Routine erstellen/bearbeiten**:
  * Titel
  * Beschreibung
  * Frequenz (täglich / wöchentlich / custom)
  * Ziel (z.B. 3x pro Woche)

#### 9.2.8 Profil Page

* **Formular** zum Bearbeiten von:
  * Alter, Geschlecht, Rolle, Branche, Teamgröße, Führungserfahrung, Ziele
* Button: „Speichern"
* Sektion: **Account-Einstellungen**
  * E-Mail anzeigen (nicht änderbar, oder mit Verifizierung)
  * Passwort ändern (nur für E-Mail/Passwort-User)
  * Account löschen (mit Bestätigung)

#### 9.2.9 Reports Page

* **Liste wöchentlicher Reports** (neueste zuerst):
  * Woche vom X bis Y
  * Zusammenfassung (Topics, Fortschritt)
  * Button: „Details anzeigen"
* **Detail-Ansicht**:
  * Themen, die mich beschäftigt haben
  * Fortschritt bei Themenpaketen (Visualisierung)
  * Fortschritt bei Routinen (Visualisierung)
  * Empfohlene Themenpakete
  * Button: „Themenpaket starten"

### 9.3 State-Management

**Globaler State** (Context API oder Zustand):

```typescript
interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Profile
  profile: UserProfile | null;

  // Theme
  theme: "light" | "dark" | "system";

  // Chat
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;

  // Themenpakete
  themenpakete: ThemenPaket[];
  activeThemenpakete: UserThemenPaketProgress[];

  // Routinen
  routines: Routine[];
}
```

### 9.4 Chat-Logik & Commands

**Client-seitig**:

1. User tippt Nachricht
2. Vor dem Senden: Prüfen auf Slash-Commands
   * `/help` → Hilfetext lokal anzeigen (kein API-Call)
   * `/new` → Neue Session erstellen
   * `/theme <mode>` → Theme wechseln
   * `/themenpakete` → Zur Themenpakete-Seite navigieren
   * `/routinen` → Zur Routinen-Seite navigieren
3. Bei normaler Nachricht:
   * User-Message an State anhängen
   * POST `/api/chat/sessions/:id/messages`
   * Assistant-Message aus Response anhängen

**Server-seitig**:
* Bei jedem Chat-Request: User-Kontext + System-Prompt + Chat-Historie an OpenAI
* Response speichern in DB
* Response zurück an Client

---

## 10. Theming (Light/Dark)

### 10.1 CSS Custom Properties

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --fg-primary: #111111;
  --fg-secondary: #666666;
  --accent: #06206f; /* Leada / SYNK Farbe */
  --accent-hover: #041952;
  --border: #e0e0e0;
}

[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --fg-primary: #f7f7f7;
  --fg-secondary: #aaaaaa;
  --accent: #7b8cff;
  --accent-hover: #6577ee;
  --border: #333333;
}
```

### 10.2 Theme-Logik

```typescript
const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme: "light" | "dark" | "system") => {
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", effectiveTheme);
  localStorage.setItem("theme", theme);
};

// Bei App-Start
const savedTheme = localStorage.getItem("theme") || "system";
applyTheme(savedTheme);

// System-Theme-Änderungen beobachten
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const currentTheme = localStorage.getItem("theme") || "system";
  if (currentTheme === "system") {
    applyTheme("system");
  }
});
```

---

## 11. PWA-Spezifikation

### 11.1 `manifest.webmanifest`

```json
{
  "name": "Leada Chat - KI-Coach für Führungskräfte",
  "short_name": "Leada Chat",
  "description": "KI-gestützter Lern- und Umsetzungs-Coach für Führungskräfte",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#06206f",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 11.2 Service Worker

**Strategie**:
* **Cache-First**: Statische Assets (JS, CSS, Fonts, Icons)
* **Network-First**: API-Calls (mit Fallback auf „Offline"-Nachricht)
* **Precache**: `index.html`, Manifest, Icons

**Vite PWA Plugin** (empfohlen):
```typescript
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        // ... (siehe oben)
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.leadachat\.com\/api\/.*/,
            handler: "NetworkFirst",
            options: {
              networkTimeoutSeconds: 10,
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300 // 5 Minuten
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 11.3 Offline-Handling

* Bei Offline-Status:
  * Chat-Input deaktivieren
  * Info-Banner: „Du bist offline – Leada braucht Internet, um zu antworten."
* Offline-Modus (v1.1+):
  * Chat-Historie lesbar
  * Routinen-Einträge lokal speichern, später synchronisieren

---

## 12. Sicherheit & Konfiguration

### 12.1 Umgebungsvariablen (Backend)

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/leadagpt

# JWT
JWT_SECRET=supersecretkey123456789
JWT_EXPIRY=7d

# OpenAI
OPENAI_API_KEY=sk-...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://api.leadachat.com/api/auth/google/callback

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_CALLBACK_URL=https://api.leadachat.com/api/auth/microsoft/callback

# CORS
ALLOWED_ORIGIN=https://leadachat.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=600000  # 10 Minuten
RATE_LIMIT_MAX_REQUESTS=60   # 60 Requests / 10 Min
```

### 12.2 CORS

```typescript
import cors from "cors";

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true
}));
```

### 12.3 Rate-Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "600000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60"),
  message: "Zu viele Anfragen, bitte später nochmal versuchen."
});

app.use("/api/", limiter);
```

### 12.4 Security Headers

```typescript
import helmet from "helmet";

app.use(helmet());
```

### 12.5 Input Validation

```typescript
import { body, validationResult } from "express-validator";

app.post("/api/chat/sessions/:id/messages", [
  body("content").isString().trim().isLength({ min: 1, max: 2000 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
});
```

---

## 13. Deployment

### 13.1 Frontend (PWA)

**Hosting**: Vercel, Netlify, oder statisches Hosting (S3 + CloudFront)

**Build**:
```bash
npm run build
# Output: dist/
```

**Deployment** (Vercel):
```bash
vercel --prod
```

### 13.2 Backend

**Hosting**: Heroku, Railway, Render, oder VPS (DigitalOcean, AWS EC2)

**Build**:
```bash
npm run build
# Output: dist/
```

**Start**:
```bash
npm start
```

**Docker** (Optional):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### 13.3 Database

**Hosting**:
* PostgreSQL: Supabase, Railway, Heroku Postgres, AWS RDS
* MongoDB: MongoDB Atlas

### 13.4 CI/CD

**GitHub Actions** (Beispiel):
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: # Deploy zu Railway/Heroku/etc.
```

---

## 14. Testing

### 14.1 Frontend

* **Unit-Tests**: Vitest + React Testing Library
* **E2E-Tests**: Playwright oder Cypress
* **Coverage**: Mindestens 70% für kritische Komponenten

### 14.2 Backend

* **Unit-Tests**: Jest
* **Integration-Tests**: Supertest
* **API-Tests**: Postman/Newman oder Thunder Client
* **Coverage**: Mindestens 80% für Business-Logik

### 14.3 Test-Cases (Beispiele)

**Frontend:**
* Login mit Google/Microsoft/E-Mail
* Onboarding-Flow durchlaufen
* Chat-Nachricht senden und Antwort erhalten
* Themenpaket starten
* Routine hinzufügen und Eintrag machen
* Theme wechseln

**Backend:**
* User-Registrierung und Login
* JWT-Token-Validierung
* Chat-Message speichern und abrufen
* Themenpakete-Fortschritt tracken
* Routinen CRUD
* Weekly Report generieren

---

## 15. Erweiterbarkeit (Zukunft)

Nicht in v1.0, aber Architektur ermöglicht:

### 15.1 Features

* **Multi-Session-Historie mit Benennung**: User können Sessions umbenennen („Coaching mit Leada – Stress")
* **Export**: Chat-Session als Markdown/PDF exportieren
* **File-Upload**: Nutzer lädt Dokumente hoch, Leada GPT bezieht sie in Antworten ein (OpenAI File-Search)
* **Notifications**: Push-Notifications für tägliche Einheiten, Routinen-Erinnerungen
* **Teams**: Unternehmens-Accounts mit mehreren Nutzern
* **Analytics-Dashboard**: Admins sehen aggregierte Nutzungsstatistiken
* **Mehrsprachigkeit**: i18n (Deutsch, Englisch)
* **Voice-Input**: Spracheingabe per Web Speech API
* **Themenpakete-Editor**: Admins können eigene Themenpakete erstellen

### 15.2 Integrations

* **PPTX-Maker**: „Generiere Folienstruktur für dieses Thema" → Anbindung an bestehenden PPTX-Maker
* **Calendar**: Termine für Coachings/Reflexionen in Google Calendar eintragen
* **Slack/Teams**: Leada GPT als Bot in Unternehmens-Chat

---

## 16. Zusammenfassung & nächste Schritte

Diese Spezifikation deckt vollständig ab:

✅ **System-Prompt**: Leada-GPT als KI-Coach mit Themenpaketen, Routinen, Tracking
✅ **Authentication**: Google, Microsoft, E-Mail/Passwort
✅ **User Profile**: Profilbasierte Personalisierung
✅ **Themenpakete**: 14-Tage-Microlearning mit Tracking
✅ **Routinen & Ziele**: Setzen, Tracken, Erinnerungen
✅ **Tracking & Reports**: Wöchentliche Auswertungen
✅ **Chat**: Kontextsensitiv, Ad-hoc-Tipps, Slash-Commands
✅ **PWA**: Installierbar, Offline-fähig, Theming
✅ **Sicherheit**: JWT, OAuth, Hashing, Rate-Limiting
✅ **Architektur**: React + TypeScript (Frontend), Node + Express (Backend), PostgreSQL/MongoDB (DB)

### Next Steps:

1. **Setup**: Projekt initialisieren (Vite + React, Express + TypeScript, Prisma + PostgreSQL)
2. **Authentication**: OAuth + E-Mail/Passwort implementieren
3. **Database**: Schema mit Prisma anlegen, Migrationen durchführen
4. **Backend-API**: Endpunkte implementieren (Auth, Profile, Chat, Themenpakete, Routinen)
5. **OpenAI-Integration**: System-Prompt + Context Injection
6. **Frontend**: Pages & Komponenten bauen (Login, Onboarding, Chat, Dashboard, etc.)
7. **PWA**: Manifest + Service Worker
8. **Testing**: Unit- & Integration-Tests
9. **Deployment**: Frontend + Backend deployen
10. **Monitoring**: Logging, Error-Tracking (Sentry)

---

**Bereit für die Umsetzung mit Claude Code!**
