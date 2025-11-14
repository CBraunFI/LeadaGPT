import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedProfileInfo {
  age?: number;
  gender?: string;
  role?: string;
  industry?: string;
  teamSize?: number;
  leadershipYears?: number;
  goals?: string[];
  hasNewInfo: boolean;
}

/**
 * Extracts profile information from a conversation
 * Uses GPT-4 to identify user information mentioned in the chat
 */
export const extractProfileInformation = async (
  userMessage: string,
  assistantMessage: string,
  currentProfile?: any
): Promise<ExtractedProfileInfo> => {
  try {
    const systemPrompt = `Du bist ein Informations-Extraktions-Assistent. Deine Aufgabe ist es, Profilinformationen aus Konversationen zu extrahieren.

Analysiere die folgenden Nachrichten und extrahiere ALLE neu erwähnten Profilinformationen des Nutzers:

WICHTIGE REGELN:
- Extrahiere NUR explizit erwähnte Informationen
- Keine Vermutungen oder Interpretationen
- Wenn der Nutzer etwas über sich erzählt, extrahiere es
- Wenn keine neuen Informationen vorhanden sind, gib ein leeres Objekt zurück

PROFILINFORMATIONEN ZUM EXTRAHIEREN:
- age: Alter (nur Zahl)
- gender: Geschlecht
- role: Berufliche Rolle/Position (z.B. "Teamleiter", "Abteilungsleiter", "CEO")
- industry: Branche (z.B. "IT", "Gesundheitswesen", "Automotive")
- teamSize: Teamgröße (nur Zahl)
- leadershipYears: Jahre Führungserfahrung (nur Zahl)
- goals: Ziele als Array (z.B. ["Bessere Delegation", "Konfliktlösung verbessern"])

AKTUELLES PROFIL:
${currentProfile ? JSON.stringify(currentProfile, null, 2) : 'Noch kein Profil vorhanden'}

Antworte NUR mit einem JSON-Objekt im folgenden Format (keine zusätzlichen Erklärungen):
{
  "age": number | null,
  "gender": string | null,
  "role": string | null,
  "industry": string | null,
  "teamSize": number | null,
  "leadershipYears": number | null,
  "goals": string[] | null,
  "hasNewInfo": boolean
}

Setze hasNewInfo auf true, wenn mindestens eine neue Information gefunden wurde.
Wenn eine Information bereits im aktuellen Profil vorhanden ist, erwähne sie NICHT erneut.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `USER: ${userMessage}\n\nASSISTENT: ${assistantMessage}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1, // Low temperature for factual extraction
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { hasNewInfo: false };
    }

    const extracted = JSON.parse(content);

    // Clean up null values
    const result: ExtractedProfileInfo = { hasNewInfo: extracted.hasNewInfo || false };

    if (extracted.age && typeof extracted.age === 'number') {
      result.age = extracted.age;
    }
    if (extracted.gender && typeof extracted.gender === 'string') {
      result.gender = extracted.gender;
    }
    if (extracted.role && typeof extracted.role === 'string') {
      result.role = extracted.role;
    }
    if (extracted.industry && typeof extracted.industry === 'string') {
      result.industry = extracted.industry;
    }
    if (extracted.teamSize && typeof extracted.teamSize === 'number') {
      result.teamSize = extracted.teamSize;
    }
    if (extracted.leadershipYears && typeof extracted.leadershipYears === 'number') {
      result.leadershipYears = extracted.leadershipYears;
    }
    if (extracted.goals && Array.isArray(extracted.goals) && extracted.goals.length > 0) {
      result.goals = extracted.goals;
    }

    return result;
  } catch (error) {
    console.error('Profile extraction error:', error);
    return { hasNewInfo: false };
  }
};

/**
 * Merge extracted profile info with existing profile
 */
export const mergeProfileInfo = (
  currentProfile: any,
  extracted: ExtractedProfileInfo
): any => {
  if (!extracted.hasNewInfo) {
    return currentProfile;
  }

  const updated: any = { ...currentProfile };

  if (extracted.age !== undefined) updated.age = extracted.age;
  if (extracted.gender !== undefined) updated.gender = extracted.gender;
  if (extracted.role !== undefined) updated.role = extracted.role;
  if (extracted.industry !== undefined) updated.industry = extracted.industry;
  if (extracted.teamSize !== undefined) updated.teamSize = extracted.teamSize;
  if (extracted.leadershipYears !== undefined) updated.leadershipYears = extracted.leadershipYears;

  // Merge goals (avoid duplicates)
  if (extracted.goals && extracted.goals.length > 0) {
    const existingGoals = currentProfile.goals || [];
    const newGoals = extracted.goals.filter(
      (goal: string) => !existingGoals.includes(goal)
    );
    if (newGoals.length > 0) {
      updated.goals = [...existingGoals, ...newGoals];
    }
  }

  return updated;
};

/**
 * Check if profile is complete enough for onboarding
 */
export const isProfileComplete = (profile: any): boolean => {
  // At minimum, we need role OR teamSize to consider profile complete
  return Boolean(profile.role || profile.teamSize);
};
