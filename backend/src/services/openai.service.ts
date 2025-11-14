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
    age?: number;
    role?: string;
    teamSize?: number;
    goals?: string[];
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
}

export const generateUserContextPrompt = (context: UserContext): string => {
  const parts: string[] = ['# Nutzerprofil'];

  if (context.profile) {
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
    max_tokens: 600,
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

  const systemPrompt = `Du bist Leada, ein KI-gestützter Leadership-Coach.

Du generierst gerade Einheit ${unit} von Tag ${day}/${totalDays} für das Themenpaket "${themenPaketTitle}".

WICHTIGE RICHTLINIEN für Themenpaket-Einheiten:
- Jede Einheit sollte 300-400 Wörter umfassen
- Beginne mit einer kurzen, motivierenden Einleitung zum heutigen Impuls
- Stelle den Kerninhalt praxisnah und konkret dar
- Nutze Beispiele aus dem Führungsalltag
- Schließe mit einer Reflexionsfrage oder einer konkreten Umsetzungsaufgabe
- Der Ton sollte persönlich, ermutigend und professionell sein
- Baue auf vorherigen Tagen auf (Tag ${day} von ${totalDays})
- Dies ist Einheit ${unit} von ${unitsPerDay} für heute

STRUKTUR:
1. Begrüßung & Kontext (z.B. "Willkommen zu Tag ${day}...")
2. Kerninhalt mit praktischen Tipps
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
