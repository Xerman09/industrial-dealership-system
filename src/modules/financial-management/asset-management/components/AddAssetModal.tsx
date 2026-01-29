"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { assetFormSchema, AssetFormValues, Department, User } from "../types";
import { assetService } from "../services/assetService";

export default function AddAssetModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      item_name: "",
      item_type: "",
      item_classification: "",
      barcode: "",
      rfid_code: "",
      condition: "Good",
      quantity: 1,
      cost_per_item: 0,
      life_span: 12,
      date_acquired: new Date(),
      department: "" as any,
      employee: "" as any,
    },
  });

  useEffect(() => {
    if (open) {
      assetService.getDepartments().then((res) => setDepartments(res.data));
      assetService.getUsers().then((res) => setUsers(res.data));
    }
  }, [open]);

  async function onSubmit(values: AssetFormValues) {
    setLoading(true);
    try {
      await assetService.createAsset(values);
      toast.success("Asset created successfully");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save asset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Input all technical and financial details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <Input placeholder="e.g. Laptop" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="item_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Type</FormLabel>
                  <Input placeholder="e.g. Electronics" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="item_classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classification</FormLabel>
                  <Input placeholder="e.g. Asset" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <Input {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rfid_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFID Code</FormLabel>
                  <Input {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <Input type="number" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cost_per_item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost</FormLabel>
                  <Input type="number" {...field} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="life_span"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Life Span (Months)</FormLabel>
                  <Input type="number" {...field} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem
                          key={d.department_id}
                          value={d.department_id.toString()}
                        >
                          {d.department_description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <Button type="submit" className="col-span-2" disabled={loading}>
              {loading && <Loader2 className="animate-spin mr-2" />} Save Asset
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
