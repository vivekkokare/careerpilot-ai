import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, MoreHorizontal, FileText, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn, formatScore, scoreColorClass, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Application } from "@/types/api";

interface ApplicationsTableProps {
  data:         Application[];
  isLoading:    boolean;
  onEdit:       (app: Application) => void;
  onDelete:     (app: Application) => void;
  sortField?:   string;
  sortOrder?:   "asc" | "desc";
  onSortChange: (field: string, order: "asc" | "desc") => void;
}

function SortIcon({ field, sortField, sortOrder }: { field: string; sortField?: string; sortOrder?: "asc" | "desc" }) {
  if (field !== sortField) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
  return sortOrder === "asc"
    ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />;
}

export function ApplicationsTable({
  data, isLoading, onEdit, onDelete, sortField, sortOrder, onSortChange,
}: ApplicationsTableProps) {
  const navigate = useNavigate();

  function handleSort(field: string) {
    if (field === sortField) {
      onSortChange(field, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "desc");
    }
  }

  const columns: ColumnDef<Application>[] = [
    {
      id: "num",
      header: () => (
        <button onClick={() => handleSort("num")} className="flex items-center font-medium text-xs uppercase tracking-wider">
          # <SortIcon field="num" sortField={sortField} sortOrder={sortOrder} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{String(row.original.num).padStart(3, "0")}
        </span>
      ),
      size: 64,
    },
    {
      id: "company",
      header: () => (
        <button onClick={() => handleSort("company")} className="flex items-center font-medium text-xs uppercase tracking-wider">
          Company <SortIcon field="company" sortField={sortField} sortOrder={sortOrder} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 shrink-0 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {(row.original.company?.name ?? "?").charAt(0)}
          </div>
          <span className="font-medium truncate">{row.original.company?.name ?? "—"}</span>
        </div>
      ),
    },
    {
      id: "role",
      header: () => (
        <button onClick={() => handleSort("role")} className="flex items-center font-medium text-xs uppercase tracking-wider">
          Role <SortIcon field="role" sortField={sortField} sortOrder={sortOrder} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm truncate max-w-[200px] block">{row.original.role}</span>
      ),
    },
    {
      id: "status",
      header: () => <span className="font-medium text-xs uppercase tracking-wider">Status</span>,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 110,
    },
    {
      id: "score",
      header: () => (
        <button onClick={() => handleSort("score")} className="flex items-center font-medium text-xs uppercase tracking-wider">
          Score <SortIcon field="score" sortField={sortField} sortOrder={sortOrder} />
        </button>
      ),
      cell: ({ row }) => (
        row.original.score != null
          ? <ScoreDisplay score={row.original.score} variant="compact" />
          : <span className="text-muted-foreground text-xs">—</span>
      ),
      size: 80,
    },
    {
      id: "comp",
      header: () => <span className="font-medium text-xs uppercase tracking-wider">Comp</span>,
      cell: ({ row }) => {
        const { advertisedCompMin, advertisedCompMax, advertisedCompCurrency } = row.original;
        if (!advertisedCompMin) return <span className="text-muted-foreground text-xs">—</span>;
        const min = formatCurrency(advertisedCompMin, advertisedCompCurrency ?? "USD");
        const max = advertisedCompMax ? formatCurrency(advertisedCompMax, advertisedCompCurrency ?? "USD") : null;
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {min}{max ? `–${max}` : ""}
          </span>
        );
      },
    },
    {
      id: "pdf",
      header: () => <span className="font-medium text-xs uppercase tracking-wider">PDF</span>,
      cell: ({ row }) => (
        <span className="text-base">{row.original.pdfGenerated ? "✅" : "❌"}</span>
      ),
      size: 52,
    },
    {
      id: "updatedAt",
      header: () => (
        <button onClick={() => handleSort("updatedAt")} className="flex items-center font-medium text-xs uppercase tracking-wider">
          Updated <SortIcon field="updatedAt" sortField={sortField} sortOrder={sortOrder} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.updatedAt), "MMM d")}
        </span>
      ),
      size: 72,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Row actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/applications/${row.original.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <FileText className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            {row.original.reportPath && (
              <DropdownMenuItem asChild>
                <a href={`/reports/${row.original.num}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open report
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Discard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 48,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No applications match your filters.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(hg => (
          <TableRow key={hg.id} className="hover:bg-transparent border-b border-border/50">
            {hg.headers.map(header => (
              <TableHead
                key={header.id}
                style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                className="py-2.5 first:pl-4 last:pr-4"
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow
            key={row.id}
            className="cursor-pointer group"
            onClick={() => navigate(`/applications/${row.original.id}`)}
          >
            {row.getVisibleCells().map(cell => (
              <TableCell
                key={cell.id}
                className="py-3 first:pl-4 last:pr-4"
                onClick={cell.column.id === "actions" ? e => e.stopPropagation() : undefined}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
