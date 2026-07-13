import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationDetail as Detail } from "../../hooks/useApplication";
import { OverviewTab }     from "./OverviewTab";
import { ResumeTab }       from "./ResumeTab";
import { CoverLetterTab }  from "./CoverLetterTab";
import { InterviewTab }    from "./InterviewTab";
import { RecruiterTab }    from "./RecruiterTab";
import { NotesTab }        from "./NotesTab";
import { HistoryTab }      from "./HistoryTab";
import { ActivityTab }     from "./ActivityTab";

const TABS = [
  { id: "overview",     label: "Overview" },
  { id: "resume",       label: "Resume" },
  { id: "cover",        label: "Cover Letter" },
  { id: "interview",    label: "Interview" },
  { id: "recruiter",    label: "Recruiter" },
  { id: "notes",        label: "Notes" },
  { id: "history",      label: "History" },
  { id: "activity",     label: "Activity" },
] as const;

type TabId = typeof TABS[number]["id"];

interface ApplicationDetailProps {
  data:      Detail;
  isLoading: boolean;
}

export function ApplicationDetail({ data, isLoading }: ApplicationDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { application } = data;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50 space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{application.role}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {application.company?.name ?? "—"}
              <span className="mx-1.5">·</span>
              <span className="font-mono text-xs">#{String(application.num).padStart(3, "0")}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {application.score != null && (
              <ScoreDisplay score={application.score} variant="bar" />
            )}
            <StatusBadge status={application.status} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 overflow-x-auto scrollbar-none px-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === "overview"  && <OverviewTab data={data} />}
            {activeTab === "resume"    && <ResumeTab applicationId={application.id} />}
            {activeTab === "cover"     && <CoverLetterTab applicationId={application.id} />}
            {activeTab === "interview" && <InterviewTab data={data} />}
            {activeTab === "recruiter" && <RecruiterTab applicationId={application.id} />}
            {activeTab === "notes"     && <NotesTab data={data} />}
            {activeTab === "history"   && <HistoryTab data={data} />}
            {activeTab === "activity"  && <ActivityTab data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
