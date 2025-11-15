import OpenAI from 'openai';
import { LEADA_SYSTEM_PROMPT } from '../config/system-prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UserContext {
  profile?: {
    firstName?: string;
    age?: number;
    role?: string;
    teamSize?: number;
    goals?: string[];
    onboardingComplete?: boolean;
  };
  activeThemenpakete?: Array<{
    title: string;
    currentDay: number;
    totalDays: number;
  }>;
  activeRoutines?: Array<{
    title: string;
    completedThisWeek: number;
    target: number;
  }>;
  documentsContext?: string;
  languageStyle?: string;
}

export const generateUserContextPrompt = (context: UserContext): string => {
  const parts: string[] = ['# Nutzerprofil'];

  if (context.profile) {
    // Add firstName first for personal greeting
    if (context.profile.firstName) parts.push(`- Name: ${context.profile.firstName}`);

    // Add onboarding status
    if (context.profile.onboardingComplete !== undefined) {
      parts.push(`- Onboarding abgeschlossen: ${context.profile.onboardingComplete ? 'Ja' : 'Nein'}`);
    }

    if (context.profile.age) parts.push(`- Alter: ${context.profile.age}`);
    if (context.profile.role) parts.push(`- Rolle: ${context.profile.role}`);
    if (context.profile.teamSize)
      parts.push(`- Teamgröße: ${context.profile.teamSize}`);
    if (context.profile.goals && context.profile.goals.length > 0) {
      parts.push(`- Ziele: ${context.profile.goals.join(', ')}`);
    }
  }

  if (context.activeThemenpakete && context.activeThemenpakete.length > 0) {
    parts.push('\n# Aktive Themenpakete');
    context.activeThemenpakete.forEach((tp) => {
      parts.push(`- ${tp.title} (Tag ${tp.currentDay}/${tp.totalDays})`);
    });
  }

  if (context.activeRoutines && context.activeRoutines.length > 0) {
    parts.push('\n# Aktive Routinen');
    context.activeRoutines.forEach((r) => {
      parts.push(`- ${r.title} (${r.completedThisWeek}/${r.target} diese Woche)`);
    });
  }

  // Add language style hint if available
  if (context.languageStyle) {
    parts.push(`\n# Sprach-Stil des Nutzers`);
    parts.push(context.languageStyle);
  }

  // Add document context if available
  if (context.documentsContext) {
    parts.push(context.documentsContext);
  }

  return parts.join('\n');
};

export const getChatCompletion = async (
  messages: ChatMessage[],
  userContext?: UserContext
): Promise<string> => {
  const systemMessages: ChatMessage[] = [
    { role: 'system', content: LEADA_SYSTEM_PROMPT },
  ];

  if (userContext) {
    const contextPrompt = generateUserContextPrompt(userContext);
    if (contextPrompt) {
      systemMessages.push({ role: 'system', content: contextPrompt });
    }
  }

  const allMessages = [...systemMessages, ...messages];

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: allMessages,
    max_tokens: 2000,  // Increased for complete responses without truncation
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Entschuldigung, ich konnte keine Antwort generieren.';
};

export const generateChatTitle = async (
  messages: ChatMessage[]
): Promise<string> => {
  // Use the first few messages to generate a concise, thematic title
  const conversationSummary = messages
    .slice(0, 4) // Use first 4 messages max
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Du bist ein Assistent, der prägnante Titel für Coaching-Gespräche erstellt. Antworte NUR mit dem Titel, maximal 2-4 Wörter, ohne Anführungszeichen oder Erklärungen. Der Titel sollte das Hauptthema des Gesprächs widerspiegeln, z.B. "Zeitmanagement", "Konflikte im Team", "Feedback geben", "Delegation", etc.'
      },
      {
        role: 'user',
        content: `Erstelle einen kurzen, prägnanten Titel für folgendes Gespräch:\n\n${conversationSummary}`
      }
    ],
    max_tokens: 20,
    temperature: 0.5,
  });

  const title = response.choices[0].message.content?.trim() || 'Coaching-Gespräch';

  // Remove quotes if present
  return title.replace(/["""]/g, '');
};

export interface ThemenPaketUnitParams {
  themenPaketTitle: string;
  day: number;
  unit: number;
  totalDays: number;
  unitsPerDay: number;
  userContext?: UserContext;
}

export const generateThemenPaketUnit = async (
  params: ThemenPaketUnitParams
): Promise<string> => {
  const { themenPaketTitle, day, unit, totalDays, unitsPerDay, userContext } = params;

  const contextPrompt = userContext ? generateUserContextPrompt(userContext) : '';

  // Determine learning phase based on day
  let learningPhase = '';
  let phaseGuidelines = '';

  if (day >= 1 && day <= 3) {
    learningPhase = 'Grundlagen & Bewusstsein';
    phaseGuidelines = `
- Führe in das Thema ein und erkläre, warum es wichtig ist
- Fördere Selbstreflexion: Wo steht der Nutzer heute?
- Vermittle Grundkonzepte und wichtige Terminologie
- Schaffe ein Bewusstsein für das Thema`;
  } else if (day >= 4 && day <= 7) {
    learningPhase = 'Vertiefung & Methoden';
    phaseGuidelines = `
- Vermittle konkrete Techniken und Werkzeuge
- Zeige Best Practices aus der Praxis
- Erkläre häufige Fehler und wie man sie vermeidet
- Biete erste Umsetzungsübungen an
- Baue auf den Grundlagen der Tage 1-3 auf`;
  } else if (day >= 8 && day <= 10) {
    learningPhase = 'Anwendung & Integration';
    phaseGuidelines = `
- Präsentiere komplexere Szenarien
- Verknüpfe mit anderen Führungsthemen
- Passe an die individuelle Situation des Nutzers an
- Zeige, wie mit Herausforderungen umzugehen ist
- Wiederhole zentrale Konzepte aus Tagen 1-7`;
  } else if (day >= 11 && day <= 14) {
    learningPhase = 'Meisterschaft & Nachhaltigkeit';
    phaseGuidelines = `
- Vermittle fortgeschrittene Techniken
- Zeige langfristige Integration in den Führungsalltag
- Definiere messbare Erfolgskriterien
- Fokussiere auf kontinuierliche Verbesserung
- Biete eine Abschlussreflexion und nächste Schritte
- Wiederhole die wichtigsten Erkenntnisse aus dem gesamten Paket`;
  }

  const systemPrompt = `Du bist Leada, ein KI-gestützter Leadership-Coach.

Du generierst gerade Einheit ${unit} von Tag ${day}/${totalDays} für das Themenpaket "${themenPaketTitle}".

🎯 LERNPHASE: ${learningPhase} (Tag ${day} von ${totalDays})

${phaseGuidelines}

DIDAKTISCHE PRINZIPIEN:
- Baue auf vorherigen Tagen auf (z.B. "Wie Sie an Tag X gelernt haben...")
- Wiederhole zentrale Konzepte zur Festigung
- Steigere die Komplexität graduell
- Nutze konkrete Beispiele aus der Führungspraxis
- Jede Einheit sollte einen klaren "Aha-Moment" bieten

WICHTIGE RICHTLINIEN für Themenpaket-Einheiten:
- Jede Einheit sollte 300-400 Wörter umfassen
- Beginne mit einer kurzen, motivierenden Einleitung zum heutigen Impuls
- Stelle den Kerninhalt praxisnah und konkret dar
- Nutze Beispiele aus dem Führungsalltag
- Schließe mit einer Reflexionsfrage oder einer konkreten Umsetzungsaufgabe
- Der Ton sollte persönlich, ermutigend und professionell sein
- Dies ist Einheit ${unit} von ${unitsPerDay} für heute

STRUKTUR:
1. Begrüßung & Kontext (z.B. "Willkommen zu Tag ${day}...")
2. Kerninhalt mit praktischen Tipps (angepasst an Lernphase)
3. Reflexionsfrage oder Umsetzungsaufgabe

${contextPrompt ? `\n${contextPrompt}` : ''}

Passe den Inhalt an das Profil des Nutzers an, wenn vorhanden.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generiere jetzt die Einheit ${unit} für Tag ${day} des Themenpakets "${themenPaketTitle}".`
      }
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Entschuldigung, ich konnte keine Einheit generieren.';
};
