import { eq, and, desc } from 'drizzle-orm';
import { db } from './index.ts';
import { projects } from './schema.ts';
import { Project } from '../types/index.ts';

/**
 * List all projects belonging strictly to the requesting user
 */
export async function getProjectsByUser(userId: string): Promise<Project[]> {
  try {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      subject: r.subject,
      targetExam: r.targetExam as any,
      mediaFileName: r.mediaFileName,
      mediaFileType: r.mediaFileType as any,
      mediaFileUrl: r.mediaFileUrl,
      mediaDuration: Number(r.mediaDuration),
      fileSizeBytes: Number(r.fileSizeBytes),
      status: r.status as any,
      keepRanges: r.keepRanges as any,
      crop: r.crop as any,
      style: r.style as any,
      audioSettings: r.audioSettings as any,
      detectedSilences: r.detectedSilences as any,
      trimmedPauseSeconds: Number(r.trimmedPauseSeconds),
      normalizedGain: r.normalizedGain ? Number(r.normalizedGain) : 1.0,
      originalLoudnessDb: r.originalLoudnessDb ? Number(r.originalLoudnessDb) : -24.0,
      normalizedLoudnessDb: r.normalizedLoudnessDb ? Number(r.normalizedLoudnessDb) : -14.0,
      subtitles: r.subtitles as any,
      lessonPack: r.lessonPack as any,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error in getProjectsByUser:', error);
    return [];
  }
}

/**
 * Get single project with strict user-level isolation
 */
export async function getProjectByIdAndUser(projectId: string, userId: string): Promise<Project | null> {
  try {
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      userId: r.userId,
      title: r.title,
      subject: r.subject,
      targetExam: r.targetExam as any,
      mediaFileName: r.mediaFileName,
      mediaFileType: r.mediaFileType as any,
      mediaFileUrl: r.mediaFileUrl,
      mediaDuration: Number(r.mediaDuration),
      fileSizeBytes: Number(r.fileSizeBytes),
      status: r.status as any,
      keepRanges: r.keepRanges as any,
      crop: r.crop as any,
      style: r.style as any,
      audioSettings: r.audioSettings as any,
      detectedSilences: r.detectedSilences as any,
      trimmedPauseSeconds: Number(r.trimmedPauseSeconds),
      normalizedGain: r.normalizedGain ? Number(r.normalizedGain) : 1.0,
      originalLoudnessDb: r.originalLoudnessDb ? Number(r.originalLoudnessDb) : -24.0,
      normalizedLoudnessDb: r.normalizedLoudnessDb ? Number(r.normalizedLoudnessDb) : -14.0,
      subtitles: r.subtitles as any,
      lessonPack: r.lessonPack as any,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error in getProjectByIdAndUser:', error);
    return null;
  }
}

/**
 * Get project by ID for signed downloads verification
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      userId: r.userId,
      title: r.title,
      subject: r.subject,
      targetExam: r.targetExam as any,
      mediaFileName: r.mediaFileName,
      mediaFileType: r.mediaFileType as any,
      mediaFileUrl: r.mediaFileUrl,
      mediaDuration: Number(r.mediaDuration),
      fileSizeBytes: Number(r.fileSizeBytes),
      status: r.status as any,
      keepRanges: r.keepRanges as any,
      crop: r.crop as any,
      style: r.style as any,
      audioSettings: r.audioSettings as any,
      detectedSilences: r.detectedSilences as any,
      trimmedPauseSeconds: Number(r.trimmedPauseSeconds),
      normalizedGain: r.normalizedGain ? Number(r.normalizedGain) : 1.0,
      originalLoudnessDb: r.originalLoudnessDb ? Number(r.originalLoudnessDb) : -24.0,
      normalizedLoudnessDb: r.normalizedLoudnessDb ? Number(r.normalizedLoudnessDb) : -14.0,
      subtitles: r.subtitles as any,
      lessonPack: r.lessonPack as any,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return null;
  }
}

/**
 * Save or update project in PostgreSQL
 */
export async function createProjectInDb(proj: Project): Promise<Project> {
  try {
    const [row] = await db
      .insert(projects)
      .values({
        id: proj.id,
        userId: proj.userId,
        title: proj.title,
        subject: proj.subject,
        targetExam: proj.targetExam,
        mediaFileName: proj.mediaFileName,
        mediaFileType: proj.mediaFileType,
        mediaFileUrl: proj.mediaFileUrl,
        mediaDuration: proj.mediaDuration.toString(),
        fileSizeBytes: proj.fileSizeBytes.toString(),
        status: proj.status,
        keepRanges: proj.keepRanges,
        crop: proj.crop,
        style: proj.style,
        audioSettings: proj.audioSettings,
        detectedSilences: proj.detectedSilences,
        trimmedPauseSeconds: proj.trimmedPauseSeconds.toString(),
        normalizedGain: proj.normalizedGain?.toString() || null,
        originalLoudnessDb: proj.originalLoudnessDb?.toString() || null,
        normalizedLoudnessDb: proj.normalizedLoudnessDb?.toString() || null,
        subtitles: proj.subtitles,
        lessonPack: proj.lessonPack,
        createdAt: new Date(proj.createdAt),
        updatedAt: new Date(proj.updatedAt),
      })
      .returning();

    return proj;
  } catch (error) {
    console.error('Error inserting project into database:', error);
    throw new Error('Database insertion failed', { cause: error });
  }
}

/**
 * Update project fields in PostgreSQL
 */
export async function updateProjectInDb(
  projectId: string,
  userId: string,
  updates: Partial<Project>
): Promise<boolean> {
  try {
    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.title !== undefined) updateValues.title = updates.title;
    if (updates.subject !== undefined) updateValues.subject = updates.subject;
    if (updates.targetExam !== undefined) updateValues.targetExam = updates.targetExam;
    if (updates.status !== undefined) updateValues.status = updates.status;
    if (updates.keepRanges !== undefined) updateValues.keepRanges = updates.keepRanges;
    if (updates.crop !== undefined) updateValues.crop = updates.crop;
    if (updates.style !== undefined) updateValues.style = updates.style;
    if (updates.audioSettings !== undefined) updateValues.audioSettings = updates.audioSettings;
    if (updates.detectedSilences !== undefined) updateValues.detectedSilences = updates.detectedSilences;
    if (updates.trimmedPauseSeconds !== undefined) updateValues.trimmedPauseSeconds = updates.trimmedPauseSeconds.toString();
    if (updates.normalizedGain !== undefined) updateValues.normalizedGain = updates.normalizedGain.toString();
    if (updates.normalizedLoudnessDb !== undefined) updateValues.normalizedLoudnessDb = updates.normalizedLoudnessDb.toString();
    if (updates.subtitles !== undefined) updateValues.subtitles = updates.subtitles;
    if (updates.lessonPack !== undefined) updateValues.lessonPack = updates.lessonPack;

    const result = await db
      .update(projects)
      .set(updateValues)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to update project in DB:', error);
    return false;
  }
}

/**
 * Delete project with user isolation
 */
export async function deleteProjectFromDb(projectId: string, userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete project:', error);
    return false;
  }
}
