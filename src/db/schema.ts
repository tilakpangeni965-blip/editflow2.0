import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  timestamp,
  numeric,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

// ----------------------------------------------------
// 1. PROFILES TABLE
// ----------------------------------------------------
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Firebase Auth UID / User ID
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  profileImage: text('profile_image'),
  role: text('role').default('teacher').notNull(), // 'teacher' | 'creator' | 'institute_admin'
  instituteName: text('institute_name').default('नेपाल शिक्षा मञ्च'),
  phone: text('phone'),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 2. SUBSCRIPTIONS TABLE
// ----------------------------------------------------
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  plan: text('plan').default('free').notNull(), // 'free' | 'teacher_pro' | 'institute_unlimited' | 'creator'
  status: text('status').default('PENDING').notNull(), // 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'
  billingCycle: text('billing_cycle').default('monthly').notNull(), // 'monthly' | 'annual'
  startDate: timestamp('start_date').defaultNow().notNull(),
  expiryDate: timestamp('expiry_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 3. PAYMENTS TABLE (Nepal Machhapuchchhre Bank, connectIPS, QR, eSewa, Khalti)
// ----------------------------------------------------
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  amountNpr: numeric('amount_npr', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // 'mbl_connectips' | 'mbl_qr' | 'esewa' | 'khalti' | 'bank_transfer'
  transactionReference: text('transaction_reference').notNull().unique(),
  bankUtrReference: text('bank_utr_reference'),
  bankName: text('bank_name'),
  bankAccountNumber: text('bank_account_number'),
  invoiceNumber: text('invoice_number').notNull(),
  paymentStatus: text('payment_status').default('PENDING_PAYMENT').notNull(), // 'PENDING_PAYMENT' | 'AWAITING_BANK_SETTLEMENT' | 'OTP_SENT' | 'VERIFIED' | 'FAILED'
  verificationDate: timestamp('verification_date'),
  payerName: text('payer_name'),
  payerPhone: text('payer_phone'),
  panNumber: text('pan_number'),
  instituteName: text('institute_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 4. OTP TABLE (Secure Hashed OTPs for Bank Settlement & Auth)
// ----------------------------------------------------
export const otps = pgTable('otps', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'cascade' }),
  hashedOtp: text('hashed_otp').notNull(), // SHA-256 hashed OTP
  purpose: text('purpose').default('payment_activation').notNull(), // 'payment_activation' | 'email_verification' | 'password_reset'
  expiryTime: timestamp('expiry_time').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 5. PROJECTS TABLE (Persistent Lecture Video Projects)
// ----------------------------------------------------
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  targetExam: text('target_exam').notNull(),
  mediaFileName: text('media_file_name').notNull(),
  mediaFileType: text('media_file_type').notNull(),
  mediaFileUrl: text('media_file_url').notNull(),
  mediaDuration: numeric('media_duration').notNull(),
  fileSizeBytes: numeric('file_size_bytes').notNull(),
  status: text('status').default('ready').notNull(),
  keepRanges: jsonb('keep_ranges').notNull(),
  crop: jsonb('crop').notNull(),
  style: jsonb('style').notNull(),
  audioSettings: jsonb('audio_settings').notNull(),
  detectedSilences: jsonb('detected_silences').notNull(),
  trimmedPauseSeconds: numeric('trimmed_pause_seconds').default('0').notNull(),
  normalizedGain: numeric('normalized_gain'),
  originalLoudnessDb: numeric('original_loudness_db'),
  normalizedLoudnessDb: numeric('normalized_loudness_db'),
  subtitles: jsonb('subtitles').notNull(),
  lessonPack: jsonb('lesson_pack').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 6. EDITING HISTORY TABLE
// ----------------------------------------------------
export const editingHistory = pgTable('editing_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  originalContent: text('original_content').notNull(),
  editedContent: text('edited_content').notNull(),
  instruction: text('instruction').notNull(),
  selectedMode: text('selected_mode').default('proofread').notNull(),
  strength: text('strength').default('medium').notNull(), // 'light' | 'medium' | 'strong'
  targetLanguage: text('target_language').default('original').notNull(),
  wordCountBefore: integer('word_count_before').default(0).notNull(),
  wordCountAfter: integer('word_count_after').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 7. AI USAGE LOGS TABLE
// ----------------------------------------------------
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  feature: text('feature').notNull(), // 'ai_editor' | 'exam_pack' | 'transcription_edit'
  tokensUsed: integer('tokens_used').default(0).notNull(),
  characterCount: integer('character_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// RELATIONSHIPS
// ----------------------------------------------------
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  subscriptions: many(subscriptions),
  payments: many(payments),
  otps: many(otps),
  projects: many(projects),
  editingHistory: many(editingHistory),
  aiUsageLogs: many(aiUsageLogs),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(profiles, {
    fields: [subscriptions.userId],
    references: [profiles.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(profiles, {
    fields: [payments.userId],
    references: [profiles.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  otps: many(otps),
}));

export const otpsRelations = relations(otps, ({ one }) => ({
  user: one(profiles, {
    fields: [otps.userId],
    references: [profiles.id],
  }),
  payment: one(payments, {
    fields: [otps.paymentId],
    references: [payments.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(profiles, {
    fields: [projects.userId],
    references: [profiles.id],
  }),
}));

export const editingHistoryRelations = relations(editingHistory, ({ one }) => ({
  user: one(profiles, {
    fields: [editingHistory.userId],
    references: [profiles.id],
  }),
}));

export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [aiUsageLogs.userId],
    references: [profiles.id],
  }),
}));

