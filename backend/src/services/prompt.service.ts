import prisma from '../config/database';
import { getLeadaSystemPrompt } from '../config/system-prompt';

/**
 * Prompt Hierarchy Service
 *
 * Implements 3-level prompt hierarchy:
 * - Level 1: System Prompt (hard constraints, cannot be overridden)
 * - Level 2: Corporate Prompt (company-level specialization)
 * - Level 3: Individual Prompt (user-level specialization)
 *
 * Each level can add context and specialize, but cannot override higher-level constraints.
 */

interface PromptHierarchy {
  systemPrompt: string;
  corporatePrompt?: string;
  individualPrompt?: string;
  combinedPrompt: string;
}

/**
 * Get the complete prompt hierarchy for a user
 *
 * @param userId - User ID
 * @param userLanguage - User's preferred language (for system prompt)
 * @returns Complete prompt hierarchy with combined final prompt
 */
export async function getUserPromptHierarchy(
  userId: string,
  userLanguage: string = 'Deutsch'
): Promise<PromptHierarchy> {
  // Level 1: System Prompt (always present, defines hard constraints)
  const systemPrompt = getLeadaSystemPrompt(userLanguage);

  // Get user with profile and company
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      company: true,
    },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Level 2: Corporate Prompt (if user belongs to a company with corporate prompt)
  const corporatePrompt = user.company?.corporatePrompt || undefined;

  // Level 3: Individual Prompt (if user has set individual preferences)
  const individualPrompt = user.profile?.individualPrompt || undefined;

  // Combine prompts hierarchically
  const combinedPrompt = buildCombinedPrompt({
    systemPrompt,
    corporatePrompt,
    individualPrompt,
  });

  return {
    systemPrompt,
    corporatePrompt,
    individualPrompt,
    combinedPrompt,
  };
}

/**
 * Build combined prompt from hierarchy
 *
 * Structure:
 * 1. System Prompt (baseline + hard constraints)
 * 2. Corporate Context (if available)
 * 3. Individual Context (if available)
 *
 * @param hierarchy - Prompt components
 * @returns Combined prompt string
 */
function buildCombinedPrompt(hierarchy: {
  systemPrompt: string;
  corporatePrompt?: string;
  individualPrompt?: string;
}): string {
  let combined = hierarchy.systemPrompt;

  // Add corporate prompt as additional context
  if (hierarchy.corporatePrompt) {
    combined += `\n\n---\n\n## UNTERNEHMENSKONTEXT\n\n`;
    combined += `**WICHTIG**: Die folgenden unternehmensweiten Richtlinien ergänzen die obigen System-Prinzipien. Sie können spezialisieren und Kontext hinzufügen, aber NICHT die System-Constraints überschreiben (z.B. Wortlimit, Spracheinstellung, No-Emoji-Regel).\n\n`;
    combined += hierarchy.corporatePrompt;
  }

  // Add individual prompt as additional context
  if (hierarchy.individualPrompt) {
    combined += `\n\n---\n\n## INDIVIDUELLE PRÄFERENZEN\n\n`;
    combined += `**WICHTIG**: Die folgenden individuellen Präferenzen ergänzen die System- und Unternehmens-Richtlinien. Sie können weiter spezialisieren, aber NICHT die übergeordneten Constraints überschreiben.\n\n`;
    combined += hierarchy.individualPrompt;
  }

  return combined;
}

/**
 * Get company documents that should be included in AI context
 *
 * This retrieves all company-wide documents for the user's company.
 * These documents should be considered by the AI when responding to the user.
 *
 * @param userId - User ID
 * @returns Array of company documents with extracted text
 */
export async function getCompanyDocumentsContext(userId: string): Promise<
  Array<{
    filename: string;
    fileType: string;
    extractedText: string;
    uploadedAt: Date;
  }>
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user || !user.companyId) {
    return []; // No company documents if user has no company
  }

  const documents = await prisma.document.findMany({
    where: {
      companyId: user.companyId,
      category: 'company',
      extractedText: {
        not: null,
      },
    },
    select: {
      filename: true,
      fileType: true,
      extractedText: true,
      uploadedAt: true,
    },
    orderBy: {
      uploadedAt: 'desc',
    },
  });

  return documents.map((doc) => ({
    filename: doc.filename,
    fileType: doc.fileType,
    extractedText: doc.extractedText || '',
    uploadedAt: doc.uploadedAt,
  }));
}

/**
 * Build complete AI context including prompts and documents
 *
 * This is the main function to use when preparing context for AI chat.
 *
 * @param userId - User ID
 * @param userLanguage - User's preferred language
 * @returns Complete context with system prompt and company documents
 */
export async function buildAIContext(
  userId: string,
  userLanguage: string = 'Deutsch'
): Promise<{
  systemPrompt: string;
  companyDocuments: Array<{
    filename: string;
    fileType: string;
    extractedText: string;
  }>;
}> {
  // Get prompt hierarchy
  const promptHierarchy = await getUserPromptHierarchy(userId, userLanguage);

  // Get company documents
  const companyDocuments = await getCompanyDocumentsContext(userId);

  return {
    systemPrompt: promptHierarchy.combinedPrompt,
    companyDocuments: companyDocuments.map((doc) => ({
      filename: doc.filename,
      fileType: doc.fileType,
      extractedText: doc.extractedText,
    })),
  };
}

/**
 * Update corporate prompt for a company
 *
 * @param companyId - Company ID
 * @param corporatePrompt - New corporate prompt (or null to remove)
 */
export async function updateCorporatePrompt(
  companyId: string,
  corporatePrompt: string | null
): Promise<void> {
  await prisma.company.update({
    where: { id: companyId },
    data: { corporatePrompt },
  });
}

/**
 * Update individual prompt for a user
 *
 * @param userId - User ID
 * @param individualPrompt - New individual prompt (or null to remove)
 */
export async function updateIndividualPrompt(
  userId: string,
  individualPrompt: string | null
): Promise<void> {
  await prisma.userProfile.update({
    where: { userId },
    data: { individualPrompt },
  });
}
