"use client";

import * as React from "react";
import { toast } from "sonner";

import type { AccountTypeRow, BalanceTypeRow, BSISTypeRow, COARow } from "../types";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "create" | "edit";

function toStr(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function readIsPaymentFromRow(row?: COARow | null) {
  if (!row) return false;

  // Prefer numeric field when available
  const n = (row as any).is_payment;
  if (n === 1 || n === "1" || n === true) return true;
  if (n === 0 || n === "0" || n === false) return false;

  // Handle Directus buffer-like value: { type: "Buffer", data: [1] }
  const buf = (row as any).isPayment;
  const b = buf?.data?.[0];
  if (b === 1) return true;
  if (b === 0) return false;

  return false;
}

export default function COAFormDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  mode: Mode;
  row?: COARow | null;

  accountTypes: AccountTypeRow[];
  balanceTypes: BalanceTypeRow[];
  bsisTypes: BSISTypeRow[];
  lookupsLoading: boolean;

  // NOTE: UI shows "Loading..." like your screenshot.
  addedByLabel?: string;

  onCreate: (payload: {
    account_title: string;
    bsis_code: number;
    account_type: number;
    balance_type: number;
    gl_code?: string | null;
    description?: string | null;

    // ✅ NEW
    is_payment?: 0 | 1;
    isPayment?: 0 | 1;
  }) => Promise<void> | void;

  onUpdate: (
    id: number,
    payload: {
      account_title: string;
      bsis_code: number;
      account_type: number;
      balance_type: number;
      gl_code?: string | null;
      description?: string | null;

      // ✅ NEW
      is_payment?: 0 | 1;
      isPayment?: 0 | 1;
    },
  ) => Promise<void> | void;
}) {
  const {
    open,
    onOpenChange,
    mode,
    row,
    accountTypes,
    balanceTypes,
    bsisTypes,
    lookupsLoading,
    addedByLabel = "Loading...",
    onCreate,
    onUpdate,
  } = props;

  const [accountTitle, setAccountTitle] = React.useState("");
  const [bsisCode, setBsisCode] = React.useState<string>("");
  const [accountType, setAccountType] = React.useState<string>("");
  const [balanceType, setBalanceType] = React.useState<string>("");
  const [glCode, setGlCode] = React.useState("");
  const [description, setDescription] = React.useState("");

  // ✅ NEW: Is Payment checkbox state
  const [isPayment, setIsPayment] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    if (mode === "edit" && row) {
      setAccountTitle(toStr(row.account_title));
      setBsisCode(row.bsis_code ? String(row.bsis_code) : "");
      setAccountType(row.account_type ? String(row.account_type) : "");
      setBalanceType(row.balance_type ? String(row.balance_type) : "");
      setGlCode(toStr(row.gl_code));
      setDescription(toStr(row.description));

      // ✅ NEW: prefill checkbox from row
      setIsPayment(readIsPaymentFromRow(row));
    } else {
      setAccountTitle("");
      setBsisCode("");
      setAccountType("");
      setBalanceType("");
      setGlCode("");
      setDescription("");

      // ✅ NEW: default unchecked on create
      setIsPayment(false);
    }
  }, [open, mode, row]);

  function validate() {
    if (!accountTitle.trim()) return "Account Title is required";
    if (!bsisCode) return "BS/IS Type is required";
    if (!accountType) return "Account Type is required";
    if (!balanceType) return "Balance Type is required";
    return null;
  }

  async function submit() {
    const msg = validate();
    if (msg) {
      toast.error(msg);
      return;
    }

    const payFlag: 0 | 1 = isPayment ? 1 : 0;

    const payload = {
      account_title: accountTitle.trim(),
      bsis_code: toNum(bsisCode),
      account_type: toNum(accountType),
      balance_type: toNum(balanceType),
      gl_code: glCode.trim() ? glCode.trim() : null,
      description: description.trim() ? description.trim() : null,

      // ✅ REQUIRED: update both fields
      is_payment: payFlag,
      isPayment: payFlag,
    };

    if (mode === "create") {
      await onCreate(payload);
    } else if (mode === "edit" && row?.coa_id) {
      await onUpdate(row.coa_id, payload);
    }
  }

  const title = mode === "create" ? "Add New Account" : "Edit Account";
  const primaryText = mode === "create" ? "Create" : "Save Changes";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Account Title <span className="text-destructive">*</span>
            </label>
            <Input value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} />
          </div>

          {/* BS/IS Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              BS/IS Type <span className="text-destructive">*</span>
            </label>
            <Select value={bsisCode} onValueChange={setBsisCode} disabled={lookupsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a BS/IS type" />
              </SelectTrigger>
              <SelectContent>
                {bsisTypes.map((x) => (
                  <SelectItem key={x.id} value={String(x.id)}>
                    {x.bsis_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Account Type <span className="text-destructive">*</span>
            </label>
            <Select value={accountType} onValueChange={setAccountType} disabled={lookupsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((x) => (
                  <SelectItem key={x.id} value={String(x.id)}>
                    {x.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Balance Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Balance Type <span className="text-destructive">*</span>
            </label>
            <Select value={balanceType} onValueChange={setBalanceType} disabled={lookupsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a balance type" />
              </SelectTrigger>
              <SelectContent>
                {balanceTypes.map((x) => (
                  <SelectItem key={x.id} value={String(x.id)}>
                    {x.balance_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* GL Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">GL Code</label>
            <Input value={glCode} onChange={(e) => setGlCode(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[110px]"
            />
          </div>

          {/* ✅ NEW: Is Payment checkbox (above Added By) */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isPayment}
              onCheckedChange={(v) => setIsPayment(v === true)}
              id="is-payment"
            />
            <label
              htmlFor="is-payment"
              className="text-sm font-medium leading-none cursor-pointer select-none"
            >
              Is Payment
            </label>
          </div>

          {/* Added By */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Added By</label>
            <Input value={addedByLabel} disabled />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={submit}>
              {primaryText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
