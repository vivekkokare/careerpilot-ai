import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useApplications } from "@/features/applications/hooks/useApplications";
import { useDeleteApplication } from "@/features/applications/hooks/useApplicationMutations";
import { ApplicationsTable }  from "@/features/applications/components/ApplicationsTable";
import { ApplicationToolbar } from "@/features/applications/components/ApplicationToolbar";
import { ApplicationFilters } from "@/features/applications/components/ApplicationFilters";
import { ApplicationForm }    from "@/features/applications/components/ApplicationForm";
import type { Application, ApplicationFilters as Filters } from "@/types/api";

const DEFAULT_FILTERS: Filters = { sort: "updatedAt", order: "desc", page: 1, pageSize: 25 };

function activeFilterCount(f: Filters): number {
  return (
    (f.status?.length    ? 1 : 0) +
    (f.archetype?.length ? 1 : 0) +
    (f.scoreMin != null  ? 1 : 0) +
    (f.scoreMax != null  ? 1 : 0) +
    (f.dateFrom          ? 1 : 0) +
    (f.dateTo            ? 1 : 0)
  );
}

export default function ApplicationsPage() {
  const [filters, setFilters]         = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formOpen, setFormOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState<Application | undefined>();

  const { data, isLoading } = useApplications(filters);
  const deleteMutation = useDeleteApplication();

  const handleSearchChange = useCallback((value: string) => {
    setFilters(f => ({ ...f, search: value || undefined, page: 1 }));
  }, []);

  const handleSortChange = useCallback((field: string, order: "asc" | "desc") => {
    setFilters(f => ({ ...f, sort: field, order, page: 1 }));
  }, []);

  const handleEdit = useCallback((app: Application) => {
    setEditTarget(app);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((app: Application) => {
    if (confirm(`Discard ${app.company?.name ?? ""} — ${app.role}? This cannot be undone.`)) {
      deleteMutation.mutate(app.id);
    }
  }, [deleteMutation]);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const fCount = activeFilterCount(filters);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-0">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold"
        >
          Applications
        </motion.h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col flex-1 min-h-0 mt-4 mx-6 mb-6 rounded-xl border border-border/50 bg-card overflow-hidden"
      >
        <ApplicationToolbar
          filters={filters}
          activeFilterCount={fCount}
          onSearchChange={handleSearchChange}
          onToggleFilters={() => setFiltersOpen(true)}
          onClearFilters={clearFilters}
          onNewApplication={() => { setEditTarget(undefined); setFormOpen(true); }}
          totalCount={data?.total ?? 0}
        />

        <div className="flex-1 overflow-auto">
          <ApplicationsTable
            data={data?.items ?? []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            sortField={filters.sort}
            sortOrder={filters.order as "asc" | "desc"}
            onSortChange={handleSortChange}
          />
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-sm">
            <span className="text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border border-border/50 disabled:opacity-40 hover:bg-muted/40 transition-colors"
                disabled={data.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 rounded border border-border/50 disabled:opacity-40 hover:bg-muted/40 transition-colors"
                disabled={data.page >= data.totalPages}
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <ApplicationFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={f => setFilters({ ...f, page: 1 })}
        onClear={clearFilters}
      />

      <ApplicationForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        editTarget={editTarget}
      />
    </div>
  );
}
