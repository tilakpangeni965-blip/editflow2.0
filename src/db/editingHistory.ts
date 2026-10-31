import { eq, and, desc, count, gte } from 'drizzle-orm';
import { db } from './index.ts';
import { editingHistory, aiUsageLogs } from './schema.ts';
import { getUserSubscription } from './users.ts';

export interface EditingHistoryItem {
  id: number;
  userId: string;
  title: string;
  originalContent: string;
  editedContent: string;
  instruction: string;
  selectedMode: string;
  strength: string;
  targetLanguage: string;
  wordCountBefore: number;
  wordCountAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

// Plan limits for AI Editing & Transformation engine
export const PLAN_AI_LIMITS: Record<string, number> = {
  free: 10, // 10 AI edits on free tier for teachers to trial
  creator: 250,
  teacher_pro: 500,
  institute_unlimited: 10000,
};

/**
 * Create a new editing history record in PostgreSQL
 */
export async function createEditingHistoryItem(data: {
  userId: string;
  title: string;
  originalContent: string;
  editedContent: string;
  instruction: string;
  selectedMode?: string;
  strength?: string;
  targetLanguage?: string;
  wordCountBefore?: number;
  wordCountAfter?: number;
}): Promise<EditingHistoryItem> {
  const [record] = await db
    .insert(editingHistory)
    .values({
      userId: data.userId,
      title: data.title || 'शीर्षक विहीन सम्पादन',
      originalContent: data.originalContent,
      editedContent: data.editedContent,
      instruction: data.instruction || 'व्याकरण सुधार तथा स्पष्टता',
      selectedMode: data.selectedMode || 'proofread',
      strength: data.strength || 'medium',
      targetLanguage: data.targetLanguage || 'original',
      wordCountBefore: data.wordCountBefore || 0,
      wordCountAfter: data.wordCountAfter || 0,
    })
    .returning();

  return record;
}

/**
 * Retrieve all editing history items for a specific user
 * Enforces Row Level User Isolation
 */
export async function getUserEditingHistory(userId: string): Promise<EditingHistoryItem[]> {
  return await db
    .select()
    .from(editingHistory)
    .where(eq(editingHistory.userId, userId))
    .orderBy(desc(editingHistory.createdAt));
}

/**
 * Retrieve a specific editing session, ensuring it belongs to the authenticated user
 */
export async function getEditingHistoryItemByIdAndUser(
  id: number,
  userId: string
): Promise<EditingHistoryItem | null> {
  const [record] = await db
    .select()
    .from(editingHistory)
    .where(and(eq(editingHistory.id, id), eq(editingHistory.userId, userId)))
    .limit(1);

  return record || null;
}

/**
 * Update an existing editing session
 */
export async function updateEditingHistoryItem(
  id: number,
  userId: string,
  updates: {
    title?: string;
    originalContent?: string;
    editedContent?: string;
    instruction?: string;
    selectedMode?: string;
    strength?: string;
    targetLanguage?: string;
    wordCountBefore?: number;
    wordCountAfter?: number;
  }
): Promise<EditingHistoryItem | null> {
  const [updated] = await db
    .update(editingHistory)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(editingHistory.id, id), eq(editingHistory.userId, userId)))
    .returning();

  return updated || null;
}

/**
 * Delete an editing session belonging to the user
 */
export async function deleteEditingHistoryItem(id: number, userId: string): Promise<boolean> {
  const result = await db
    .delete(editingHistory)
    .where(and(eq(editingHistory.id, id), eq(editingHistory.userId, userId)))
    .returning();

  return result.length > 0;
}

/**
 * Check AI usage against the user's active subscription plan
 * and record the usage event in PostgreSQL
 */
export async function checkAndRecordAiUsage(
  userId: string,
  feature: string = 'ai_editor',
  characterCount: number = 0,
  tokensEstimated: number = 0
): Promise<{
  allowed: boolean;
  plan: string;
  limit: number;
  totalUsed: number;
  remaining: number;
  reason?: string;
}> {
  const sub = await getUserSubscription(userId);
  const plan = sub?.status === 'ACTIVE' ? sub.plan : 'free';
  const limit = PLAN_AI_LIMITS[plan] ?? 10;

  // Count usage in the current calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageCountResult = await db
    .select({ total: count() })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, startOfMonth)));

  const currentUsage = Number(usageCountResult[0]?.total || 0);

  if (currentUsage >= limit) {
    return {
      allowed: false,
      plan,
      limit,
      totalUsed: currentUsage,
      remaining: 0,
      reason:
        plan === 'free'
          ? 'तपाईंको नि:शुल्क १० वटा AI सम्पादन कोटा समाप्त भयो। असीमित प्रयोगका लागि शिक्षक प्रो वा इन्स्टिच्युट योजना लिनुहोस्।'
          : `तपाईंको मासिक ${limit} वटा AI अनुरोध कोटा समाप्त भयो।`,
    };
  }

  // Record usage
  await db.insert(aiUsageLogs).values({
    userId,
    feature,
    characterCount,
    tokensUsed: tokensEstimated,
  });

  return {
    allowed: true,
    plan,
    limit,
    totalUsed: currentUsage + 1,
    remaining: Math.max(0, limit - (currentUsage + 1)),
  };
}

/**
 * Get AI usage summary for dashboard display
 */
export async function getAiUsageSummary(userId: string) {
  const sub = await getUserSubscription(userId);
  const plan = sub?.status === 'ACTIVE' ? sub.plan : 'free';
  const limit = PLAN_AI_LIMITS[plan] ?? 10;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageCountResult = await db
    .select({ total: count() })
    .from(aiUsageLogs)
    .where(and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, startOfMonth)));

  const currentUsage = Number(usageCountResult[0]?.total || 0);

  return {
    plan,
    isSubscribed: sub?.status === 'ACTIVE' && sub.plan !== 'free',
    limit,
    totalUsed: currentUsage,
    remaining: Math.max(0, limit - currentUsage),
  };
}
