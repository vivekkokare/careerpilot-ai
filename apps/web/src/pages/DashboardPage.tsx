/**
 * Dashboard — full pipeline overview.
 *
 * Layout:
 *   Row 1  — 6 StatCards (total, applied, responses, interviews, offers, rejections)
 *   Row 2  — PipelineFunnel (left) + ScoreDistribution (right)
 *   Row 3  — ApplicationTimeline (full width)
 *   Row 4  — CountryBreakdown (left) + UpcomingReminders (right)
 *   Row 5  — ActivityFeed (full width)
 */
import { motion } from "framer-motion";
import {
  Briefcase,
  Send,
  MessageSquare,
  CalendarDays,
  PartyPopper,
  XCircle,
  TrendingUp,
  Plus,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/features/analytics/components/StatCard";
import { PipelineFunnel } from "@/features/analytics/components/PipelineFunnel";
import { ScoreDistribution } from "@/features/analytics/components/ScoreDistribution";
import { ApplicationTimeline } from "@/features/analytics/components/ApplicationTimeline";
import { CountryBreakdown } from "@/features/analytics/components/CountryBreakdown";
import { UpcomingReminders } from "@/features/analytics/components/UpcomingReminders";
import { ActivityFeed } from "@/features/analytics/components/ActivityFeed";
import { STATS } from "@/features/analytics/mockData";

// ── Stat card definitions ────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    label: "Total Evaluated",
    value: STATS.total,
    icon: Briefcase,
    iconColor: "text-blue-500",
    delta: { value: STATS.thisWeek, label: "this week" },
    delay: 0,
  },
  {
    label: "Applied",
    value: STATS.applied,
    icon: Send,
    iconColor: "text-violet-500",
    delta: null,
    delay: 60,
  },
  {
    label: "Responses",
    value: STATS.responded,
    icon: MessageSquare,
    iconColor: "text-cyan-500",
    delta: null,
    delay: 120,
  },
  {
    label: "Interviews",
    value: STATS.interview,
    icon: CalendarDays,
    iconColor: "text-amber-500",
    delta: null,
    delay: 180,
  },
  {
    label: "Offers",
    value: STATS.offer,
    icon: PartyPopper,
    iconColor: "text-emerald-500",
    delta: { value: STATS.conversionPct, label: "% conversion" },
    delay: 240,
  },
  {
    label: "Rejections",
    value: STATS.rejected,
    icon: XCircle,
    iconColor: "text-red-500",
    delta: null,
    delay: 300,
  },
] as const;

// ── Section animation variant ────────────────────────────────────────────────

const sectionFade = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y:  0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle={`${STATS.total.toLocaleString()} evaluations · ${STATS.applied} applied · avg score ${STATS.avgScore.toFixed(1)}/5`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Scan
            </Button>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Evaluate JD
            </Button>
          </div>
        }
      />

      {/* ── Row 1: Stat cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Row 2: Funnel + Score distribution ─────────────────────────────── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <PipelineFunnel />
        <ScoreDistribution />
      </motion.div>

      {/* ── Row 3: Timeline (full width) ───────────────────────────────────── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.45 }}
      >
        <ApplicationTimeline />
      </motion.div>

      {/* ── Row 4: Country breakdown + Upcoming ─────────────────────────────── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.55 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <CountryBreakdown />
        <UpcomingReminders />
      </motion.div>

      {/* ── Row 5: Activity feed ───────────────────────────────────────────── */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.65 }}
      >
        <ActivityFeed />
      </motion.div>
    </div>
  );
}
