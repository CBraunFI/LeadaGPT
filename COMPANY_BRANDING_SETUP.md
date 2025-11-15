# Company Branding Setup - Dokumentation

## Übersicht

Das LeadaGPT-System unterstützt jetzt unternehmensbasiertes Branding. Unternehmen können eigene Logos und Akzentfarben hinterlegen, die dann automatisch für alle Nutzer des Unternehmens angezeigt werden.

## Datenbank-Schema

### Company-Tabelle

```sql
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,           -- URL zum Company-Logo
    "accentColor" TEXT,       -- Hex-Farbe, z.B. "#5D9FAD"
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
```

### User-Company-Relation

```sql
ALTER TABLE "User" ADD COLUMN "companyId" TEXT;
```

Nutzer können optional einem Unternehmen zugeordnet werden über das Feld `companyId`.

## API-Endpunkte

### GET /api/branding

Gibt das Branding für den aktuellen Nutzer zurück.

**Response (ohne Company):**
```json
{
  "hasCompanyBranding": false,
  "logoUrl": null,
  "accentColor": "#5D9FAD"
}
```

**Response (mit Company):**
```json
{
  "hasCompanyBranding": true,
  "logoUrl": "https://example.com/company-logo.png",
  "accentColor": "#FF5733",
  "companyName": "ACME Corporation"
}
```

## Setup im Admin-Tool (zukünftig)

Das Admin-Tool sollte folgende Funktionen bieten:

### 1. Company erstellen

```typescript
POST /api/admin/companies
{
  "name": "ACME Corporation",
  "logoUrl": "https://cdn.example.com/acme-logo.png",
  "accentColor": "#FF5733"
}
```

### 2. User zu Company zuordnen

```typescript
PUT /api/admin/users/:userId
{
  "companyId": "clxxx..."
}
```

### 3. Company-Branding bearbeiten

```typescript
PUT /api/admin/companies/:companyId
{
  "logoUrl": "https://cdn.example.com/new-logo.png",
  "accentColor": "#0066CC"
}
```

## Frontend-Integration

### Automatisches Branding

Das Frontend lädt automatisch das Branding über den `useBranding`-Hook:

```typescript
import { useBranding } from '../hooks/useBranding';

const { branding, loading } = useBranding();

// branding.logoUrl - Company-Logo oder null
// branding.accentColor - Company-Farbe oder Leada-Default (#5D9FAD)
```

### CSS-Variablen

Das System setzt automatisch folgende CSS-Variablen:

- `--accent`: Hauptfarbe des Unternehmens
- `--accent-hover`: Hover-Variante (automatisch berechnet)

### Logo-Anzeige

Das Logo wird automatisch im Header angezeigt:

```typescript
<img
  src={branding.hasCompanyBranding && branding.logoUrl ? branding.logoUrl : leadaLogo}
  alt={branding.companyName || 'Leada'}
/>
```

## Best Practices

### Logo-Anforderungen

- **Format**: PNG oder SVG empfohlen
- **Größe**: Optimiert für ca. 40-50px Höhe
- **Hintergrund**: Transparent oder weiß
- **Dateigröße**: Max. 200 KB

### Akzentfarben

- **Format**: Hex-Code mit # (z.B. `#5D9FAD`)
- **Kontrast**: Mindestens WCAG AA für Lesbarkeit
- **Konsistenz**: Sollte zur Corporate Identity passen

### Logo-Hosting

Empfohlene Optionen:
1. **Cloud-Storage**: AWS S3, Google Cloud Storage, Azure Blob Storage
2. **CDN**: CloudFlare, Fastly für schnelle Auslieferung
3. **Statisch**: Im Backend unter `/public/company-logos/`

## Beispiel-Setup

### 1. Unternehmen erstellen (via Prisma)

```typescript
const company = await prisma.company.create({
  data: {
    name: "DEKA Vermögensmanagement",
    logoUrl: "https://cdn.leada.app/companies/deka-logo.png",
    accentColor: "#E30613" // DEKA Rot
  }
});
```

### 2. Nutzer zuordnen

```typescript
await prisma.user.update({
  where: { email: "nutzer@deka.de" },
  data: {
    companyId: company.id
  }
});
```

### 3. Automatische Anwendung

Sobald der Nutzer sich einloggt:
- Logo wird im Header angezeigt
- Alle Buttons verwenden die DEKA-Farbe (#E30613)
- Hover-Effekte passen sich an

## Migration bestehender Nutzer

Bestehende Nutzer ohne `companyId` bleiben bei Leada-Branding:
- Logo: Leada-Logo
- Akzentfarbe: #5D9FAD

## Zukünftige Erweiterungen

Mögliche Ergänzungen:
- **Sekundärfarben**: Zusätzliche Brand-Farben
- **Schriftarten**: Custom Fonts pro Company
- **Themes**: Vollständige Theme-Pakete
- **Footer-Customization**: Company-spezifischer Footer-Text
- **E-Mail-Branding**: Company-Logo in automatisierten E-Mails
