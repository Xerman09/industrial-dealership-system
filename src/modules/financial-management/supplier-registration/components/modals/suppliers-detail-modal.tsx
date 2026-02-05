"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Supplier } from "@/modules/financial-management/supplier-registration/types/supplier.schema";
import { useRepresentatives } from "@/modules/financial-management/supplier-registration/hooks/useRepresentatives";
import { RepresentativeCard } from "./view-representative-details";
import { AddRepresentativeForm } from "../forms/add-representative-form";
import { useState } from "react";
import {
  MapPin,
  Building2,
  FileText,
  CreditCard,
  Users,
  Plus,
  Stethoscope,
  Phone,
  Mail,
  LocateIcon,
  LocationEdit,
  Hash,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  open: boolean;
  onClose: () => void;
}

export function SupplierDetailsModal({
  supplier,
  open,
  onClose,
}: SupplierDetailsModalProps) {
  const [showAddRepForm, setShowAddRepForm] = useState(false);
  const { representatives, isLoading, removeRepresentative, refresh } =
    useRepresentatives(supplier?.id || null);

  if (!supplier) return null;

  const handleAddRepSuccess = () => {
    setShowAddRepForm(false);
    refresh();
  };

  const EmptyInfo = ({
    message = "The complete physical office location and mailing address for this supplier have not yet been documented.",
  }) => {
    // Logic to clamp text for the display
    const isLong = message.length > 12;
    const displayMessage = isLong ? `${message.substring(0, 18)}...` : message;

    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm font-normal text-muted-foreground/60 italic cursor-help">
              {displayMessage}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-75 bg-slate-900 text-white p-2 rounded-md shadow-lg"
          >
            <p className="text-xs leading-relaxed">{message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold mb-2">
                {supplier.supplier_name}
              </DialogTitle>
              <div className="flex flex-1 gap-4">
                <div className="flex items-center text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>TIN: {supplier.tin_number}</span>
                </div>
                <Badge variant="secondary" className="rounded-sm">
                  {supplier.supplier_type}
                </Badge>
                <Badge
                  variant={supplier.isActive === 1 ? "default" : "secondary"}
                >
                  {supplier.isActive === 1 ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Supplier Information */}
          <div className="text-lg font-semibold">Supplier Information</div>
          <Card className="shadow-none gap-2 rounded-lg">
            <CardHeader>
              <div className="flex flex-row">
                <div className="flex flex-1 gap-4">
                  <div className="h-14 w-14 rounded-full flex items-center justify-center border">
                    <span className="text-lg font-bold text-muted-foreground">
                      {supplier.supplier_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{supplier.supplier_name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {supplier.phone_number ? (
                          supplier.phone_number
                        ) : (
                          <EmptyInfo message="No primary office contact number has been registered for this supplier at this time." />
                        )}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="flex items-center gap-1.5 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {supplier.email_address ? (
                          supplier.email_address
                        ) : (
                          <EmptyInfo message="A verified business email address is currently not available in our records for this company." />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Supplier Representative Form */}
                <div className="flex flex-1 justify-end py-2">
                  {/* 3. The "Add New" Button - Always visible, styled to match the group */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all z-20 mr-1"
                    onClick={() => setShowAddRepForm(!showAddRepForm)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  {isLoading ? (
                    <div className="h-12 w-12 rounded-full bg-accent animate-pulse" />
                  ) : (
                    <div className="flex items-center -space-x-3  transition-all duration-300 delay-75 ease-in-out">
                      {/* 1. Show existing avatars */}
                      {representatives.slice(0, 5).map((rep) => (
                        <RepresentativeCard
                          key={rep.id}
                          representative={rep}
                          onRemove={removeRepresentative}
                        />
                      ))}
                      {/* 2. Overflow Counter (+N) */}
                      {representatives.length > 5 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative h-12 w-12 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-slate-700 transition-colors z-10">
                                +{representatives.length - 5}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="p-3 bg-slate-900 border-none rounded-xl"
                            >
                              <div className="space-y-2">
                                {representatives.slice(5).map((rep) => (
                                  <div
                                    key={rep.id}
                                    className="text-xs text-white flex items-center justify-between gap-4"
                                  >
                                    <span>
                                      {rep.first_name} {rep.last_name}
                                    </span>
                                    <button
                                      onClick={() =>
                                        removeRepresentative(rep.id!)
                                      }
                                      className="text-slate-500 hover:text-red-400"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 ">
              <div className="border p-5 rounded-sm">
                <p className="text-sm font-semibold uppercase mb-2 flex items-center gap-1.5 text-muted-foreground">
                  Placeholder
                </p>
                <p className="text-sm font-sans font-medium">
                  {supplier.address ||
                  supplier.city ||
                  supplier.state_province ? (
                    <>
                      {supplier.address}, {supplier.brgy}, {supplier.city},{" "}
                      {supplier.state_province} {supplier.postal_code},{" "}
                      {supplier.country}
                    </>
                  ) : (
                    <EmptyInfo  message="The complete physical office location and mailing address for this supplier have not yet been documented." />
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 w-full gap-20">
                <div className="flex flex-col w-full gap-2 text-sm uppercase">
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Location
                  </span>
                  <span className="gap-2 capitalize">
                    <p>
                      {supplier.address || "The complete physical office location and mailing address for this supplier have not yet been documented."}
                      {supplier.postal_code || ""}
                    </p>
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-sm uppercase">
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Payment & Delivery
                  </span>
                  <span className="flex gap-2">
                    <Badge variant="secondary" className="rounded-sm">
                      {supplier.payment_terms || "Unavailable"}
                    </Badge>
                    <Badge variant="secondary" className="rounded-sm">
                      {supplier.delivery_terms || "Unavailable"}
                    </Badge>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          {!isLoading && representatives.length === 0 && !showAddRepForm && (
            <span className="text-xs text-slate-400 ml-4 italic">
              No representatives yet. Click the + to add.
            </span>
          )}

          {/* Supplier Representative Form */}
          <div>
            {showAddRepForm && (
              <div className="mb-4">
                <AddRepresentativeForm
                  supplierId={supplier.id!}
                  onSuccess={handleAddRepSuccess}
                  onCancel={() => setShowAddRepForm(false)}
                />
                <Separator className="mt-4" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
