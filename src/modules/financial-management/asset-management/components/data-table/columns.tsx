"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { AssetTableData } from "../../types";

export const columns: ColumnDef<AssetTableData>[] = [
  {
    id: "item_name",
    header: "Item Name",
    accessorFn: (row) => {
      // Logic: If item_id is an object, get the name.
      // If it's just a number, return the number as a string for debugging.
      const item = row.item_id;
      if (typeof item === "object" && item !== null) {
        return item.item_name;
      }
      return item ? `ID: ${item}` : "N/A";
    },
    cell: ({ row }) => {
      const item = row.original.item_id;
      const isObject = typeof item === "object" && item !== null;

      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {isObject ? item.item_name : "N/A"}
          </span>
          {!isObject && item && (
            <span className="text-[10px] text-orange-500 font-mono">
              Link active (ID: {item}) - Check Permissions
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
      // Handle the case where employee might be a number (ID) instead of an object
      if (emp && typeof emp === "object") {
        return `${emp.user_fname} ${emp.user_lname}`;
      }
      return "Unassigned";
    },
  },
];
