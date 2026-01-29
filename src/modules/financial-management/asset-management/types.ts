import { z } from "zod";

export const assetFormSchema = z.object({
  item_name: z.string().min(1, "Required"),
  item_type: z.string().min(1, "Required"),
  item_classification: z.string().min(1, "Required"),
  barcode: z.string().optional(),
  rfid_code: z.string().optional(),
  condition: z.enum(["Good", "Bad", "Under Maintenance", "Discontinued"]),
  quantity: z.coerce.number().min(1),
  cost_per_item: z.coerce.number().min(0),
  life_span: z.coerce.number().min(1),
  date_acquired: z.date(),
  department: z.coerce.number(),
  employee: z.coerce.number().optional(),
  item_image: z.any().optional(),
});

export type AssetFormValues = z.infer<typeof assetFormSchema>;

export interface Department {
  department_id: number;
  department_description: string;
}

export interface User {
  user_id: number;
  user_fname: string;
  user_mname?: string; // Optional middle name
  user_lname: string;
}

// FIX: Add this interface for your Data Table
export interface AssetTableData {
  id: number;
  barcode: string | null;
  condition: "Good" | "Bad" | "Under Maintenance" | "Discontinued";
  quantity: number;
  cost_per_item: number;
  total: number;
  date_acquired: string;
  // These are objects because of the 'fields=*.*' query in route.ts
  item_id?: {
    item_name: string;
  };
  department?: Department;
  employee?: User;
}
