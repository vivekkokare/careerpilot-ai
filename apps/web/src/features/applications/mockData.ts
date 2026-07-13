/**
 * Realistic mock data for 20 AI/ML job applications.
 * Replaced by API calls once TanStack Query hooks are wired up.
 */
import type {
  Application, Company, StatusHistory, Note,
  Activity, Reminder, AiEvaluation, Interview, InterviewRound,
} from "@/types/api";

// ── Companies ──────────────────────────────────────────────────────────────

export const MOCK_COMPANIES: Record<string, Company> = {
  anthropic:   { id: "c1",  slug: "anthropic",   name: "Anthropic",        website: "https://anthropic.com",        legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "greenhouse", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  openai:      { id: "c2",  slug: "openai",       name: "OpenAI",           website: "https://openai.com",           legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "greenhouse", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  mistral:     { id: "c3",  slug: "mistral-ai",   name: "Mistral AI",       website: "https://mistral.ai",           legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "lever",      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  cohere:      { id: "c4",  slug: "cohere",       name: "Cohere",           website: "https://cohere.com",           legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "greenhouse", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  scaleai:     { id: "c5",  slug: "scale-ai",     name: "Scale AI",         website: "https://scale.com",            legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "ashby",      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  huggingface: { id: "c6",  slug: "hugging-face", name: "Hugging Face",     website: "https://huggingface.co",       legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "lever",      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  wandb:       { id: "c7",  slug: "wandb",        name: "Weights & Biases", website: "https://wandb.ai",             legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "greenhouse", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  together:    { id: "c8",  slug: "together-ai",  name: "Together AI",      website: "https://together.ai",          legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "ashby",      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  deepmind:    { id: "c9",  slug: "deepmind",     name: "Google DeepMind",  website: "https://deepmind.google",      legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "greenhouse", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  nvidia:      { id: "c10", slug: "nvidia",       name: "NVIDIA",           website: "https://nvidia.com",           legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "workday",    createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  adept:       { id: "c11", slug: "adept-ai",     name: "Adept AI",         website: "https://adept.ai",             legitimacyTier: "PROCEED_WITH_CAUTION", isBlacklisted: false, atsProvider: "lever",     createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  mosaic:      { id: "c12", slug: "mosaicml",     name: "MosaicML",         website: "https://mosaicml.com",         legitimacyTier: "HIGH_CONFIDENCE",     isBlacklisted: false, atsProvider: "greenhouse", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
};

// ── Full application list ──────────────────────────────────────────────────

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app1", num: 742, role: "Staff AI Engineer",
    status: "EVALUATED", score: 4.4, pdfGenerated: true,
    reportPath: "reports/742-anthropic-2026-07-11.md",
    archetypeA: "AI_PLATFORM_LLMOPS", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 25000000, advertisedCompMax: 35000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["anthropic"], trackerNotes: "Dream role — apply ASAP",
    createdAt: "2026-07-11T14:22:00Z", updatedAt: "2026-07-11T14:22:00Z",
  },
  {
    id: "app2", num: 718, role: "Senior ML Engineer",
    status: "OFFER", score: 4.1, pdfGenerated: true,
    reportPath: "reports/718-scale-ai-2026-07-01.md",
    archetypeA: "AI_PLATFORM_LLMOPS", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 22000000, advertisedCompMax: 28000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["scaleai"], trackerNotes: "Offer received — deadline Jul 18",
    appliedAt: "2026-06-25T09:00:00Z",
    createdAt: "2026-07-01T10:00:00Z", updatedAt: "2026-07-11T11:05:00Z",
  },
  {
    id: "app3", num: 703, role: "ML Infrastructure Engineer",
    status: "INTERVIEW", score: 3.9, pdfGenerated: true,
    reportPath: "reports/703-cohere-2026-06-28.md",
    archetypeA: "AI_PLATFORM_LLMOPS", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 18000000, advertisedCompMax: 24000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["cohere"], trackerNotes: "Technical round Jul 14",
    appliedAt: "2026-06-20T10:00:00Z",
    createdAt: "2026-06-28T09:00:00Z", updatedAt: "2026-07-10T16:48:00Z",
  },
  {
    id: "app4", num: 740, role: "Developer Advocate — AI",
    status: "RESPONDED", score: 3.8, pdfGenerated: true,
    reportPath: "reports/740-huggingface-2026-07-09.md",
    archetypeA: "AI_SOLUTIONS_ARCHITECT", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 16000000, advertisedCompMax: 20000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["huggingface"], trackerNotes: "Panel interview done Jul 10",
    appliedAt: "2026-06-30T11:00:00Z",
    createdAt: "2026-07-09T13:02:00Z", updatedAt: "2026-07-10T11:00:00Z",
  },
  {
    id: "app5", num: 698, role: "Applied AI Engineer",
    status: "APPLIED", score: 3.7, pdfGenerated: true,
    reportPath: "reports/698-mistral-2026-07-10.md",
    archetypeA: "AGENTIC_AUTOMATION", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 17000000, advertisedCompMax: 22000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["mistral"], trackerNotes: "Follow up due Jul 12",
    appliedAt: "2026-07-04T14:00:00Z",
    createdAt: "2026-07-10T09:31:00Z", updatedAt: "2026-07-10T09:31:00Z",
  },
  {
    id: "app6", num: 724, role: "Senior Product Engineer",
    status: "APPLIED", score: 3.5, pdfGenerated: false,
    reportPath: "reports/724-wandb-2026-07-07.md",
    archetypeA: "TECHNICAL_AI_PM", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 19000000, advertisedCompMax: 25000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["wandb"], trackerNotes: "",
    appliedAt: "2026-07-08T15:44:00Z",
    createdAt: "2026-07-07T11:00:00Z", updatedAt: "2026-07-08T15:44:00Z",
  },
  {
    id: "app7", num: 681, role: "AI Solutions Architect",
    status: "REJECTED", score: 3.3, pdfGenerated: true,
    reportPath: "reports/681-together-ai-2026-06-25.md",
    archetypeA: "AI_SOLUTIONS_ARCHITECT", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 15000000, advertisedCompMax: 20000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["together"], trackerNotes: "Not a fit — too ops-heavy",
    appliedAt: "2026-06-15T09:00:00Z",
    createdAt: "2026-06-25T10:00:00Z", updatedAt: "2026-07-09T17:15:00Z",
  },
  {
    id: "app8", num: 655, role: "Research Engineer — LLM",
    status: "INTERVIEW", score: 4.2, pdfGenerated: true,
    reportPath: "reports/655-deepmind-2026-06-18.md",
    archetypeA: "AI_PLATFORM_LLMOPS", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 24000000, advertisedCompMax: 32000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["deepmind"], trackerNotes: "Final round pending",
    appliedAt: "2026-06-05T10:00:00Z",
    createdAt: "2026-06-18T14:00:00Z", updatedAt: "2026-07-05T10:00:00Z",
  },
  {
    id: "app9", num: 630, role: "AI Platform Engineer",
    status: "RESPONDED", score: 3.6, pdfGenerated: true,
    reportPath: "reports/630-openai-2026-06-10.md",
    archetypeA: "AI_PLATFORM_LLMOPS", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 25000000, advertisedCompMax: 35000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["openai"], trackerNotes: "Recruiter reached out Jun 20",
    appliedAt: "2026-05-28T09:00:00Z",
    createdAt: "2026-06-10T11:00:00Z", updatedAt: "2026-06-20T14:00:00Z",
  },
  {
    id: "app10", num: 600, role: "Senior AI/ML Engineer",
    status: "DISCARDED", score: 2.8, pdfGenerated: false,
    reportPath: "reports/600-nvidia-2026-06-01.md",
    archetypeA: "AI_PLATFORM_LLMOPS", legitimacyTier: "HIGH_CONFIDENCE",
    advertisedCompMin: 20000000, advertisedCompMax: 28000000, advertisedCompCurrency: "USD",
    company: MOCK_COMPANIES["nvidia"], trackerNotes: "Too hardware-focused",
    createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-02T09:00:00Z",
  },
];

// ── Detail data for app1 (Anthropic #742) ─────────────────────────────────

export const MOCK_STATUS_HISTORY: StatusHistory[] = [
  { id: "sh1", applicationId: "app1", applicationNum: 742, fromStatus: undefined, toStatus: "EVALUATED", source: "auto-pipeline", note: "Initial evaluation",           occurredAt: "2026-07-11T14:22:00Z" },
];

export const MOCK_NOTES: Note[] = [
  {
    id: "n1",
    content: `## Interview Prep Notes

### Key talking points
- **Constitutional AI** — Anthropic's core alignment approach. Be ready to discuss tradeoffs vs RLHF.
- **Infrastructure scale** — mention experience with multi-GPU training pipelines.
- **Culture fit** — they value safety-first thinking. Lead with that.

### Questions to ask
1. What does the on-call rotation look like for platform engineers?
2. How is the eval infrastructure evolving as models get larger?
3. What's the biggest unsolved problem on the platform team right now?

### Red flags to watch
- Visa sponsorship status (confirmed: available for exceptional candidates)
- Compensation ceiling — Levels.fyi shows $290-350K TC, target top of range.`,
    visibility: "PRIVATE",
    createdAt: "2026-07-11T15:00:00Z",
    updatedAt: "2026-07-11T15:00:00Z",
  },
  {
    id: "n2",
    content: `## Recruiter Call Notes — Jul 11

Spoke with **Sarah Chen** (Talent Partner) for 20 minutes.

- Role is on the **Infra Platform team** reporting to VP Engineering
- 4 open headcount — filling fast, target close Aug 1
- Hybrid: 3 days SF office expected
- Levelling: starts at L5, L6 possible depending on experience

Next step: technical screen with hiring manager within 2 weeks.`,
    visibility: "PRIVATE",
    createdAt: "2026-07-11T16:30:00Z",
    updatedAt: "2026-07-11T16:30:00Z",
  },
];

export const MOCK_ACTIVITY: Activity[] = [
  { id: "ac1", type: "EVALUATION_COMPLETED",  summary: "Evaluated — score 4.4/5",                                             source: "auto-pipeline",  occurredAt: "2026-07-11T14:22:00Z" },
  { id: "ac2", type: "NOTE_ADDED",            summary: "Note added: Interview Prep Notes",                                    source: "web-ui",         occurredAt: "2026-07-11T15:00:00Z" },
  { id: "ac3", type: "NOTE_ADDED",            summary: "Note added: Recruiter Call Notes",                                    source: "web-ui",         occurredAt: "2026-07-11T16:30:00Z" },
  { id: "ac4", type: "DOCUMENT_GENERATED",    summary: "CV PDF generated — v1 tailored",                                     source: "web-ui",         occurredAt: "2026-07-11T17:00:00Z" },
];

export const MOCK_EVALUATION: AiEvaluation = {
  id: "eval1", applicationId: "app1",
  modelName: "claude-sonnet-4-6", spendTier: "STANDARD",
  scoreMatch: 4.5, scoreNorthStar: 4.3, scoreComp: 3.9,
  scoreCultural: 4.6, scoreRedFlags: 0.2, scoreGlobal: 4.4,
  legitimacyTier: "HIGH_CONFIDENCE",
  jdUrl: "https://boards.greenhouse.io/anthropic/jobs/4085012008",
  evaluatedAt: "2026-07-11T14:22:00Z",
};

export const MOCK_INTERVIEW: Interview = {
  id: "iv1", applicationId: "app1",
  companyName: "Anthropic", role: "Staff AI Engineer",
  redFlagRating: 2,
  rounds: [
    {
      id: "ir1", roundNumber: 1,
      type: "PHONE_SCREEN", outcome: "PENDING",
      scheduledAt: "2026-07-18T14:00:00Z",
      interviewerName: "Sarah Chen", durationMins: 30, format: "video",
      storyBankSlugs: [],
      notes: "Intro call with talent partner. Cover motivation + experience overview.",
      createdAt: "2026-07-11T17:00:00Z", updatedAt: "2026-07-11T17:00:00Z",
    },
  ],
  createdAt: "2026-07-11T17:00:00Z", updatedAt: "2026-07-11T17:00:00Z",
};

export const MOCK_REMINDERS: Reminder[] = [
  {
    id: "rem1", applicationId: "app1",
    title: "Prepare for Anthropic phone screen",
    body: "Review Constitutional AI papers. Prepare STAR stories for scale and reliability.",
    dueAt: "2026-07-17T09:00:00Z",
    status: "PENDING", isFollowUp: false,
    createdAt: "2026-07-11T17:00:00Z",
  },
];
