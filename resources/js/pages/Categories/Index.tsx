import { Head, usePage, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ResultModal } from '@/components/result-modal';
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiLayers,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Category = {
  id: number;
  name: string;
  description: string;
  image_path: string | null;
  image_url: string | null;
  products_count: number;
  created_at: string;
};

type Summary = {
  total_categories: number;
};

export default function CategoriesIndex() {
  const { categories: rawCategories, summary, filters, branches, currentBranchId, isAdmin } = usePage().props as any;
  const categories: Category[] = rawCategories || [];

  // Branch filter handler
  const handleBranchFilter = (value: string) => {
    router.get('/categories', {
      branch_id: value === 'all' ? '' : value,
      search: search
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // --- Sync Logic ---
  const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'categories-updated' || e.data.type === 'products-updated') {
        router.reload();
      }
    };
    stateChannel.addEventListener('message', handleMessage);

    const handleFocus = () => {
      router.reload();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      stateChannel.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [stateChannel]);
  const [search, setSearch] = useState(filters.search || '');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModal, setResultModal] = useState<{ type: 'success' | 'error'; title: string; message: string }>({
    type: 'success', title: '', message: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
    name: '',
    description: '',
    branch_id: currentBranchId ? String(currentBranchId) : '',
  });

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Derived Paginated Data
  const filteredData = useMemo(() => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(search.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [categories, search]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Handle Search (Client-side now)
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      router.get('/categories', { search }, { preserveState: true, replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  */

  const openAddModal = () => {
    reset();
    setImageFile(null);
    setImagePreview(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setData({
      name: category.name,
      description: category.description,
    });
    setImageFile(null);
    setImagePreview(category.image_url || null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/categories', {
      name: data.name,
      description: data.description,
      image: imageFile,
    } as any, {
      forceFormData: true,
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
        setImageFile(null);
        setImagePreview(null);
        stateChannel.postMessage({ type: 'categories-updated' });
        setResultModal({ type: 'success', title: 'Category Created', message: 'The new category has been added successfully.' });
        setIsResultModalOpen(true);
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      router.post(`/categories/${selectedCategory.id}`, {
        _method: 'PUT',
        name: data.name,
        description: data.description,
        image: imageFile,
      } as any, {
        forceFormData: true,
        onSuccess: () => {
          setIsEditModalOpen(false);
          reset();
          setImageFile(null);
          setImagePreview(null);
          stateChannel.postMessage({ type: 'categories-updated' });
          setResultModal({ type: 'success', title: 'Category Updated', message: 'Category details have been updated.' });
          setIsResultModalOpen(true);
        },
      });
    }
  };

  const handleDeleteSubmit = () => {
    if (selectedCategory) {
      destroy(`/categories/${selectedCategory.id}`, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
          stateChannel.postMessage({ type: 'categories-updated' });
          setResultModal({ type: 'success', title: 'Category Deleted', message: 'The category has been removed.' });
          setIsResultModalOpen(true);
        },
      });
    }
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
      <Head title="Categories" />

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
            <p className="text-sm text-muted-foreground">Manage your product categories and descriptions.</p>
          </div>
          <div className="flex items-center gap-3">
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
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors"
              />
            </div>
            <Button onClick={openAddModal} className="h-10 gap-2 shadow-lg shadow-primary/20">
              <FiPlus className="size-4" /> <span className="hidden sm:inline">Add Category</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col gap-6">
          {/* Summary Row */}
          <div className="grid gap-4 md:grid-cols-4 flex-shrink-0">
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Categories</CardTitle>
                <FiLayers className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{summary.total_categories}</div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Active in system</p>
              </CardContent>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-none ring-1 ring-black/5 flex-shrink min-h-0">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background border-b shadow-sm">
                  <tr className="bg-muted/30">
                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Category</th>
                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden md:table-cell">Description</th>
                    <th className="h-12 px-6 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Products</th>
                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden sm:table-cell">Created Date</th>
                    <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Status</th>
                    <th className="h-12 px-6 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <AnimatePresence mode="popLayout">
                    {paginatedData.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-24"
                      >
                        <td colSpan={6} className="p-8 text-center text-muted-foreground italic font-medium">
                          No categories found matching your criteria.
                        </td>
                      </motion.tr>
                    ) : (
                      paginatedData.map((category: Category) => (
                        <motion.tr
                          key={category.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-muted/50 transition-colors group"
                        >
                          <td className="p-4 px-6 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden border">
                                {category.image_url ? (
                                  <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FiLayers className="size-4 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-foreground">{category.name}</span>
                            </div>
                          </td>
                          <td className="p-4 px-6 align-middle text-muted-foreground hidden md:table-cell max-w-[300px] truncate font-medium">
                            {category.description || 'No description provided'}
                          </td>
                          <td className="p-4 px-6 align-middle text-center">
                            <Badge variant="secondary" className="font-mono text-[10px] font-black bg-primary/10 text-primary border-none rounded-md px-2 py-0.5">
                              {category.products_count}
                            </Badge>
                          </td>
                          <td className="p-4 px-6 align-middle text-muted-foreground hidden sm:table-cell text-xs font-medium uppercase tracking-tight">
                            {format(new Date(category.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="p-4 px-6 align-middle text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 text-emerald-600">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </td>
                          <td className="p-4 px-6 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(category)}
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              >
                                <FiEdit2 className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteModal(category)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                              >
                                <FiTrash2 className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Sticky Pagination Bar */}
            <div className="px-6 py-4 bg-background border-t flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0 z-10">
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

        {/* Result Modal */}
        <ResultModal
          open={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
        />

        {/* Add Category Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your products.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  required
                  maxLength={40}
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g., Electronics, Personal Care"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                maxLength={300}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Brief description of the category"
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Image <span className="text-muted-foreground text-xs">(Optional, max 2MB)</span></label>
                {imagePreview && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted/30">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 bg-destructive text-white rounded-full size-6 flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all border border-input rounded-lg p-2 bg-background"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  Save Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Category Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update category details and settings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  required
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Image <span className="text-muted-foreground text-xs">(Optional, max 2MB)</span></label>
                {imagePreview && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted/30">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 bg-destructive text-white rounded-full size-6 flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImageFile(file);
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all border border-input rounded-lg p-2 bg-background"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  Update Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <FiTrash2 className="size-5" /> Delete Category
              </DialogTitle>
              <DialogDescription className="pt-2 text-base">
                Are you sure you want to delete <span className="font-bold text-foreground">"{selectedCategory?.name}"</span>?
                This action cannot be undone and may affect products in this category.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-6">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                No, keep it
              </Button>
              <Button variant="destructive" onClick={handleDeleteSubmit} disabled={processing}>
                Yes, delete category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
