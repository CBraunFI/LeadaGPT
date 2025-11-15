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
    if (context.profile.firstName) parts.push(`- Name: ${context.profile.firstName}`);
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
    max_tokens: 2000,
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Entschuldigung, ich konnte keine Antwort generieren.';
};
