"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CylinderAsset, CylinderStatus, CylinderCondition } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, Building2 } from "lucide-react";

interface SerialRow {
  id: string; // local key only
  serial_number: string;
  cylinder_status: CylinderStatus;
  cylinder_condition: CylinderCondition;
  customer_code: string;
  expiration_date: string;
  tare_weight: string;
}

interface Props {
  id: number | null;
  asset?: CylinderAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  createBulkAssets: (payloads: Partial<CylinderAsset>[]) => Promise<unknown>;
  updateAsset: (id: number, payload: Partial<CylinderAsset>) => Promise<unknown>;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const defaultRow = (): SerialRow => ({
  id: uid(),
  serial_number: "",
  cylinder_status: "AVAILABLE",
  cylinder_condition: "GOOD",
  customer_code: "",
  expiration_date: "",
  tare_weight: "",
});

const STATUS_OPTIONS: { value: CylinderStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "WITH_CUSTOMER", label: "With Customer" },
  { value: "EMPTY", label: "Empty" },
];

const CONDITION_OPTIONS: { value: CylinderCondition; label: string }[] = [
  { value: "GOOD", label: "Good" },
  { value: "FOR_REPAIR", label: "For Repair" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "SCRAP", label: "Scrap" },
];

export function CylinderAssetsForm({
  id,
  asset,
  open,
  onOpenChange,
  onSuccess,
  createBulkAssets,
  updateAsset,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<{ value: string; label: string }[]>([]);
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [customers, setCustomers] = useState<{ value: string; label: string }[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

  // Header fields
  const [productId, setProductId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [remarks, setRemarks] = useState("");

  // Serial rows
  const [rows, setRows] = useState<SerialRow[]>([defaultRow()]);

  // Edit mode single asset state
  const [editData, setEditData] = useState<Partial<Omit<CylinderAsset, 'tare_weight'>> & { tare_weight?: string | number | null }>({});

  useEffect(() => {
    if (!open) return;
    fetch("/api/scm/inventory-management/cylinder-assets/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.data)
          setProducts(
            d.data.map((p: { product_id: number; product_code: string; product_name: string }) => ({
              value: String(p.product_id),
              label: `${p.product_code} — ${p.product_name}`,
            }))
          );
      })
      .catch(console.error);

    fetch("/api/scm/inventory-management/stock-adjustment/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.data)
          setBranches(
            d.data.map((b: { id: number; branch_name: string }) => ({ value: String(b.id), label: b.branch_name }))
          );
      })
      .catch(console.error);
  }, [open]);

  // Fetch customers with debounce
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setIsCustomerLoading(true);
      fetch(`/api/scm/inventory-management/cylinder-assets/customers?search=${encodeURIComponent(customerSearch)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.data)
            setCustomers(
              d.data.map((c: { customer_code: string; customer_name: string }) => ({
                value: c.customer_code,
                label: `${c.customer_code} — ${c.customer_name}`,
              }))
            );
        })
        .catch(console.error)
        .finally(() => setIsCustomerLoading(false));
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [customerSearch, open]);

  // Reset or load edit data when modal opens
  useEffect(() => {
    if (!open) return;
    if (id && asset) {
      // Edit mode: pre-populate all fields from the asset
      const productIdVal = asset.product_id
        ? String(typeof asset.product_id === "object" ? (asset.product_id as unknown as { product_id: number }).product_id : asset.product_id)
        : "";
      const branchIdVal = asset.current_branch_id
        ? String(typeof asset.current_branch_id === "object" ? (asset.current_branch_id as unknown as { id: number }).id : asset.current_branch_id)
        : "";
      setProductId(productIdVal);
      setBranchId(branchIdVal);
      setRemarks(asset.remarks || "");
      setEditData({
        serial_number: asset.serial_number || "",
        cylinder_status: asset.cylinder_status || "AVAILABLE",
        cylinder_condition: asset.cylinder_condition || "GOOD",
        expiration_date: asset.expiration_date || null,
        tare_weight: asset.tare_weight !== null ? String(Number(asset.tare_weight).toFixed(2)) : "",
        current_customer_code:
          typeof asset.current_customer_code === "object"
            ? (asset.current_customer_code as unknown as { customer_code: string })?.customer_code || null
            : asset.current_customer_code || null,
      });
    } else if (!id) {
      // Create mode: reset everything
      setProductId("");
      setBranchId("");
      setRemarks("");
      setRows([defaultRow()]);
      setEditData({});
    }
  }, [id, asset, open]);

  /* ---- Row helpers ---- */
  const addRow = () => setRows((prev) => [...prev, defaultRow()]);

  const removeRow = (rowId: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev));

  const updateRow = <K extends keyof SerialRow>(rowId: string, field: K, value: SerialRow[K]) =>
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));

  /* ---- Submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setLoading(true);
    try {
      if (id) {
        // Edit: single update
        await updateAsset(id, {
          ...editData,
          product_id: Number(productId),
          current_branch_id: branchId ? Number(branchId) : null,
          remarks,
          current_customer_code: editData.current_customer_code || null,
          tare_weight: (editData.tare_weight !== null && editData.tare_weight !== undefined && String(editData.tare_weight) !== "" && !isNaN(Number(editData.tare_weight))) 
            ? Number(editData.tare_weight) 
            : null,
        } as Partial<CylinderAsset>);
      } else {
        // Bulk create
        const payloads = rows
          .filter((r) => r.serial_number.trim() !== "")
          .map((r) => ({
            product_id: Number(productId),
            current_branch_id: branchId ? Number(branchId) : null,
            serial_number: r.serial_number.trim(),
            cylinder_status: r.cylinder_status,
            cylinder_condition: r.cylinder_condition,
            expiration_date: r.expiration_date || null,
            tare_weight: (r.tare_weight && !isNaN(Number(r.tare_weight))) ? Number(r.tare_weight) : null,
            current_customer_code: r.cylinder_status === "WITH_CUSTOMER" ? r.customer_code || null : null,
            remarks,
          }));

        if (payloads.length === 0) return;
        await createBulkAssets(payloads);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validRows = rows.filter((r) => r.serial_number.trim() !== "").length;
  const isCreateMode = !id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[920px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">
              {isCreateMode ? "Register Cylinder Assets" : "Edit Cylinder Asset"}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? "Select a product and branch, then add one or more serial numbers below."
                : "Update the details for this cylinder asset."}
            </DialogDescription>
          </DialogHeader>

          {/* ── Header: Product + Branch ─────────────────────── */}
          <div className="flex flex-col gap-3 pt-4 pb-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Package className="h-3.5 w-3.5 text-blue-500" />
                Product <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={products}
                value={productId}
                onValueChange={setProductId}
                placeholder="Select serialized product..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                Branch
              </Label>
              <SearchableSelect
                options={branches}
                value={branchId}
                onValueChange={setBranchId}
                placeholder="Select branch..."
                className="w-full"
              />
            </div>
          </div>

          {/* ── Serial Rows Table ─────────────────────────────── */}
          {isCreateMode && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold">Serial Numbers</Label>
                  {validRows > 0 && (
                    <Badge variant="secondary" className="text-xs font-bold tabular-nums">
                      {validRows} {validRows === 1 ? "entry" : "entries"}
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  disabled={!productId}
                  className="h-8 gap-1.5 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Row
                </Button>
              </div>

              {/* Table header */}
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_auto] gap-0 bg-muted/40 border-b border-border/60 px-3 py-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Serial Number
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Condition
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Expiration
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tare (kg)
                  </span>
                  <span className="w-8" />
                </div>

                <div className="divide-y divide-border/40">
                  {rows.map((row, index) => (
                    <div key={row.id} className="px-3 py-2 hover:bg-muted/10 transition-colors space-y-2">
                      {/* Main row: serial / status / condition / delete */}
                      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_auto] gap-2 items-center">
                        <Input
                          placeholder={`e.g. CYL-${String(index + 1).padStart(4, "0")}`}
                          value={row.serial_number}
                          onChange={(e) => updateRow(row.id, "serial_number", e.target.value)}
                          className="h-8 text-sm font-mono"
                          disabled={!productId}
                        />
                        <Select
                          value={row.cylinder_status}
                          onValueChange={(val: CylinderStatus) => {
                            updateRow(row.id, "cylinder_status", val);
                            if (val !== "WITH_CUSTOMER") {
                              updateRow(row.id, "customer_code", "");
                            }
                          }}
                          disabled={!productId}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={row.cylinder_condition}
                          onValueChange={(val: CylinderCondition) =>
                            updateRow(row.id, "cylinder_condition", val)
                          }
                          disabled={!productId}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={row.expiration_date}
                          onChange={(e) => updateRow(row.id, "expiration_date", e.target.value)}
                          className="h-8 text-xs"
                          disabled={!productId}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={row.tare_weight}
                          onChange={(e) => updateRow(row.id, "tare_weight", e.target.value)}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              updateRow(row.id, "tare_weight", val.toFixed(2));
                            }
                          }}
                          className="h-8 text-xs"
                          disabled={!productId}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Customer lookup — only when WITH_CUSTOMER */}
                      {row.cylinder_status === "WITH_CUSTOMER" && (
                        <div className="pl-0.5 pb-1">
                          <SearchableSelect
                            options={customers}
                            value={row.customer_code}
                            onValueChange={(val) => updateRow(row.id, "customer_code", val)}
                            onSearchChange={setCustomerSearch}
                            placeholder={isCustomerLoading ? "Searching..." : "Select customer..."}
                            className="h-8 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!productId && (
                <p className="text-xs text-muted-foreground italic pl-1">
                  ↑ Select a product first to enable the serial rows.
                </p>
              )}
            </div>
          )}

          {/* Edit mode: status, condition, customer only */}
          {!isCreateMode && (
            <div className="mt-4 rounded-lg border border-border/60 overflow-hidden">
              {/* Read-only info banner */}
              {asset && (
                <div className="bg-muted/30 border-b border-border/60 px-4 py-2.5 flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 block">Serial No.</span>
                    <span className="font-mono font-bold">{asset.serial_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 block">Product</span>
                    <span className="font-medium">{asset.product?.product_name || "—"}</span>
                  </div>
                </div>
              )}

              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Input
                    type="date"
                    value={String(editData.expiration_date || "")}
                    onChange={(e) => setEditData((p) => ({ ...p, expiration_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tare Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editData.tare_weight || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, tare_weight: e.target.value }))}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setEditData((p) => ({ ...p, tare_weight: val.toFixed(2) }));
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={(editData.cylinder_status as string) || "AVAILABLE"}
                    onValueChange={(val: CylinderStatus) => {
                      setEditData((p) => ({
                        ...p,
                        cylinder_status: val,
                        current_customer_code: val !== "WITH_CUSTOMER" ? null : p.current_customer_code,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={(editData.cylinder_condition as string) || "GOOD"}
                    onValueChange={(val: CylinderCondition) =>
                      setEditData((p) => ({ ...p, cylinder_condition: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editData.cylinder_status === "WITH_CUSTOMER" && (
                  <div className="col-span-2 space-y-2">
                    <Label>Customer</Label>
                    <SearchableSelect
                      options={customers}
                      value={(editData.current_customer_code as string) || ""}
                      onValueChange={(val) =>
                        setEditData((p) => ({ ...p, current_customer_code: val }))
                      }
                      onSearchChange={setCustomerSearch}
                      placeholder={isCustomerLoading ? "Searching..." : "Select customer..."}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2 mt-4">
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (isCreateMode && (!productId || validRows === 0))}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {loading
                ? "Saving..."
                : isCreateMode
                ? `Register ${validRows > 1 ? `${validRows} Assets` : "Asset"}`
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
