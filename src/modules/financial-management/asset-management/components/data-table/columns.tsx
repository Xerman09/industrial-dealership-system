"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { AssetTableData } from "../../types";

export const columns: ColumnDef<AssetTableData>[] = [
  {
    accessorKey: "item_name", // Directly use the key from your merged API response
    header: "Item Name",
    cell: ({ row }) => {
      const name = row.original.item_name;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{name || "N/A"}</span>
          {!name && (
            <span className="text-[10px] text-orange-500 font-mono">
              Missing Item Link
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ row }) => row.getValue("barcode") || "—",
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => row.getValue("department") || "—",
  },
  {
    accessorKey: "condition",
    header: "Condition",
    cell: ({ row }) => {
      const condition = row.getValue("condition") as string;
      const variants: Record<
        string,
        "default" | "destructive" | "outline" | "secondary"
      > = {
        Good: "default",
        Bad: "destructive",
        "Under Maintenance": "secondary",
        Discontinued: "outline",
      };
      return (
        <Badge variant={variants[condition] || "outline"}>{condition}</Badge>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    id: "assigned_to",
    header: "Assigned To",
    accessorFn: (row) => {
      const emp = row.employee;
      if (emp && typeof emp === "object") {
        return `${emp.user_fname} ${emp.user_lname}`;
      }
      return "Unassigned";
    },
  },
];
