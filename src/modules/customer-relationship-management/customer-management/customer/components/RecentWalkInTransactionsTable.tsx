"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WalkInTransaction } from "../types";
import { RefreshCw } from "lucide-react";

interface RecentWalkInTransactionsTableProps {
  items: WalkInTransaction[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: number | null): string {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function typeBadgeClasses(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("exchange")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (normalized.includes("deposit") || normalized.includes("new account")) {
    return "bg-purple-100 text-purple-700 border-purple-200";
  }
  return "bg-muted text-muted-foreground border-border";
}

export function RecentWalkInTransactionsTable({
  items,
  isLoading,
  error,
  onRetry,
}: RecentWalkInTransactionsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Recent Walk-in Transactions</h3>
          <p className="text-sm text-muted-foreground">
            Latest walk-in activity including refills and new deposits.
          </p>
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="h-9">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        ) : null}
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 border-b">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-4 text-xs font-semibold">
                Date / Txn ID
              </TableHead>
              <TableHead className="h-10 px-4 text-xs font-semibold">
                Customer
              </TableHead>
              <TableHead className="h-10 px-4 text-xs font-semibold">
                Items
              </TableHead>
              <TableHead className="h-10 px-4 text-xs font-semibold">
                Type
              </TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-semibold">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-sm text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No recent walk-in transactions found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.order_id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">
                        {formatDate(item.date)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.order_no || `TXN-${item.order_id}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-xs font-semibold text-primary">
                      {item.customer_name}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-xs text-muted-foreground italic">
                      {item.items_label}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold px-2 py-0.5 ${typeBadgeClasses(item.type_label || "Walk-in")}`}
                    >
                      {(item.type_label || "Walk-in").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-xs font-semibold">
                    {formatAmount(item.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
