"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useReceivingProductsManual, todayYMD } from "../../providers/ReceivingProductsManualProvider";
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
import { AlertTriangle, ListFilter, Plus, Trash2, QrCode, Package, ChevronRight, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export function ManualProductsStep({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
    const {
        selectedPO,
        manualCounts,
        setManualCounts,
        verifiedProductIds,
        serialsByPorId,
        setSerialsByPorId,
    } = useReceivingProductsManual();

    // ✅ Pagination state
    const [receivingPage, setReceivingPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;

    // ✅ Verification Modal state
    const [isOverReceivingModalOpen, setIsOverReceivingModalOpen] = React.useState(false);

    // ✅ Serial Modal state
    const [serialModalOpen, setSerialModalOpen] = React.useState(false);
    const [activePorId, setActivePorId] = React.useState<string | null>(null);
    const [activeProductName, setActiveProductName] = React.useState("");
    const [tempSerials, setTempSerials] = React.useState<{ sn: string; tareWeight: string; expiryDate: string }[]>([]);
    const [newSerial, setNewSerial] = React.useState("");
    const [newTare, setNewTare] = React.useState("");
    const [newExpiry, setNewExpiry] = React.useState(todayYMD());
    const [isBulkMode, setIsBulkMode] = React.useState(false);
    const [bulkSerials, setBulkSerials] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    // ✅ Auto-focus input when modal opens
    React.useEffect(() => {
        if (serialModalOpen && !isBulkMode) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [serialModalOpen, isBulkMode]);

    // ✅ Show only verified items
    const filteredItems = React.useMemo(() => {
        const allocs = Array.isArray(selectedPO?.allocations) ? selectedPO!.allocations : [];
        const flattened = allocs.flatMap((a) => {
            const items = Array.isArray(a?.items) ? a.items : [];
            return items.map((it) => ({
                ...it,
                id: String(it.id),
                branchName: a?.branch?.name ?? "Unassigned",
            }));
        });

        return flattened.filter(it => verifiedProductIds.includes(it.productId));
    }, [selectedPO, verifiedProductIds]);

    const totalEntered = React.useMemo(() => {
        return Object.values(manualCounts).reduce((a, b) => a + (Number(b) || 0), 0);
    }, [manualCounts]);

    const handleCountChange = (id: string, val: string) => {
        const parsed = parseInt(val, 10);
        let validVal = isNaN(parsed) ? 0 : parsed;
        if (validVal < 0) validVal = 0;

        setManualCounts(prev => ({ ...prev, [id]: validVal }));
    };

    const isOverReceiving = React.useMemo(() => {
        return filteredItems.some(it => {
            const id = String(it.id);
            const expected = Number(it.expectedQty || 0);
            const receivedAtStart = Number(it.receivedQty || 0); // Quantity already received in previous saved receipts
            const currentEntry = Number(manualCounts[id] || 0);
            return (currentEntry + receivedAtStart) > expected && currentEntry > 0;
        });
    }, [filteredItems, manualCounts]);

    const handleContinueClick = () => {
        if (isOverReceiving) {
            setIsOverReceivingModalOpen(true);
        } else {
            onContinue();
        }
    };

    const openSerialModal = (id: string, name: string) => {
        setActivePorId(id);
        setActiveProductName(name);
        const existingSerials = (serialsByPorId[id] || []).map(s => ({
            sn: s.sn,
            tareWeight: s.tareWeight || "",
            expiryDate: s.expiryDate || todayYMD()
        }));
        setTempSerials(existingSerials);
        setNewSerial("");
        setNewTare("");
        setNewExpiry(todayYMD());
        setSerialModalOpen(true);
    };

    const activeItem = filteredItems.find(x => String((x as any).id) === activePorId) as any;
    const orderedLimit = activeItem ? Math.max(0, Number(activeItem.expectedQty || 0) - Number(activeItem.receivedQty || 0)) : Infinity;

    const addSerial = () => {
        const val = newSerial.trim();
        if (!val) return;

        if (tempSerials.length >= orderedLimit) {
            toast.error("Registration Limit Reached", {
                description: `Ordered quantity is ${orderedLimit}. Cannot add more serials.`,
                className: "bg-red-50 border-red-200"
            });
            setNewSerial("");
            return;
        }

        // ✅ Check for duplicates in current product's session
        if (tempSerials.some(x => x.sn === val)) {
            toast.warning("Duplicate Serial Found", {
                description: `Serial ${val} is already in your current list.`
            });
            setNewSerial("");
            return;
        }

        // ✅ NEW: Check for duplicates across ALL other products in the PO
        let existingProduct = "";
        for (const [id, serials] of Object.entries(serialsByPorId)) {
            if (id === activePorId) continue; // skip current product (already checked)
            if (serials.some(x => x.sn === val)) {
                // Find product name for better feedback
                const p = (selectedPO?.allocations || []).flatMap(a => a.items).find(i => String(i.id) === id);
                existingProduct = p?.name || "another product";
                break;
            }
        }

        if (existingProduct) {
            toast.error("Serial Already Registered", {
                description: `Serial ${val} was already scanned for: ${existingProduct}`,
                className: "bg-red-50 border-red-200"
            });
            setNewSerial("");
            return;
        }

        setTempSerials([...tempSerials, { sn: val, tareWeight: newTare, expiryDate: newExpiry }]);
        setNewSerial("");
        setNewTare(""); // reset tare after each scan
        toast.success("Serial Added", {
            description: val,
            duration: 1000
        });

        // Refocus after short delay to ensure continuous scanning
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const addBulkSerials = () => {
        const lines = bulkSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        if (lines.length === 0) return;

        const duplicates: string[] = [];
        const crossDuplicates: string[] = []; // duplicates from other products
        const newItems: { sn: string; tareWeight: string; expiryDate: string }[] = [];
        
        // Pre-calculate all serials from OTHER products
        const otherProductSerials = new Set<string>();
        Object.entries(serialsByPorId).forEach(([id, sns]) => {
            if (id !== activePorId) sns.forEach(s => otherProductSerials.add(s.sn));
        });

        lines.forEach(sn => {
            if (tempSerials.some(x => x.sn === sn) || newItems.some(x => x.sn === sn)) {
                duplicates.push(sn);
            } else if (otherProductSerials.has(sn)) {
                crossDuplicates.push(sn);
            } else {
                newItems.push({ sn, tareWeight: newTare || "0", expiryDate: newExpiry || todayYMD() });
            }
        });

        if (newItems.length > 0) {
            const currentCount = tempSerials.length;
            const remaining = orderedLimit - currentCount;

            if (newItems.length > remaining) {
                const allowed = newItems.slice(0, remaining);
                setTempSerials([...tempSerials, ...allowed]);
                toast.warning(`Bulk registration capped at ${orderedLimit}`, {
                    description: `Ignored ${newItems.length - remaining} extra items.`
                });
            } else {
                setTempSerials([...tempSerials, ...newItems]);
                toast.success(`Added ${newItems.length} serials`);
            }
        }

        if (duplicates.length > 0 || crossDuplicates.length > 0) {
            toast.warning(`${duplicates.length + crossDuplicates.length} serials ignored`, {
                description: `${duplicates.length} local duplicates, ${crossDuplicates.length} cross-product duplicates skipped.`
            });
        }

        setBulkSerials("");
        setIsBulkMode(false);
    };

    const removeSerial = (index: number) => {
        const item = tempSerials[index];
        setTempSerials(tempSerials.filter((_, i) => i !== index));
        toast.info("Serial Removed", {
            description: item.sn
        });
    };

    const saveSerials = () => {
        if (activePorId) {
            setSerialsByPorId(prev => ({ ...prev, [activePorId]: tempSerials }));
        }
        setSerialModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-1">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black px-1.5 py-0 text-[9px] uppercase tracking-tighter">Phase 03</Badge>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Manual Receipt</h1>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Register physical quantities</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">Total</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-black text-primary">{totalEntered}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">PCS</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">Items</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{filteredItems.length} Products</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-3 mt-4">
                <div className="flex items-center justify-between px-1 shrink-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <ListFilter className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Verified Feed</span>
                    </div>
                    <div className="h-px flex-1 mx-3 bg-linear-to-r from-slate-200 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-900" />
                </div>

                {(() => {
                    const rcvTotalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
                    const rcvStart = (receivingPage - 1) * ITEMS_PER_PAGE;
                    const rcvPageItems = filteredItems.slice(rcvStart, rcvStart + ITEMS_PER_PAGE);

                    return (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-2 py-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                                {rcvPageItems.map((it) => {
                                    const itemObj = it as Record<string, unknown>;
                                    const id = String(itemObj.id);
                                    const expected = Number(itemObj.expectedQty || 0);
                                    const receivedAtStart = Number(itemObj.receivedQty || 0);
                                    const currentEntry = manualCounts[id] || "";
                                    const currentEntryNum = Number(currentEntry || 0);

                                    const isOver = (currentEntryNum + receivedAtStart) > expected && currentEntryNum > 0;
                                    const progress = Math.min(100, ((receivedAtStart + currentEntryNum) / expected) * 100);
                                    const isComplete = (receivedAtStart + currentEntryNum) >= expected;

                                    return (
                                        <Card key={id} className={cn(
                                            "group relative overflow-hidden transition-all duration-200 border",
                                            isOver
                                                ? "border-red-500/40 bg-red-50/10 dark:bg-red-950/5 shadow-sm"
                                                : isComplete
                                                    ? "border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5"
                                                    : "border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:bg-slate-50/50"
                                        )}>
                                            <div className="py-1.5 px-3 flex flex-col md:flex-row items-center gap-4">
                                                {/* Product Info Section - Expanded */}
                                                <div className="flex-[2] min-w-0 flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform",
                                                        isOver ? "bg-red-100 text-red-600" : isComplete ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                                                    )}>
                                                        <Package className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 space-y-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-black text-xs uppercase tracking-tight truncate leading-none">{it.name}</h3>
                                                            {it.isExtra && <Badge className="text-[6px] bg-amber-500 text-white border-none px-1 h-3 font-black tracking-widest leading-none">EXTRA</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">SKU</span>
                                                            <span className="text-[9px] font-mono font-bold text-slate-400 leading-none">{it.barcode}</span>
                                                            <span className="h-2 w-px bg-slate-200 dark:bg-slate-800" />
                                                            <span className="text-[9px] font-black text-slate-400 truncate tracking-wide leading-none">{it.branchName}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quantity Details Section - Centered and Spaced */}
                                                <div className="flex flex-1 items-center justify-around px-4 border-l border-r border-slate-100 dark:border-slate-800">
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ordered</div>
                                                        <div className="text-base font-black text-slate-900 dark:text-white leading-none tabular-nums">{expected}</div>
                                                    </div>

                                                    <div className="flex flex-col gap-1 w-24">
                                                        <div className="flex justify-between items-end text-[7px] font-black uppercase tracking-widest leading-none">
                                                            <span className={isOver ? "text-red-500" : "text-slate-400"}>Progress</span>
                                                            <span className={isOver ? "text-red-500" : isComplete ? "text-emerald-500" : "text-primary"}>
                                                                {isOver ? "OVER" : isComplete ? "FULL" : `${progress.toFixed(0)}%`}
                                                            </span>
                                                        </div>
                                                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={cn(
                                                                    "h-full transition-all duration-700 ease-out",
                                                                    isOver ? "bg-red-500" : isComplete ? "bg-emerald-500" : "bg-primary"
                                                                )}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Interaction Section - More Prominent */}
                                                <div className="w-full md:w-40 shrink-0">
                                                    {it.isSerialized ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={cn(
                                                                "w-full h-8 rounded-lg border transition-all flex items-center justify-between px-3 group/btn",
                                                                currentEntryNum > 0
                                                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                                    : "border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5"
                                                            )}
                                                            onClick={() => openSerialModal(id, it.name)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <QrCode className={cn("w-3.5 h-3.5", currentEntryNum > 0 ? "text-primary" : "text-slate-400")} />
                                                                <span className="font-black text-[9px] uppercase tracking-[0.1em]">
                                                                    {currentEntryNum > 0 ? `${currentEntryNum} PCS` : "Register"}
                                                                </span>
                                                            </div>
                                                            <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", currentEntryNum > 0 ? "text-primary group-hover/btn:translate-x-1" : "text-slate-300")} />
                                                        </Button>
                                                    ) : (
                                                        <div className="relative group/input">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={currentEntry}
                                                                onChange={(e) => handleCountChange(id, e.target.value)}
                                                                className={cn(
                                                                    "h-8 w-full text-center font-black text-xs rounded-lg border transition-all shadow-sm px-8",
                                                                    isOver
                                                                        ? "border-red-500 bg-red-50 text-red-700"
                                                                        : "border-slate-200 dark:border-slate-800 focus-visible:border-primary focus-visible:ring-0"
                                                                )}
                                                            />
                                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover/input:opacity-60 transition-opacity">
                                                                <Package className="w-3.5 h-3.5" />
                                                            </div>
                                                            {isOver && (
                                                                <div className="absolute -top-4 left-0 right-0 text-center animate-pulse">
                                                                    <Badge className="bg-red-600 text-[6px] font-black h-3 px-1 border-none shadow-sm">OVER</Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>

                            {rcvTotalPages > 1 && (
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Page {receivingPage} of {rcvTotalPages}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={receivingPage === 1}
                                            onClick={() => setReceivingPage(p => Math.max(1, p - 1))}
                                            className="h-7 rounded-lg font-black uppercase text-[9px] tracking-widest px-3"
                                        >
                                            <ChevronLeft className="w-3 h-3 mr-1" /> Prev
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={receivingPage === rcvTotalPages}
                                            onClick={() => setReceivingPage(p => Math.min(rcvTotalPages, p + 1))}
                                            className="h-7 rounded-lg font-black uppercase text-[9px] tracking-widest px-3"
                                        >
                                            Next <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 mt-auto shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onBack}
                                    className="h-9 px-6 rounded-lg font-black uppercase tracking-wider text-[9px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Checklist
                                </Button>
                                <Button
                                    className="h-10 px-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-200"
                                    onClick={handleContinueClick}
                                >
                                    Continue to Review <ChevronRight className="ml-1.5 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* ✅ Verify Over Receiving Modal */}
            <AlertDialog open={isOverReceivingModalOpen} onOpenChange={setIsOverReceivingModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Over-Receiving Detected
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            One or more items exceed the expected ordered quantity.
                            <br /><br />
                            Are you sure you want to continue to the review step? The system will still allow you to save this, but it will be recorded as over-receiving.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Review Quantities</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setIsOverReceivingModalOpen(false); onContinue(); }} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                            Yes, Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ✅ Serial Registration Modal */}
            <Dialog open={serialModalOpen} onOpenChange={setSerialModalOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Registration</DialogTitle>
                                    <DialogDescription className="text-white/70 text-xs font-medium uppercase tracking-widest mt-0.5">Piece-by-Piece Verification</DialogDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className={cn(
                                "border-white/40 text-white font-mono bg-white/10 px-3 py-1",
                                tempSerials.length === orderedLimit && "bg-emerald-500/30 border-emerald-400"
                            )}>
                                {tempSerials.length} / {orderedLimit} REGISTERED
                            </Badge>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Current Product</span>
                                <span className="text-base font-bold text-slate-900 dark:text-white truncate">{activeProductName}</span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1 text-right">Items</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">{orderedLimit} Units</span>
                            </div>
                        </div>

                        {orderedLimit !== Infinity && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-end text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Registration Progress</span>
                                    <span className={tempSerials.length === orderedLimit ? "text-emerald-500" : "text-primary"}>
                                        {((tempSerials.length / orderedLimit) * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-500 ease-out",
                                            tempSerials.length === orderedLimit ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-primary"
                                        )}
                                        style={{ width: `${(tempSerials.length / orderedLimit) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {isBulkMode ? "Bulk Entry Mode" : "Scan Entry Mode"}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsBulkMode(!isBulkMode)}
                                    className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                                >
                                    {isBulkMode ? "Switch to Scanner" : "Switch to Bulk Paste"}
                                </Button>
                            </div>

                            {isBulkMode ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Default Tare (kg)</label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={newTare}
                                                onChange={(e) => setNewTare(e.target.value)}
                                                className="h-9 text-xs font-bold border-2 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Default Expiry</label>
                                            <Input
                                                type="date"
                                                value={newExpiry}
                                                onChange={(e) => setNewExpiry(e.target.value)}
                                                className="h-9 text-xs font-bold border-2 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        placeholder="Paste serial numbers here (separated by new lines or commas)..."
                                        className="w-full h-24 p-3 text-sm font-mono bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary transition-all resize-none"
                                        value={bulkSerials}
                                        onChange={(e) => setBulkSerials(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={() => setIsBulkMode(false)} variant="outline" className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                                        <Button onClick={addBulkSerials} className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">Add Serials</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tare Weight (kg)</label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={newTare}
                                                onChange={(e) => setNewTare(e.target.value)}
                                                className="h-9 text-xs font-bold border-2 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Expiry Date</label>
                                            <Input
                                                type="date"
                                                value={newExpiry}
                                                onChange={(e) => setNewExpiry(e.target.value)}
                                                className="h-9 text-xs font-bold border-2 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <Input
                                                ref={inputRef}
                                                value={newSerial}
                                                onChange={(e) => setNewSerial(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && addSerial()}
                                                disabled={tempSerials.length >= orderedLimit}
                                                placeholder={tempSerials.length >= orderedLimit ? "Limit Reached" : "Scan or type serial number..."}
                                                className={cn(
                                                    "h-12 px-4 rounded-xl font-mono text-sm border-2 transition-all shadow-sm",
                                                    tempSerials.length >= orderedLimit
                                                        ? "border-emerald-500/50 bg-emerald-50/10 cursor-not-allowed"
                                                        : "border-slate-200 dark:border-slate-800 focus-visible:ring-0 focus-visible:border-primary"
                                                )}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
                                                <kbd className="px-1.5 py-0.5 text-[9px] font-mono border rounded bg-muted">ENTER</kbd>
                                            </div>
                                        </div>
                                        <Button onClick={addSerial} size="icon" className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Registered Pieces</span>
                                {tempSerials.length > 0 && (
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setTempSerials([]);
                                            toast.info("Cleared all serials");
                                        }}
                                        className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600"
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            <div className="border border-slate-100 dark:border-slate-900 rounded-2xl overflow-hidden shadow-sm">
                                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                                    <Table>
                                        <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="h-9 text-[10px] font-black uppercase tracking-widest px-4">Serial Number</TableHead>
                                                <TableHead className="h-9 text-[10px] font-black uppercase tracking-widest text-center">Tare</TableHead>
                                                <TableHead className="h-9 text-[10px] font-black uppercase tracking-widest text-center">Expiry</TableHead>
                                                <TableHead className="h-9 w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tempSerials.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-slate-400 text-xs font-medium">
                                                        No serials registered yet
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                tempSerials.map((item, idx) => (
                                                    <TableRow key={idx} className="group border-slate-50 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                                        <TableCell className="py-2 px-4 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                            {item.sn}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-center font-bold text-[10px] text-slate-500">
                                                            {item.tareWeight || "-"}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-center font-bold text-[10px] text-slate-500">
                                                            {item.expiryDate || "-"}
                                                        </TableCell>
                                                        <TableCell className="py-2 px-2 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                                onClick={() => removeSerial(idx)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verification Status</span>
                            <span className="text-sm font-black text-primary uppercase italic">{tempSerials.length > 0 ? "Scanned" : "Awaiting Input"}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setSerialModalOpen(false)} className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px] h-11 border-2">Cancel</Button>
                            <Button onClick={saveSerials} className="rounded-xl px-10 font-black uppercase tracking-widest text-[10px] h-11 shadow-lg shadow-primary/30">Commit Pieces</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
