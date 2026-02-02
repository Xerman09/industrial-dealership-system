"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPHP, getDepreciatedValue } from "../utils/lib";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, User, Building, Barcode, Cpu } from "lucide-react";

export default function ViewAssetModal({ asset, isOpen, onOpenChange }: any) {
  if (!asset) return null;

  const currentVal = getDepreciatedValue(
    Number(asset.cost_per_item),
    Number(asset.quantity),
    Number(asset.life_span),
    asset.date_acquired,
    new Date(),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> {asset.item_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="aspect-square rounded-md border bg-muted flex items-center justify-center overflow-hidden">
              {asset.item_image ? (
                <img
                  src={`/api/fm/asset-image-view?id=${asset.item_image}`}
                  className="object-cover h-full w-full"
                />
              ) : (
                <Package className="h-12 w-12 opacity-20" />
              )}
            </div>
            <Badge className="w-full justify-center py-1">
              {asset.condition}
            </Badge>
          </div>

          <div className="space-y-4 text-sm">
            <Detail
              label="Department"
              value={asset.department_name}
              icon={<Building size={14} />}
            />
            <Detail
              label="Assigned To"
              value={asset.assigned_to_name}
              icon={<User size={14} />}
            />
            <Detail
              label="Barcode"
              value={asset.barcode}
              icon={<Barcode size={14} />}
            />
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Cost:</span>
                <span className="font-mono">
                  {formatPHP(asset.cost_per_item * asset.quantity)}
                </span>
              </div>
              <div className="flex justify-between bg-primary/10 p-2 rounded text-primary font-bold">
                <span>Current Value:</span>
                <span className="font-mono">{formatPHP(currentVal)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Detail = ({ label, value, icon }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
      {icon} {label}
    </span>
    <span className="font-medium">{value || "—"}</span>
  </div>
);
