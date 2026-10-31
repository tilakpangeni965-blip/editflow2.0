export type Language = 'ne' | 'en';

export type ThemeMode = 'light' | 'dark';

export type UserRole = 'creator' | 'teacher' | 'institute_admin' | 'tutor';

export type PlanType = 'free' | 'creator' | 'teacher_pro' | 'institute_unlimited';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  instituteName?: string;
  isEmailVerified: boolean;
  plan: PlanType;
  planExpiresAt?: string;
  phone?: string;
  availableMinutes?: number;
  createdAt: string;
}

export interface SubtitleCue {
  id: string;
  index: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  nepaliText: string;
  englishText: string;
}

export interface SilenceSegment {
  id?: string;
  start: number; // seconds
  end: number;   // seconds
  duration: number;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface KeepRange {
  id: string;
  startMs: number;
  endMs: number;
  label?: string;
}

export interface CropSetting {
  mode: 'manual' | 'center';
  aspectRatio: '9:16' | '16:9' | '1:1';
  centerX: number;
  centerY: number;
  zoom: number;
}

export interface CaptionStyle {
  preset: 'submagic_word' | 'captions_bold' | 'classic_box' | 'minimal';
  fontId: string;
  fontSize: number;
  textColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'bottom' | 'center' | 'top';
  animation: 'word_highlight' | 'karaoke' | 'fade' | 'none';
  uppercase: boolean;
}

export interface AudioProcessingSettings {
  pauseRemovalEnabled: boolean;
  minSilenceDuration: number; // e.g. 2.0s
  silenceThresholdDb: number; // e.g. -40dB
  soundNormalizationEnabled: boolean;
  targetLufs: number; // e.g. -14 LUFS
  gainAdjustmentDb: number;
}

export interface ModelQuestion {
  id: string;
  questionNumber: number;
  questionNepali: string;
  questionEnglish: string;
  marks: number;
  type: 'mcq' | 'short' | 'long';
  options?: {
    nepali: string[];
    english: string[];
    correctIndex: number;
  };
  modelAnswerNepali: string;
  modelAnswerEnglish: string;
  examTip: string;
}

export interface ExamLessonPack {
  targetExam: 'SEE' | 'NEB_11_12' | 'LOK_SEWA' | 'IOE_ENTRANCE' | 'CEE_MEDICAL' | 'GENERAL_ACADEMIC';
  subject: string;
  topicTitleNepali: string;
  topicTitleEnglish: string;
  summaryNepali: string;
  summaryEnglish: string;
  highYieldPointsNepali: string[];
  highYieldPointsEnglish: string[];
  keyFormulasOrDefinitions: Array<{
    termNepali: string;
    termEnglish: string;
    definitionNepali: string;
    definitionEnglish: string;
  }>;
  practiceQuestions: ModelQuestion[];
  flashcards: Array<{
    frontNepali: string;
    frontEnglish: string;
    backNepali: string;
    backEnglish: string;
  }>;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  subject: string;
  targetExam: 'SEE' | 'NEB_11_12' | 'LOK_SEWA' | 'IOE_ENTRANCE' | 'CEE_MEDICAL' | 'GENERAL_ACADEMIC';
  mediaFileName: string;
  mediaFileType: 'video' | 'audio';
  mediaFileUrl: string;
  mediaDuration: number; // in seconds
  fileSizeBytes: number;
  createdAt: string;
  updatedAt: string;
  status: 'uploaded' | 'processing' | 'processed' | 'ready';
  
  // Non-destructive Edit Spec (Blueprint)
  keepRanges: KeepRange[];
  crop: CropSetting;
  style: CaptionStyle;

  // Processing data
  audioSettings: AudioProcessingSettings;
  detectedSilences: SilenceSegment[];
  trimmedPauseSeconds: number;
  normalizedGain: number;
  originalLoudnessDb: number;
  normalizedLoudnessDb: number;
  
  // Subtitles
  subtitles: SubtitleCue[];
  
  // Exam Prep
  lessonPack: ExamLessonPack;
}

export type PaymentGateway = 'mbl_connectips' | 'mbl_qr' | 'esewa' | 'khalti' | 'bank_transfer';

export type PaymentStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_BANK_SETTLEMENT'
  | 'OTP_SENT'
  | 'VERIFIED'
  | 'FAILED';

export interface PaymentTransaction {
  id: string;
  userId: string;
  invoiceNumber: string;
  gateway: PaymentGateway;
  amountNpr: number;
  plan: PlanType;
  billingCycle: 'monthly' | 'annual';
  status: PaymentStatus;
  gatewayTransactionId: string;
  paymentToken?: string;
  verifiedAt?: string;
  payerName: string;
  payerPhone?: string;
  panNumber?: string;
  instituteName?: string;
  
  // Machhapuchchhre Bank & Bank Direct Settlement fields
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankSwiftCode?: string;
  bankUtrReference?: string;
  settlementOtp?: string;
  settlementConfirmedAt?: string;
  otpVerifiedAt?: string;
  
  createdAt: string;
}

export interface SignedDownloadToken {
  token: string;
  signature: string;
  expires: number; // Unix timestamp
  projectId: string;
  fileType: 'video' | 'audio' | 'srt_ne' | 'srt_en' | 'vtt' | 'lesson_pack_pdf' | 'notes_md';
  downloadUrl: string;
  expiresInMinutes: number;
}
