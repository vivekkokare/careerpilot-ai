/**
 * Mock dashboard data — realistic numbers for a 6-month AI/ML job search.
 * Replaced by real API calls when the TanStack Query hooks are wired up.
 * All values are deterministic (no Math.random) so Storybook / tests are stable.
 */

// ── Stat totals ───────────────────────────────────────────────────────────────

export const STATS = {
  total:       742,
  applied:     134,
  responded:    68,
  interview:    31,
  offer:         7,
  rejected:     89,
  discarded:   413,
  hired:         1,
  avgScore:    3.2,
  thisWeek:     18,    // new evaluations in last 7 days
  conversionPct: 5.2,  // offer / applied %
};

// ── Pipeline funnel (ordered by stage) ───────────────────────────────────────

export const FUNNEL_DATA = [
  { stage: "Evaluated",  count: 742, fill: "hsl(217 91% 60%)" },
  { stage: "Applied",    count: 134, fill: "hsl(258 90% 66%)" },
  { stage: "Responded",  count:  68, fill: "hsl(197 71% 52%)" },
  { stage: "Interview",  count:  31, fill: "hsl(38 92% 50%)"  },
  { stage: "Offer",      count:   7, fill: "hsl(142 71% 45%)" },
  { stage: "Hired",      count:   1, fill: "hsl(142 76% 36%)" },
];

// ── Score distribution (histogram buckets 0.5 wide) ──────────────────────────

export const SCORE_HISTOGRAM = [
  { bucket: "1.0–1.5", count:  12 },
  { bucket: "1.5–2.0", count:  38 },
  { bucket: "2.0–2.5", count:  91 },
  { bucket: "2.5–3.0", count: 187 },
  { bucket: "3.0–3.5", count: 203 },
  { bucket: "3.5–4.0", count: 142 },
  { bucket: "4.0–4.5", count:  52 },
  { bucket: "4.5–5.0", count:  17 },
];

// ── Applications over time (weekly, last 24 weeks) ────────────────────────────

export const TIMELINE_DATA = [
  { week: "Jan W1",  evaluated: 22, applied: 4  },
  { week: "Jan W2",  evaluated: 31, applied: 6  },
  { week: "Jan W3",  evaluated: 28, applied: 5  },
  { week: "Jan W4",  evaluated: 35, applied: 8  },
  { week: "Feb W1",  evaluated: 41, applied: 9  },
  { week: "Feb W2",  evaluated: 38, applied: 7  },
  { week: "Feb W3",  evaluated: 29, applied: 5  },
  { week: "Feb W4",  evaluated: 44, applied: 11 },
  { week: "Mar W1",  evaluated: 52, applied: 13 },
  { week: "Mar W2",  evaluated: 47, applied: 10 },
  { week: "Mar W3",  evaluated: 33, applied: 6  },
  { week: "Mar W4",  evaluated: 39, applied: 8  },
  { week: "Apr W1",  evaluated: 55, applied: 14 },
  { week: "Apr W2",  evaluated: 48, applied: 11 },
  { week: "Apr W3",  evaluated: 36, applied: 7  },
  { week: "Apr W4",  evaluated: 43, applied: 9  },
  { week: "May W1",  evaluated: 51, applied: 12 },
  { week: "May W2",  evaluated: 44, applied: 10 },
  { week: "May W3",  evaluated: 38, applied: 8  },
  { week: "May W4",  evaluated: 46, applied: 11 },
  { week: "Jun W1",  evaluated: 40, applied: 9  },
  { week: "Jun W2",  evaluated: 35, applied: 7  },
  { week: "Jun W3",  evaluated: 29, applied: 5  },
  { week: "Jun W4",  evaluated: 18, applied: 3  },
];

// ── Country breakdown ─────────────────────────────────────────────────────────

export const COUNTRY_DATA = [
  { country: "United States", count: 284, applied: 52, flag: "🇺🇸" },
  { country: "Germany",       count: 118, applied: 24, flag: "🇩🇪" },
  { country: "United Kingdom",count:  97, applied: 18, flag: "🇬🇧" },
  { country: "Netherlands",   count:  72, applied: 14, flag: "🇳🇱" },
  { country: "Canada",        count:  64, applied: 11, flag: "🇨🇦" },
  { country: "Switzerland",   count:  51, applied:  9, flag: "🇨🇭" },
  { country: "France",        count:  38, applied:  4, flag: "🇫🇷" },
  { country: "Remote / Global",count: 18, applied:  2, flag: "🌍" },
];

// ── Upcoming reminders ────────────────────────────────────────────────────────

export const UPCOMING_REMINDERS = [
  {
    id: "r1",
    title: "Follow up — Mistral AI",
    subtitle: "Applied 7 days ago · no response",
    dueAt: "2026-07-12T09:00:00Z",
    type: "follow_up" as const,
    urgent: true,
  },
  {
    id: "r2",
    title: "Interview prep — Cohere",
    subtitle: "Technical round on Jul 14",
    dueAt: "2026-07-13T10:00:00Z",
    type: "interview" as const,
    urgent: false,
  },
  {
    id: "r3",
    title: "Follow up — DeepMind",
    subtitle: "Applied 10 days ago · no response",
    dueAt: "2026-07-14T09:00:00Z",
    type: "follow_up" as const,
    urgent: false,
  },
  {
    id: "r4",
    title: "Offer deadline — Scale AI",
    subtitle: "Accept or decline by Jul 18",
    dueAt: "2026-07-18T17:00:00Z",
    type: "offer" as const,
    urgent: false,
  },
  {
    id: "r5",
    title: "Thank-you note — Hugging Face",
    subtitle: "After panel interview yesterday",
    dueAt: "2026-07-12T12:00:00Z",
    type: "interview" as const,
    urgent: true,
  },
];

// ── Recent activity ───────────────────────────────────────────────────────────

export const RECENT_ACTIVITY = [
  {
    id: "a1",
    type: "EVALUATION_COMPLETED" as const,
    company: "Anthropic",
    role: "Staff AI Engineer",
    summary: "Evaluated — score 4.4/5",
    score: 4.4,
    occurredAt: "2026-07-11T14:22:00Z",
    reportNum: 742,
  },
  {
    id: "a2",
    type: "STATUS_CHANGED" as const,
    company: "Scale AI",
    role: "Senior ML Engineer",
    summary: "Status changed → Offer",
    occurredAt: "2026-07-11T11:05:00Z",
    reportNum: 718,
  },
  {
    id: "a3",
    type: "INTERVIEW_SCHEDULED" as const,
    company: "Cohere",
    role: "ML Infrastructure Engineer",
    summary: "Technical interview scheduled · Jul 14",
    occurredAt: "2026-07-10T16:48:00Z",
    reportNum: 703,
  },
  {
    id: "a4",
    type: "DOCUMENT_GENERATED" as const,
    company: "Mistral AI",
    role: "Applied AI Engineer",
    summary: "CV PDF generated",
    occurredAt: "2026-07-10T09:31:00Z",
    reportNum: 698,
  },
  {
    id: "a5",
    type: "STATUS_CHANGED" as const,
    company: "Together AI",
    role: "Solutions Architect",
    summary: "Status changed → Rejected",
    occurredAt: "2026-07-09T17:15:00Z",
    reportNum: 681,
  },
  {
    id: "a6",
    type: "EVALUATION_COMPLETED" as const,
    company: "Hugging Face",
    role: "Developer Advocate — AI",
    summary: "Evaluated — score 3.8/5",
    score: 3.8,
    occurredAt: "2026-07-09T13:02:00Z",
    reportNum: 740,
  },
  {
    id: "a7",
    type: "APPLICATION_SUBMITTED" as const,
    company: "Weights & Biases",
    role: "Senior Product Engineer",
    summary: "Application submitted",
    occurredAt: "2026-07-08T15:44:00Z",
    reportNum: 724,
  },
  {
    id: "a8",
    type: "INTERVIEW_COMPLETED" as const,
    company: "Hugging Face",
    role: "Developer Advocate — AI",
    summary: "Panel interview completed",
    occurredAt: "2026-07-10T11:00:00Z",
    reportNum: 740,
  },
];

// ── Archetype breakdown ───────────────────────────────────────────────────────

export const ARCHETYPE_DATA = [
  { archetype: "AI Platform / LLMOps",   count: 241, color: "hsl(217 91% 60%)" },
  { archetype: "Agentic / Automation",    count: 198, color: "hsl(258 90% 66%)" },
  { archetype: "Technical AI PM",         count: 164, color: "hsl(197 71% 52%)" },
  { archetype: "AI Solutions Architect",  count: 139, color: "hsl(38 92% 50%)"  },
];
