"use client";

import React, { useEffect, useState } from "react";
import AddAssetModal from "./components/AddAssetModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// FIX: Importing the columns definition
import { columns } from "./components/data-table/columns";
import { AssetTableData } from "./types";
import { AssetDataTable } from "./components/data-table";

export default function AssetManagementModulePage() {
  const [data, setData] = useState<AssetTableData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/fm/asset-management");
      const result = await response.json();

      // Directus unwrapping
      if (result && result.data) {
        setData(result.data);
      }
    } catch (error) {
      toast.error("Failed to load assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Asset Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track company equipment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAssets}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {/* Passing the refresh function to the modal */}
          <AddAssetModal onSuccess={fetchAssets} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AssetDataTable columns={columns} data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
