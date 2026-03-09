import { Head, usePage, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import React, { useState, useMemo, useEffect } from 'react';
import { ResultModal } from '@/components/result-modal';
import type { BreadcrumbItem } from '@/types';
import {
  FiPackage,
  FiAlertTriangle,
  FiSlash,
  FiSearch,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiFilter,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiChevronDown,
  FiChevronRight,
  FiMoreHorizontal,
  FiChevronLeft,
  FiEdit2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory', href: '/dashboard' },
];

type Ingredient = {
  id: number;
  name: string;
  stock: number;
  unit: string;
  branch_id?: number;
  low_stock_level?: number;
  is_low_stock?: boolean;
};

// --- Animated Counter Component ---
const AnimatedCounter = ({ value, color }: { value: number; color: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    let totalDuration = 1000;
    let incrementTime = Math.max(10, Math.floor(totalDuration / (end || 1)));

    let timer = setInterval(() => {
      start += Math.ceil(end / 100) || 1;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={cn("text-4xl font-black tracking-tighter leading-none", color)}>
      {displayValue}
    </span>
  );
};

export default function InventoryIndex() {
  const { inventory: rawInventory, branches, currentBranchId, isAdmin } = usePage().props as any;
  const inventory: Ingredient[] = rawInventory || [];

  // Branch filter handler
  const handleBranchFilter = (value: string) => {
    router.get('/inventory', { branch_id: value === 'all' ? '' : value }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // --- Sync Channel ---
  const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'inventory-updated' || e.data.type === 'products-updated') {
        router.reload({ only: ['inventory'] });
      }
    };
    stateChannel.addEventListener('message', handleMessage);

    const handleFocus = () => {
      router.reload({ only: ['inventory'] });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      stateChannel.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [stateChannel]);

  // --- Scalability States ---
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success', title: '', message: '',
  });
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
    name: '',
    unit: 'pcs',
    stock: '0',
    low_stock_level: '5',
    branch_id: currentBranchId ? String(currentBranchId) : '',
  });

  // --- Stats Calculations ---
  const stats = useMemo(() => {
    const total = inventory.length;
    const low = inventory.filter(i => i.is_low_stock && i.stock > 0).length;
    const out = inventory.filter(i => i.stock <= 0).length;
    return { total, low, out };
  }, [inventory]);

  // --- Filtered & Sorted Data ---
  const filteredData = useMemo(() => {
    return inventory
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchesUnit = filterUnit === 'all' || item.unit === filterUnit;
        return matchesSearch && matchesUnit;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy as keyof Ingredient];
        let valB: any = b[sortBy as keyof Ingredient];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [inventory, search, filterUnit, sortBy, sortOrder]);

  // --- Pagination Logic ---
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRowId(null);
  }, [search, filterUnit]);

  // --- Handlers ---
  const handleAdd = () => {
    reset();
    setIsAddModalOpen(true);
  };

  const handleEdit = (item: Ingredient) => {
    setSelectedIngredient(item);
    setData({
      name: item.name,
      unit: item.unit,
      stock: String(item.stock),
      low_stock_level: String(item.low_stock_level ?? 5),
      branch_id: item.branch_id ? String(item.branch_id) : '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: Ingredient) => {
    setSelectedIngredient(item);
    setIsDeleteModalOpen(true);
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/inventory', {
      name: data.name,
      unit: data.unit,
      initial_stock: Number(data.stock),
      low_stock_level: Number(data.low_stock_level),
      branch_id: data.branch_id ? Number(data.branch_id) : undefined,
    }, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
        stateChannel.postMessage({ type: 'inventory-updated' });
        setResultModal({ type: 'success', title: 'Material Added', message: 'The new ingredient has been added to inventory.' });
        setIsResultModalOpen(true);
      }
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    router.put(`/inventory/${selectedIngredient?.id}`, {
      name: data.name,
      unit: data.unit,
      stock: Number(data.stock),
      low_stock_level: Number(data.low_stock_level),
    }, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        reset();
        stateChannel.postMessage({ type: 'inventory-updated' });
        setResultModal({ type: 'success', title: 'Material Updated', message: 'Ingredient levels and details have been updated.' });
        setIsResultModalOpen(true);
      }
    });
  };

  const submitDelete = () => {
    destroy(`/inventory/${selectedIngredient?.id}`, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        stateChannel.postMessage({ type: 'inventory-updated' });
        setResultModal({ type: 'success', title: 'Material Deleted', message: 'The ingredient record has been removed.' });
        setIsResultModalOpen(true);
      }
    });
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory Catalog" />
      <TooltipProvider>
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inventory Catalog</h1>
              <p className="text-sm text-muted-foreground">Manage raw ingredients and track stock levels in real-time.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                  <Select
                    value={currentBranchId ? String(currentBranchId) : 'all'}
                    onValueChange={handleBranchFilter}
                  >
                    <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/50">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches?.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors"
                />
              </div>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-full sm:w-32 h-10 bg-muted/50">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="liters">liters</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} className="h-10 gap-2 shadow-lg shadow-primary/20">
                <FiPlus className="size-4" /> <span className="hidden sm:inline">Add Material</span>
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col gap-6">
            {/* Summary Row */}
            <div className="grid gap-4 md:grid-cols-3 flex-shrink-0">
              <Card className="bg-primary/5 border-primary/20 shadow-sm group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Ingredients</CardTitle>
                  <FiPackage className="size-4 text-primary group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{stats.total}</div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Registered in system</p>
                </CardContent>
              </Card>

              <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Items</CardTitle>
                  <FiAlertTriangle className="size-4 text-amber-500 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-amber-600">{stats.low}</div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Requires attention</p>
                </CardContent>
              </Card>

              <Card className="bg-destructive/5 border-destructive/20 shadow-sm group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</CardTitle>
                  <FiSlash className="size-4 text-destructive group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-destructive">{stats.out}</div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Units depleted</p>
                </CardContent>
              </Card>
            </div>

            {/* Table Card */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-none ring-1 ring-black/5 flex-shrink min-h-0">
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 transition-colors">
                      <th className="h-12 px-4 w-10"></th>
                      {[
                        { label: 'Material Name', key: 'name' },
                        { label: 'Unit Type', key: 'unit' },
                        { label: 'Current Stock', key: 'stock' },
                        { label: 'Status', key: null },
                        { label: 'Actions', key: null },
                      ].map((col, idx) => (
                        <th key={idx} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          {col.key ? (
                            <button
                              onClick={() => toggleSort(col.key)}
                              className="flex items-center gap-2 hover:text-foreground transition-colors group"
                            >
                              {col.label}
                              {sortBy === col.key ? (
                                sortOrder === 'asc' ? <FiArrowUp className="text-blue-500 size-3" /> : <FiArrowDown className="text-blue-500 size-3" />
                              ) : (
                                <FiArrowUp className="opacity-0 group-hover:opacity-30 size-3" />
                              )}
                            </button>
                          ) : col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                    <tbody className="[&_tr:last-child]:border-0 divide-y divide-muted/50">
                      <AnimatePresence>
                        {paginatedData.length === 0 ? (
                          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <td colSpan={6} className="p-20 text-center text-muted-foreground italic text-lg">
                              No items matching your criteria.
                            </td>
                          </motion.tr>
                        ) : (
                          paginatedData.flatMap((item) => {
                            const mainRow = (
                              <motion.tr
                                key={`row-${item.id}`}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={cn(
                                  "border-b transition-colors hover:bg-muted/40 group cursor-pointer",
                                  expandedRowId === item.id ? "bg-primary/5" : ""
                                )}
                                onClick={() => toggleExpand(item.id)}
                              >
                                <td className="p-4 align-middle text-center">
                                  {expandedRowId === item.id ? <FiChevronDown className="text-primary size-4" /> : <FiChevronRight className="text-muted-foreground/30 size-4" />}
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-xs shadow-inner">
                                      {item.name.charAt(0)}
                                    </div>
                                    <span className="font-semibold">{item.name}</span>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <Badge variant="outline" className="bg-primary/5 border-primary/10 text-[10px] font-bold">
                                    {item.unit}
                                  </Badge>
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-sm">
                                      {Number(item.stock).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{item.unit}</span>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="flex justify-start">
                                    {item.stock <= 0 ? (
                                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold">
                                        Out of Stock
                                      </Badge>
                                    ) : item.is_low_stock ? (
                                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                                        ⚠ Low Stock
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                                        In Stock
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 align-middle text-right">
                                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <FiEdit2 className="size-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="p-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                      <FiTrash2 className="size-4" />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            );

                            const expandedRow = expandedRowId === item.id && (
                              <motion.tr
                                key={`expand-${item.id}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-muted/30"
                              >
                                <td colSpan={6} className="p-0 overflow-hidden">
                                  <div className="px-12 py-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-dashed border-primary/20">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Internal Designation</span>
                                      <span className="font-mono text-xs font-semibold bg-background px-2 py-1 rounded border border-muted-foreground/10 w-fit">#ING-{item.id.toString().padStart(4, '0')}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Stock Health</span>
                                      <span className={cn("text-xs font-bold flex items-center gap-2", item.stock > 10 ? "text-emerald-600" : "text-amber-600")}>
                                        <div className={cn("size-2 rounded-full", item.stock > 10 ? "bg-emerald-500" : "bg-amber-500")} />
                                        {(item.stock / 100 * 100).toFixed(1)}% Measured Volume
                                      </span>
                                    </div>
                                    <div className="flex justify-end">
                                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="h-8 font-bold text-xs gap-2">
                                        <FiEdit2 className="size-3" /> Update Record
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            );

                            return [mainRow, expandedRow].filter(Boolean);
                          })
                        )}
                      </AnimatePresence>
                    </tbody>

                </table>
              </div>
              {/* --- Synced Pagination --- */}
              <div className="p-4 bg-muted/5 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Show</span>
                    <Select value={String(itemsPerPage)} onValueChange={(val) => {
                      setItemsPerPage(Number(val));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-[70px] h-8 rounded-lg border-none bg-background shadow-sm font-bold text-xs ring-1 ring-muted">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-none shadow-2xl min-w-[70px]">
                        {[5, 10, 25, 50, 100].map(val => (
                          <SelectItem key={val} value={String(val)} className="text-xs">{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                    {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} entries
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="rounded-lg h-9 w-9 ring-1 ring-muted"
                  >
                    <FiChevronLeft className="size-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 3 + i + 1;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      if (pageNum <= 0) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'ghost'}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "h-9 w-9 rounded-lg font-bold text-[10px] transition-all",
                            currentPage === pageNum ? "bg-primary shadow-lg shadow-primary/20 text-white" : "hover:bg-muted"
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="rounded-lg h-9 w-9 ring-1 ring-muted"
                  >
                    <FiChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </TooltipProvider>

      {/* Result Modal */}
      <ResultModal
        open={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
      />

      {/* Synced Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? 'Edit Material' : 'Add New Material'}</DialogTitle>
            <DialogDescription>
              {isEditModalOpen ? 'Update material details and stock level.' : 'Register a new raw material into the inventory system.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? submitEdit : submitAdd} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Material Name</label>
              <Input
                required
                maxLength={30}
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="e.g. Hokkaido Flour"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Type</label>
                <Select value={data.unit} onValueChange={(val) => setData('unit', val)}>
                  <SelectTrigger className="w-full h-9 border-muted-foreground/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg (Kilogram)</SelectItem>
                    <SelectItem value="g">g (Gram)</SelectItem>
                    <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                    <SelectItem value="liters">liters (Liters)</SelectItem>
                    <SelectItem value="ml">ml (Milliliter)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{isEditModalOpen ? 'Adjust Stock' : 'Initial Stock'}</label>
                <Input
                min={1}
                  type="number"
                  step="0.0001"
                  required
                  value={data.stock}
                  onChange={(e) => setData('stock', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Low Stock Alert Level</label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={data.low_stock_level}
                onChange={(e) => setData('low_stock_level', e.target.value)}
                placeholder="e.g. 5"
              />
              <p className="text-[10px] text-muted-foreground">Send alert when stock falls at or below this level</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
              <Button type="submit" disabled={processing}>
                {isEditModalOpen ? 'Update Material' : 'Save Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Synced Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <FiTrash2 className="size-5" /> Delete Material
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Are you sure you want to delete <span className="font-bold text-foreground">"{selectedIngredient?.name}"</span>?
              This may affect recipes that use this ingredient.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-6">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>No, keep it</Button>
            <Button variant="destructive" onClick={submitDelete} disabled={processing}>Yes, delete material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
