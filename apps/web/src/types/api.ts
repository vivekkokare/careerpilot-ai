/**
 * Shared domain types — mirrors the Prisma enums and key model shapes.
 * These are the "contract" between the API JSON responses and the UI.
 * All types use string literals to stay independent of the Prisma client.
 */

// ── Enums (string literals mirroring Prisma enums) ────────────────────────

export type ApplicationStatus =
  | "EVALUATED"
  | "APPLIED"
  | "RESPONDED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "DISCARDED"
  | "SKIP"
  | "HIRED";

export type RoleArchetype =
  | "AI_PLATFORM_LLMOPS"
  | "AGENTIC_AUTOMATION"
  | "TECHNICAL_AI_PM"
  | "AI_SOLUTIONS_ARCHITECT"
  | "DATA_AND_ANALYTICS"
  | "OTHER";

export type SpendTier = "ECONOMY" | "STANDARD" | "PREMIUM";

export type LegitimacyTier =
  | "HIGH_CONFIDENCE"
  | "PROCEED_WITH_CAUTION"
  | "SUSPICIOUS";

export type DocumentType =
  | "CV_HTML"
  | "CV_PDF"
  | "CV_LATEX"
  | "COVER_LETTER_HTML"
  | "COVER_LETTER_PDF"
  | "APPLICATION_EMAIL"
  | "OUTREACH_MESSAGE"
  | "OFFER_NOTES";

export type InterviewRoundType =
  | "PHONE_SCREEN"
  | "TECHNICAL"
  | "SYSTEM_DESIGN"
  | "BEHAVIORAL"
  | "HIRING_MANAGER"
  | "PANEL"
  | "TAKE_HOME"
  | "OFFER_CALL"
  | "OTHER";

export type InterviewOutcome =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "WITHDREW"
  | "NO_SHOW";

export type ContactType =
  | "RECRUITER"
  | "HIRING_MANAGER"
  | "PEER"
  | "INTERVIEWER"
  | "TALENT_PARTNER"
  | "AGENCY";

export type ActivityType =
  | "STATUS_CHANGED"
  | "NOTE_ADDED"
  | "NOTE_UPDATED"
  | "DOCUMENT_GENERATED"
  | "PDF_GENERATED"
  | "EMAIL_DRAFTED"
  | "EMAIL_SENT"
  | "OUTREACH_SENT"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "OFFER_RECEIVED"
  | "FOLLOW_UP_SENT"
  | "APPLICATION_SUBMITTED"
  | "SCAN_FOUND"
  | "EVALUATION_COMPLETED"
  | "SHEETS_SYNCED"
  | "REMINDER_FIRED"
  | "RECRUITER_ADDED"
  | "TAG_ADDED"
  | "DISCARDED"
  | "PLUGIN_HOOK";

export type ReminderStatus = "PENDING" | "FIRED" | "DISMISSED";

export type ClipStatus =
  | "PENDING"
  | "PROCESSING"
  | "DONE"
  | "FAILED"
  | "DUPLICATE";

export type QueueJobType =
  | "EVALUATE"
  | "PDF"
  | "SCAN"
  | "GMAIL_SYNC"
  | "SHEETS_SYNC";

export type QueueJobStatus =
  | "WAITING"
  | "ACTIVE"
  | "COMPLETED"
  | "FAILED"
  | "DELAYED";

// ── Domain models (subset of DB fields exposed by API) ───────────────────

export interface Company {
  id: string;
  slug: string;
  name: string;
  website?: string;
  atsProvider?: string;
  legitimacyTier?: LegitimacyTier;
  isBlacklisted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  num: number;
  role: string;
  status: ApplicationStatus;
  score?: number;
  pdfGenerated: boolean;
  reportPath?: string;
  via?: string;
  trackerNotes?: string;
  appliedAt?: string;
  archetypeA?: RoleArchetype;
  archetypeB?: RoleArchetype;
  legitimacyTier?: LegitimacyTier;
  advertisedCompMin?: number;
  advertisedCompMax?: number;
  advertisedCompCurrency?: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: string;
  applicationId: string;
  applicationNum: number;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  source?: string;
  note?: string;
  occurredAt: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  contentText?: string;
  reviewedByUser: boolean;
  reviewedAt?: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  companyName: string;
  role: string;
  prepReportPath?: string;
  redFlagRating?: number;
  rounds: InterviewRound[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewRound {
  id: string;
  roundNumber: number;
  type: InterviewRoundType;
  scheduledAt?: string;
  completedAt?: string;
  outcome: InterviewOutcome;
  interviewerName?: string;
  durationMins?: number;
  format?: string;
  storyBankSlugs?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  content: string;
  visibility: "PRIVATE" | "SHARED";
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  summary: string;
  detail?: Record<string, unknown>;
  source?: string;
  occurredAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  body?: string;
  dueAt: string;
  status: ReminderStatus;
  isFollowUp: boolean;
  followUpSequence?: number;
  applicationId?: string;
  createdAt: string;
}

export interface AiEvaluation {
  id: string;
  applicationId: string;
  modelName: string;
  spendTier: SpendTier;
  scoreMatch?: number;
  scoreNorthStar?: number;
  scoreComp?: number;
  scoreCultural?: number;
  scoreRedFlags?: number;
  scoreGlobal: number;
  legitimacyTier?: LegitimacyTier;
  reportPath?: string;
  jdUrl?: string;
  evaluatedAt: string;
}

export interface QueueJob {
  id: string;
  type: QueueJobType;
  status: QueueJobStatus;
  applicationId?: string;
  estimatedCostUsd?: number;
  enqueuedAt: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface UserSettings {
  id: string;
  fullName?: string;
  locationCity?: string;
  locationCountry?: string;
  primaryRoles: string[];
  spendTier: SpendTier;
  compTargetMin?: number;
  compTargetMax?: number;
  compCurrency?: string;
  outputLanguage?: string;
  cvOutputFormat?: string;
  autoPdfScoreThreshold?: number;
}

// ── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Filter / sort params ─────────────────────────────────────────────────────

export interface ApplicationFilters {
  status?:    ApplicationStatus[];
  archetype?: RoleArchetype[];
  scoreMin?:  number;
  scoreMax?:  number;
  companyId?: string;
  search?:    string;
  dateFrom?:  string;
  dateTo?:    string;
  page?:      number;
  pageSize?:  number;
  sort?:      string;
  order?:     string;
}
