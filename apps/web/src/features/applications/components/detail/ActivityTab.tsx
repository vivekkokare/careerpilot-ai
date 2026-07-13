import {
  CheckCircle, FileText, MessageSquare, Star, Send, Users, Mail,
  Calendar, Bell, Tag, Trash, Edit, Link, Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Activity, ActivityType } from "@/types/api";
import type { ApplicationDetail } from "../../hooks/useApplication";

const ACTIVITY_META: Record<string, { icon: React.ElementType; cls: string }> = {
  EVALUATION_COMPLETED: { icon: CheckCircle, cls: "text-emerald-400 bg-emerald-400/10" },
  STATUS_CHANGED:       { icon: Zap,         cls: "text-amber-400 bg-amber-400/10"     },
  PDF_GENERATED:        { icon: FileText,    cls: "text-blue-400 bg-blue-400/10"       },
  DOCUMENT_GENERATED:   { icon: FileText,    cls: "text-blue-400 bg-blue-400/10"       },
  NOTE_ADDED:           { icon: MessageSquare, cls: "text-purple-400 bg-purple-400/10" },
  NOTE_UPDATED:         { icon: Edit,        cls: "text-purple-400 bg-purple-400/10"   },
  EMAIL_SENT:           { icon: Mail,        cls: "text-cyan-400 bg-cyan-400/10"       },
  OUTREACH_SENT:        { icon: Send,        cls: "text-sky-400 bg-sky-400/10"         },
  RECRUITER_ADDED:      { icon: Users,       cls: "text-indigo-400 bg-indigo-400/10"   },
  INTERVIEW_SCHEDULED:  { icon: Calendar,    cls: "text-rose-400 bg-rose-400/10"       },
  REMINDER_SET:         { icon: Bell,        cls: "text-yellow-400 bg-yellow-400/10"   },
  TAG_ADDED:            { icon: Tag,         cls: "text-teal-400 bg-teal-400/10"       },
  DISCARDED:            { icon: Trash,       cls: "text-red-400 bg-red-400/10"         },
  OFFER_RECEIVED:       { icon: Star,        cls: "text-amber-400 bg-amber-400/10"     },
};

function ActivityItem({ activity }: { activity: Activity }) {
  const meta = ACTIVITY_META[activity.type] ?? { icon: Link, cls: "text-muted-foreground bg-muted" };
  const Icon = meta.icon;

  return (
    <div className="flex gap-3">
      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", meta.cls)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0 pb-4">
        <p className="text-sm leading-snug">{activity.summary}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(activity.occurredAt), { addSuffix: true })}
          {activity.source && <span className="ml-1.5 opacity-60">· {activity.source}</span>}
        </p>
      </div>
    </div>
  );
}

export function ActivityTab({ data }: { data: ApplicationDetail }) {
  const sorted = [...data.activity].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground py-16">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-sm font-semibold mb-4">Activity timeline</h3>
      <div className="relative pl-3 border-l border-border/40 space-y-0">
        {sorted.map(a => <ActivityItem key={a.id} activity={a} />)}
      </div>
    </div>
  );
}
