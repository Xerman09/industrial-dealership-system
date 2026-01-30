"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddAssetModalProps {
  onSuccess: () => void;
}

export default function AddAssetModal({ onSuccess }: AddAssetModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      item_name: "",
      barcode: "",
      rfid_code: "",
      condition: "Good",
      cost_per_item: "",
      quantity: "1",
      department: "",
      life_span: "12",
      date_acquired: new Date().toISOString().split("T")[0],
    },
  });

  // Fetch departments for the dropdown
  useEffect(() => {
    if (open) {
      const fetchDeps = async () => {
        try {
          const res = await fetch("/api/fm/asset-management?type=departments");
          const data = await res.json();
          setDepartments(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Failed to load departments", error);
        }
      };
      fetchDeps();
    }
  }, [open]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/fm/asset-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to save asset");

      toast.success("Asset added successfully!");
      setOpen(false);
      form.reset();
      onSuccess(); // Triggers the table refresh in the parent page
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New Asset</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Item Name */}
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Dell Latitude 5420" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department Selection */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments && departments.length > 0 ? (
                        departments.map((d, index) => {
                          // Create a safe ID: priority to d.id, then d.department_id, then the loop index
                          const safeId = (
                            d.id ||
                            d.department_id ||
                            index
                          ).toString();

                          return (
                            <SelectItem
                              key={`dept-${safeId}`} // Unique string key
                              value={safeId} // Non-empty value
                            >
                              {d.department_name || "Unnamed Department"}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <SelectItem key="loading-dept" value="loading" disabled>
                          Loading departments...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Barcode & RFID */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rfid_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFID Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Cost & Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost_per_item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Item</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Condition & Life Span */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Static items need unique keys too */}
                        <SelectItem key="cond-good" value="Good">
                          Good
                        </SelectItem>
                        <SelectItem key="cond-fair" value="Fair">
                          Fair
                        </SelectItem>
                        <SelectItem key="cond-poor" value="Poor">
                          Poor
                        </SelectItem>
                        <SelectItem key="cond-broken" value="Broken">
                          Broken
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="life_span"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Life Span (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Asset
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
