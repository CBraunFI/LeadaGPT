/**
 * Analyzes the language style of user messages
 * Provides hints to the AI for adapting its communication style
 */

interface LanguageStyleAnalysis {
  avgSentenceLength: number;
  complexity: 'einfach' | 'mittel' | 'komplex';
  formality: 'locker' | 'professionell' | 'akademisch';
  description: string;
}

/**
 * Analyze recent user messages to determine language style
 */
export const analyzeLanguageStyle = (userMessages: string[]): LanguageStyleAnalysis | null => {
  if (userMessages.length === 0) {
    return null;
  }

  // Take last 5 messages for analysis
  const recentMessages = userMessages.slice(-5);
  const allText = recentMessages.join(' ');

  // Calculate average sentence length
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = allText.split(/\s+/).filter(w => w.length > 0);
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

  // Determine complexity based on sentence length and word length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / (words.length || 1);

  let complexity: 'einfach' | 'mittel' | 'komplex';
  if (avgSentenceLength < 10 && avgWordLength < 5) {
    complexity = 'einfach';
  } else if (avgSentenceLength > 20 || avgWordLength > 7) {
    complexity = 'komplex';
  } else {
    complexity = 'mittel';
  }

  // Determine formality
  const hasAcademicTerms = /(?:konzeptuell|methodisch|systematisch|analytisch|evaluieren|implementieren|operationalisieren)/i.test(allText);
  const hasCasualTerms = /(?:okay|cool|super|genau|klar|hey|hallo)/i.test(allText);
  const hasFormalGreeting = /(?:sehr geehrte|mit freundlichen grüßen|hochachtungsvoll)/i.test(allText);

  let formality: 'locker' | 'professionell' | 'akademisch';
  if (hasAcademicTerms) {
    formality = 'akademisch';
  } else if (hasCasualTerms && !hasFormalGreeting) {
    formality = 'locker';
  } else {
    formality = 'professionell';
  }

  // Generate description
  const description = generateStyleDescription(complexity, formality, avgSentenceLength);

  return {
    avgSentenceLength,
    complexity,
    formality,
    description,
  };
};

function generateStyleDescription(
  complexity: string,
  formality: string,
  avgSentenceLength: number
): string {
  const parts: string[] = [];

  // Sentence length
  if (avgSentenceLength < 10) {
    parts.push('Nutzer verwendet kurze, prägnante Sätze');
  } else if (avgSentenceLength > 20) {
    parts.push('Nutzer verwendet lange, ausführliche Sätze');
  } else {
    parts.push('Nutzer verwendet mittellange Sätze');
  }

  // Complexity
  switch (complexity) {
    case 'einfach':
      parts.push('mit einfacher, direkter Sprache');
      break;
    case 'komplex':
      parts.push('mit komplexer, differenzierter Sprache');
      break;
    default:
      parts.push('mit ausgewogener Sprache');
  }

  // Formality
  switch (formality) {
    case 'locker':
      parts.push('Lockerer, informeller Ton bevorzugt.');
      break;
    case 'akademisch':
      parts.push('Akademischer, fachlicher Ton bevorzugt.');
      break;
    default:
      parts.push('Professioneller, ausgewogener Ton bevorzugt.');
  }

  return parts.join(' ');
}

/**
 * Simple helper to extract user messages from chat history
 */
export const extractUserMessages = (messages: Array<{ role: string; content: string }>): string[] => {
  return messages
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content);
};
