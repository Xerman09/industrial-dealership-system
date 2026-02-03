"use client";

import { useState } from "react";
import { useSuppliers } from "@/modules/financial-management/supplier-registration/hooks/useSuppliers";
import { DataTable } from "./components/data-table";
import { createColumns } from "./components/data-table/columns";
import { SupplierDetailsModal } from "@/modules/financial-management/supplier-registration/components/modals/SupplierDetailsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Supplier } from "@/modules/financial-management/supplier-registration/types/supplier.schema";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SupplierRepresentativeModulePage() {
  const { suppliers, isLoading, error, refresh, setSearchQuery } =
    useSuppliers();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );

  // Handle view supplier
  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setViewModalOpen(true);
  };

  // Handle edit supplier
  const handleEdit = (supplier: Supplier) => {
    // TODO: Implement edit functionality in next phase
    toast.info("Edit functionality will be implemented in the next phase");
  };

  // Handle delete supplier
  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!supplierToDelete?.id) return;

    try {
      const response = await fetch(`/api/suppliers/${supplierToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete supplier");
      }

      toast.success("Supplier deleted successfully");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete supplier",
      );
    } finally {
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  // Create columns with handlers
  const columns = createColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supplier Registration
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage suppliers and their representatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => toast.info("Add supplier form coming soon!")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive font-medium">
                Error loading suppliers
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {error.message}
              </p>
              <Button onClick={refresh} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={suppliers}
              searchPlaceholder="Search by name, TIN, or contact person..."
              onSearchChange={setSearchQuery}
            />
          )}
        </CardContent>
      </Card>

      {/* Supplier Details Modal */}
      <SupplierDetailsModal
        supplier={selectedSupplier}
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedSupplier(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{supplierToDelete?.supplier_name}</strong>? This action
              cannot be undone and will also remove all associated
              representatives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
