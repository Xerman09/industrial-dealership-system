import { CylinderAsset } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, Search, Cylinder, ArrowUp, ArrowDown, ArrowUpDown, Filter, X, Building2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  QrCode, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  History,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { format, isPast, isBefore, addDays } from "date-fns";

import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer } from "lucide-react";

interface Props {
  data: CylinderAsset[];
  onCreate: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  filters: {
    search: string;
    setSearch: (val: string) => void;
    branchId: number | undefined;
    setBranchId: (val: number | undefined) => void;
    status: string | undefined;
    setStatus: (val: string | undefined) => void;
    productId: number | undefined;
    setProductId: (val: number | undefined) => void;
    condition: string | undefined;
    setCondition: (val: string | undefined) => void;
  };
  pagination: {
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    total: number;
  };
  sorting: {
    sortBy: string;
    sortOrder: "ASC" | "DESC";
    toggleSort: (field: string) => void;
  };
}

export function CylinderAssetsList({ data, onCreate, onEdit, onDelete, filters, pagination, sorting }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CylinderAsset | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAllSelectedGlobal, setIsAllSelectedGlobal] = useState(false);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);
  const [globalAssets, setGlobalAssets] = useState<CylinderAsset[]>([]);
  
  const printRef = useRef<HTMLDivElement>(null);
  const bulkPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Tag-${selectedAsset?.serial_number || 'Asset'}`,
  });

  const handleBulkPrint = useReactToPrint({
    contentRef: bulkPrintRef,
    documentTitle: `Bulk-Tags-${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length || isAllSelectedGlobal) {
      setSelectedIds([]);
      setIsAllSelectedGlobal(false);
    } else {
      setSelectedIds(data.map(item => item.id));
    }
  };

  const toggleSelect = (id: number | string) => {
    setIsAllSelectedGlobal(false);
    setSelectedIds(prev => {
      const isSelected = prev.some(i => String(i) === String(id));
      if (isSelected) {
        return prev.filter(i => String(i) !== String(id));
      } else {
        return [...prev, id as number]; // Type cast for consistency if possible, but state is number[]
      }
    });
  };

  const handleSelectAllGlobal = async () => {
    setIsAllSelectedGlobal(true);
    setIsFetchingGlobal(true);
    try {
      // Fetch ALL assets matching current filters
      const response = await fetch(`/api/scm/inventory-management/cylinder-assets?limit=-1&status=${filters.status || ''}&condition=${filters.condition || ''}&branchId=${filters.branchId || ''}&productId=${filters.productId || ''}&search=${filters.search || ''}`);
      const d = await response.json();
      if (d.data) {
        setGlobalAssets(d.data);
        setSelectedIds(d.data.map((a: any) => a.id));
      }
    } catch (error) {
      console.error("Failed to fetch all assets:", error);
    } finally {
      setIsFetchingGlobal(false);
    }
  };

  const selectedAssets = isAllSelectedGlobal 
    ? globalAssets 
    : data.filter(item => selectedIds.some(id => String(id) === String(item.id)));

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: pagination.total,
      available: data.filter(a => a.cylinder_status === 'AVAILABLE').length,
      withCustomer: data.filter(a => a.cylinder_status === 'WITH_CUSTOMER').length,
      expired: data.filter(a => a.expiration_date && isPast(new Date(a.expiration_date))).length,
      nearExpiration: data.filter(a => {
        if (!a.expiration_date) return false;
        const expDate = new Date(a.expiration_date);
        return !isPast(expDate) && isBefore(expDate, addDays(new Date(), 30));
      }).length,
    };
  }, [data, pagination.total]);

  useEffect(() => {
    fetch("/api/scm/inventory-management/cylinder-assets/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setProducts(d.data.map((p: any) => ({ id: p.product_id, name: p.product_name })));
      });

    fetch("/api/scm/inventory-management/stock-adjustment/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setBranches(d.data.map((b: any) => ({ id: b.id, name: b.branch_name })));
      });
  }, []);

  const renderSortIcon = (field: string) => {
    if (sorting.sortBy !== field) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
    return sorting.sortOrder === "ASC" ? (
      <ArrowUp className="ml-2 h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="ml-2 h-3 w-3 text-blue-600" />
    );
  };

  const hasActiveFilters = 
    filters.branchId !== undefined || 
    filters.status !== undefined || 
    filters.productId !== undefined || 
    filters.condition !== undefined;

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cylinder Assets</h1>
            <p className="text-sm text-muted-foreground">Manage and track your serialized products</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={`h-9 gap-2 ${showFilters || hasActiveFilters ? 'border-blue-200 bg-blue-50/50 text-blue-600' : ''}`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-blue-600 text-white hover:bg-blue-600">
                  {Object.values(filters).filter(v => v !== undefined && v !== "").length - 1}
                </Badge>
              )}
            </Button>
            <Button onClick={onCreate} className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </div>
      </div>


      {/* ── KPI Dashboard ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {[
          { label: "Total Assets", val: stats.total, icon: Cylinder, color: "blue" },
          { label: "Available", val: stats.available, icon: CheckCircle2, color: "emerald" },
          { label: "With Customers", val: stats.withCustomer, icon: Building2, color: "indigo" },
          { label: "Near Exp.", val: stats.nearExpiration, icon: AlertTriangle, color: "orange" },
          { label: "Expired", val: stats.expired, icon: ShieldAlert, color: "red" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md hover:shadow-lg transition-shadow duration-300">
              <div className={`absolute top-0 left-0 w-1 h-full bg-${item.color}-500`} />
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-xl text-${item.color}-600 dark:text-${item.color}-400 shadow-inner`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{item.label}</p>
                  <h3 className={`text-2xl font-black tabular-nums text-${item.color}-600 dark:text-${item.color}-400`}>
                    {item.val}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by serial or remarks..."
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            className="pl-9 h-10 shadow-sm"
          />
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-muted/30 border-none shadow-inner mb-2 transition-all duration-300">
              <CardContent className="p-4 flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-0.5 opacity-70">Status</Label>
                  <Select
                    value={filters.status || "ALL"}
                    onValueChange={(val) => filters.setStatus(val === "ALL" ? undefined : val)}
                  >
                    <SelectTrigger className="h-10 w-[140px] bg-background border-none shadow-sm ring-1 ring-border/50">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="WITH_CUSTOMER">With Customer</SelectItem>
                      <SelectItem value="EMPTY">Empty</SelectItem>
                      <SelectItem value="LOADED">Loaded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-0.5 opacity-70">Condition</Label>
                  <Select
                    value={filters.condition || "ALL"}
                    onValueChange={(val) => filters.setCondition(val === "ALL" ? undefined : val)}
                  >
                    <SelectTrigger className="h-10 w-[140px] bg-background border-none shadow-sm ring-1 ring-border/50">
                      <SelectValue placeholder="All Conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Conditions</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="FOR_REPAIR">For Repair</SelectItem>
                      <SelectItem value="DAMAGED">Damaged</SelectItem>
                      <SelectItem value="SCRAP">Scrap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-0.5 opacity-70">Branch</Label>
                  <Select
                    value={filters.branchId ? String(filters.branchId) : "ALL"}
                    onValueChange={(val) => filters.setBranchId(val === "ALL" ? undefined : Number(val))}
                  >
                    <SelectTrigger className="h-10 w-[180px] bg-background border-none shadow-sm ring-1 ring-border/50">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Branches</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-0.5 opacity-70">Product</Label>
                  <Select
                    value={filters.productId ? String(filters.productId) : "ALL"}
                    onValueChange={(val) => filters.setProductId(val === "ALL" ? undefined : Number(val))}
                  >
                    <SelectTrigger className="h-10 w-[220px] bg-background border-none shadow-sm ring-1 ring-border/50">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Products</SelectItem>
                      {products.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    filters.setStatus(undefined);
                    filters.setCondition(undefined);
                    filters.setBranchId(undefined);
                    filters.setProductId(undefined);
                    filters.setSearch("");
                  }}
                  className="h-10 gap-2 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* ── Bulk Actions & Selection Banner ──────────────── */}
      {selectedIds.length > 0 && (
        <div className="space-y-0 shadow-sm border border-blue-100 dark:border-blue-800 rounded-lg overflow-visible animate-in fade-in slide-in-from-top-1 mb-1">
          <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm min-h-[56px] px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 leading-none">
                {isAllSelectedGlobal 
                  ? `All ${pagination.total} assets selected` 
                  : `${selectedIds.length} asset${selectedIds.length > 1 ? 's' : ''} selected`
                }
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedIds([]);
                  setIsAllSelectedGlobal(false);
                }}
                className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-800/40"
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => handleBulkPrint()}
                disabled={isFetchingGlobal}
                className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-none"
              >
                {isFetchingGlobal ? <div className="h-3 w-3 animate-spin border-2 border-white border-t-transparent rounded-full" /> : <Printer className="h-4 w-4" />}
                Print QR Tags ({isAllSelectedGlobal ? pagination.total : selectedIds.length})
              </Button>
            </div>
          </div>

          {/* Gmail-style "Select all X" banner */}
          {selectedIds.length === data.length && !isAllSelectedGlobal && pagination.total > data.length && (
            <div className="bg-blue-600/5 dark:bg-blue-400/5 text-center py-2 border-t border-blue-100 dark:border-blue-800/50 text-xs animate-in fade-in duration-300">
              <p className="text-muted-foreground font-medium">
                All {data.length} assets on this page are selected.{" "}
                <button 
                  onClick={handleSelectAllGlobal}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
                >
                  Select all {pagination.total} assets in Cylinder Assets
                </button>
              </p>
            </div>
          )}
          
          {isAllSelectedGlobal && (
            <div className="bg-blue-600/5 dark:bg-blue-400/5 text-center py-2 border-t border-blue-100 dark:border-blue-800/50 text-xs animate-in fade-in duration-300">
              <p className="text-muted-foreground font-medium">
                All {pagination.total} assets are selected.{" "}
                <button 
                  onClick={() => {
                    setSelectedIds([]);
                    setIsAllSelectedGlobal(false);
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
                >
                  Clear selection
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      <Card className="flex-1 min-h-[500px] overflow-hidden flex flex-col shadow-md border-border/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        {/* ── Fixed Header Area ─────────────────────────── */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md border-b z-40">
          <Table className="table-fixed border-separate border-spacing-0">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="w-[50px] px-4 h-12">
                  <div className="flex items-center h-full">
                    <Checkbox 
                      checked={
                        isAllSelectedGlobal || (data.length > 0 && selectedIds.length === data.length)
                          ? true
                          : selectedIds.length > 0
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[12%] font-bold text-foreground cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("serial_number")}>
                  <div className="flex items-center text-[11px] uppercase tracking-wider h-full">Serial {renderSortIcon("serial_number")}</div>
                </TableHead>
                <TableHead className="w-[18%] font-bold text-foreground cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("product_id")}>
                  <div className="flex items-center text-[11px] uppercase tracking-wider h-full">Product {renderSortIcon("product_id")}</div>
                </TableHead>
                <TableHead className="w-[10%] font-bold text-foreground cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("cylinder_status")}>
                  <div className="flex items-center text-[11px] uppercase tracking-wider h-full">Status {renderSortIcon("cylinder_status")}</div>
                </TableHead>
                <TableHead className="w-[10%] font-bold text-foreground cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("cylinder_condition")}>
                  <div className="flex items-center text-[11px] uppercase tracking-wider h-full">Cond. {renderSortIcon("cylinder_condition")}</div>
                </TableHead>
                <TableHead className="w-[12%] font-bold text-foreground cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("expiration_date")}>
                  <div className="flex items-center text-[11px] uppercase tracking-wider h-full">Exp. {renderSortIcon("expiration_date")}</div>
                </TableHead>
                <TableHead className="w-[8%] font-bold text-foreground text-right cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("tare_weight")}>
                  <div className="flex items-center justify-end text-[11px] uppercase tracking-wider h-full">Tare {renderSortIcon("tare_weight")}</div>
                </TableHead>
                <TableHead className="w-[12%] font-bold text-foreground cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("current_branch_id")}>
                  <div className="flex items-center text-[11px] uppercase tracking-wider h-full">Branch {renderSortIcon("current_branch_id")}</div>
                </TableHead>
                <TableHead className="w-[12%] font-bold text-foreground cursor-pointer h-12 py-0" onClick={() => sorting.toggleSort("current_customer_code")}>
                  <div className="flex items-center text-[11px] uppercase tracking-wider h-full">Customer {renderSortIcon("current_customer_code")}</div>
                </TableHead>
                <TableHead className="w-[80px] text-right font-bold text-foreground pr-6 h-12 py-0 text-[11px] uppercase tracking-wider">
                  <div className="flex items-center justify-end h-full">Actions</div>
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        {/* ── Scrollable Body Area ────────────────────────── */}
        <CardContent className="p-0 flex-1 overflow-auto relative custom-scrollbar">
          <Table className="table-fixed border-separate border-spacing-0">
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground opacity-60">
                      <Cylinder className="h-12 w-12 mb-4 stroke-1" />
                      <p className="text-lg font-medium">No assets found</p>
                      <p className="text-sm">Click "Add Asset" to register your first serialized product.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const isExpired = item.expiration_date && isPast(new Date(item.expiration_date));
                  const isNearExp = item.expiration_date && !isExpired && isBefore(new Date(item.expiration_date), addDays(new Date(), 30));

                    return (
                      <TableRow 
                        key={item.id} 
                        className={`hover:bg-muted/10 transition-colors group border-b last:border-b-0 ${selectedIds.some(id => String(id) === String(item.id)) ? 'bg-blue-50/60 dark:bg-blue-900/40' : ''}`}
                      >
                        <TableCell className="w-[50px] px-4 py-2">
                          <Checkbox 
                            checked={selectedIds.some(id => String(id) === String(item.id))}
                            onCheckedChange={() => toggleSelect(item.id)}
                            aria-label={`Select ${item.serial_number}`}
                          />
                        </TableCell>
                        <TableCell className="w-[12%] font-bold text-foreground truncate">{item.serial_number}</TableCell>
                        <TableCell className="w-[18%] font-medium">
                          <div className="truncate">{item.product?.product_name || "N/A"}</div>
                        {item.product?.product_code && <span className="block text-[10px] text-muted-foreground truncate">{item.product.product_code}</span>}
                      </TableCell>
                      <TableCell className="w-[10%]">
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border-none shadow-sm
                            ${item.cylinder_status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                              item.cylinder_status === 'WITH_CUSTOMER' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 
                              'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}
                        >
                          {item.cylinder_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[10%]">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full
                            ${item.cylinder_condition === 'GOOD' ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20' : 
                              'border-red-200 text-red-700 bg-red-50/50 dark:border-red-800 dark:text-red-400 dark:bg-red-900/20'}`}
                        >
                          {item.cylinder_condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[12%] text-xs font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isExpired ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              {item.expiration_date}
                            </span>
                          ) : isNearExp ? (
                            <span className="text-orange-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {item.expiration_date}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {item.expiration_date || "—"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-[8%] text-xs font-mono text-right font-medium tabular-nums">
                        {item.tare_weight !== null && !isNaN(Number(item.tare_weight)) 
                          ? Number(item.tare_weight).toFixed(2) 
                          : "—"}
                      </TableCell>
                      <TableCell className="w-[12%] text-muted-foreground truncate">{item.branch?.branch_name || "N/A"}</TableCell>
                      <TableCell className="w-[12%] text-muted-foreground truncate">{item.customer?.customer_name || item.current_customer_code || "N/A"}</TableCell>
                      <TableCell className="w-[80px] text-right space-x-1 pr-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedAsset(item);
                            setQrModalOpen(true);
                          }} 
                          className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item.id)} className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-red-600">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {data.length > 0 && (
          <div className="border-t p-4 bg-muted/10">
            <DataTablePagination
              pageIndex={pagination.page}
              pageSize={pagination.pageSize}
              rowCount={pagination.total}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        )}
      </Card>

      {/* ── QR Code Modal ───────────────────────────────── */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-xs p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600">
                <QrCode className="h-6 w-6" />
              </div>
              Asset QR Code
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Scan to identify this cylinder
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div ref={printRef} className="p-8 bg-white flex flex-col items-center justify-center gap-4 min-w-[280px]">
              {selectedAsset && (
                <>
                  <div className="p-2 border-2 border-black rounded-lg mb-2">
                    <QRCodeSVG 
                      value={JSON.stringify({
                        id: selectedAsset.id,
                        sn: selectedAsset.serial_number,
                        type: "CYLINDER_ASSET"
                      })}
                      size={200}
                      level="H"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-mono font-bold text-2xl text-black">{selectedAsset.serial_number}</p>
                    <p className="text-sm font-bold text-black uppercase tracking-widest">{selectedAsset.product?.product_name}</p>
                    <p className="text-[10px] text-zinc-500">{format(new Date(), 'PPpp')}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" className="h-9" onClick={() => handlePrint()}>
              Print Tag
            </Button>
            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setQrModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Hidden Bulk Print Component ────────────────── */}
      <div className="hidden">
        <div ref={bulkPrintRef} className="print:block p-4">
          <div className="grid grid-cols-3 gap-4">
            {selectedAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="flex flex-col items-center justify-center p-4 border border-zinc-300 rounded-lg break-inside-avoid"
              >
                <div className="p-1 border border-black rounded mb-2">
                  <QRCodeSVG 
                    value={JSON.stringify({
                      id: asset.id,
                      sn: asset.serial_number,
                      type: "CYLINDER_ASSET"
                    })}
                    size={140}
                    level="M"
                  />
                </div>
                <div className="text-center">
                  <p className="font-mono font-bold text-base text-black leading-tight">{asset.serial_number}</p>
                  <p className="text-[10px] font-medium text-black uppercase truncate max-w-[150px]">{asset.product?.product_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
