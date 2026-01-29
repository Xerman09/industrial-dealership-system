"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { AssetTableData } from "../../types";

export const columns: ColumnDef<AssetTableData>[] = [
  {
    id: "item_name",
    header: "Item Name",
    // Reaching into the nested item_id object from Directus
    accessorFn: (row) => row.item_id?.item_name || "N/A",
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    cell: ({ row }) => row.getValue("barcode") || "—",
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
    // Combining names from the nested employee object
    accessorFn: (row) => {
      const emp = row.employee;
      return emp ? `${emp.user_fname} ${emp.user_lname}` : "Unassigned";
    },
  },
];
