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
    FiPackage,
    FiAlertTriangle,
    FiSlash,
    FiFilter,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Category = {
    id: number;
    name: string;
};

type Ingredient = {
    id: number;
    name: string;
    unit: string;
    stock: number;
};

type RecipeItem = {
    ingredient_id: number;
    ingredient?: Ingredient;
    quantity_required: number;
};

type Product = {
    id: number;
    name: string;
    sku: string;
    category_id: number;
    category: Category;
    stock: number;
    cost_price: number;
    selling_price: number;
    status: string;
    image_path: string | null;
    image_url: string | null;
    ingredients: (Ingredient & { pivot: { quantity_required: string } })[];
    created_at: string;
};

type Summary = {
    total_products: number;
    low_stock: number;
    out_of_stock: number;
};

export default function ProductsIndex() {
    const { products: rawProducts, categories, summary, filters, branches, currentBranchId, isAdmin } = usePage().props as any;
    const products: Product[] = rawProducts || [];
    const [search, setSearch] = useState(filters.search || '');
    const [filterCategory, setFilterCategory] = useState(filters.filter_category || '');

    // Branch filter handler
    const handleBranchFilter = (value: string) => {
        router.get('/products', {
            branch_id: value === 'all' ? '' : value,
            search,
            filter_category: filterCategory
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // --- Sync Logic ---
    const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'inventory-updated' || e.data.type === 'products-updated') {
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

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        sku: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        branch_id: currentBranchId ? String(currentBranchId) : '',
        recipe: [] as { ingredient_id: string; quantity_required: string }[],
    });

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCategory]);

    // Derived Paginated Data
    const filteredData = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = !filterCategory || product.category_id.toString() === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, search, filterCategory]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Handle Server-Side Search (Optional, we are doing client-side filtering now for speed)
    /*
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get('/products', { search, filter_category: filterCategory }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filterCategory]);
    */

    const openAddModal = () => {
        reset();
        setImageFile(null);
        setImagePreview(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setSelectedProduct(product);
        setData({
            name: product.name,
            sku: product.sku || '',
            category_id: product.category_id.toString(),
            cost_price: product.cost_price.toString(),
            selling_price: product.selling_price.toString(),
            recipe: product.ingredients.map(ing => ({
                ingredient_id: ing.id.toString(),
                quantity_required: ing.pivot.quantity_required.toString()
            })),
        });
        setImageFile(null);
        setImagePreview(product.image_url || null);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/products', {
            ...data,
            image: imageFile,
        } as any, {
            forceFormData: true,
            onSuccess: () => {
                setSearch('');
                setIsAddModalOpen(false);
                reset();
                stateChannel.postMessage({ type: 'products-updated' });
                setSuccessMessage({ title: 'Product Added!', message: 'The product has been registered successfully.' });
                setIsSuccessModalOpen(true);
                setImageFile(null);
                setImagePreview(null);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            router.post(`/products/${selectedProduct.id}`, {
                _method: 'PUT',
                ...data,
                image: imageFile,
            } as any, {
                forceFormData: true,
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    reset();
                    setImageFile(null);
                    setImagePreview(null);
                    setSuccessMessage({ title: 'Product Updated!', message: 'Changes have been saved successfully.' });
                    setIsSuccessModalOpen(true);
                },
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (selectedProduct) {
            destroy(`/products/${selectedProduct.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    stateChannel.postMessage({ type: 'products-updated' });
                    setSelectedProduct(null);
                },
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Stock': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'Low Stock': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'Out of Stock': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return '';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    };

    const addRecipeItem = () => {
        setData('recipe', [...data.recipe, { ingredient_id: '', quantity_required: '1' }]);
    };

    const removeRecipeItem = (index: number) => {
        const newRecipe = [...data.recipe];
        newRecipe.splice(index, 1);
        setData('recipe', newRecipe);
    };

    const updateRecipeItem = (index: number, field: string, value: string) => {
        const newRecipe = [...data.recipe];
        newRecipe[index] = { ...newRecipe[index], [field]: value };
        setData('recipe', newRecipe);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Products', href: '/products' }]}>
            <Head title="Products" />

            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 bg-background border-b flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                        <p className="text-sm text-muted-foreground">Manage your product inventory and pricing.</p>
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
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10 bg-muted/50 focus:bg-background transition-colors"
                            />
                        </div>
                        <Select
                            value={String(filterCategory)}
                            onValueChange={(val) => setFilterCategory(val === 'all' ? '' : val)}
                        >
                            <SelectTrigger className="w-full sm:w-48 h-10 bg-muted/50">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((c: any) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={openAddModal} className="h-10 gap-2 shadow-lg shadow-primary/20">
                            <FiPlus className="size-4" /> <span className="hidden lg:inline">Add Product</span>
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col gap-6">
                    {/* Summary Row */}
                    <div className="grid gap-4 md:grid-cols-3 flex-shrink-0">
                        <Card className="bg-primary/5 border-primary/20 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Products</CardTitle>
                                <FiPackage className="size-4 text-primary group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{summary.total_products}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Unique items in system</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Low Stock Items</CardTitle>
                                <FiAlertTriangle className="size-4 text-amber-500 group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-amber-600">{summary.low_stock}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Stock levels ≤ 5 units</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-destructive/5 border-destructive/20 shadow-sm group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</CardTitle>
                                <FiSlash className="size-4 text-destructive group-hover:scale-110 transition-transform" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-destructive">{summary.out_of_stock}</div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Items requiring restock</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Card */}
                    <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-none ring-1 ring-black/5 flex-shrink min-h-0">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-background border-b shadow-sm">
                                    <tr className="bg-muted/30">
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Product Information</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden lg:table-cell">Category</th>
                                        <th className="h-12 px-6 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Stock</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden sm:table-cell">Pricing</th>
                                        <th className="h-12 px-6 text-center align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Stock Status</th>
                                        <th className="h-12 px-6 text-left align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px] hidden md:table-cell">Created</th>
                                        <th className="h-12 px-6 text-right align-middle font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y relative">
                                    <AnimatePresence mode="popLayout">
                                        {paginatedData.length === 0 ? (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="h-32 text-center"
                                            >
                                                <td colSpan={7} className="text-muted-foreground italic">
                                                    No products found matching your criteria.
                                                </td>
                                            </motion.tr>
                                        ) : (
                                            paginatedData.map((product: Product) => (
                                                <motion.tr
                                                    key={product.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    className="border-b transition-colors hover:bg-muted/40 group"
                                                >
                                                    <td className="p-4 align-middle">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{product.name}</span>
                                                            <span className="text-xs text-muted-foreground font-mono">{product.sku || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle hidden lg:table-cell">
                                                        <Badge variant="outline" className="bg-primary/5 border-primary/10">
                                                            {product.category?.name || 'Uncategorized'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <span className={cn(
                                                            "font-mono font-bold",
                                                            product.stock <= 0 ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : ""
                                                        )}>
                                                            {product.stock} units
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle hidden sm:table-cell">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Cost: {formatCurrency(product.cost_price)}</span>
                                                            <span className="text-sm font-bold text-emerald-600">Sell: {formatCurrency(product.selling_price)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <Badge variant="outline" className={cn("px-2 py-0.5 whitespace-nowrap", getStatusColor(product.status))}>
                                                            {product.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle hidden md:table-cell text-muted-foreground">
                                                        {format(new Date(product.created_at), 'MMM d, yyyy')}
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditModal(product)}
                                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <FiEdit2 className="size-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openDeleteModal(product)}
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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

                        {/* Pagination Controls */}
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
                                    {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} products
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

            {/* Success Modal */}
            <ResultModal
                open={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                type="success"
                title={successMessage.title}
                message={successMessage.message}
            />

            {/* Modals */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                            Enter product details and initial stock levels.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input required maxLength={50} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Product Name" />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SKU</label>
                                <Input value={data.sku} onChange={(e) => setData('sku', e.target.value)} placeholder="Optional" />
                                {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <select
                                    required
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 ring-primary/20 transition-all"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c: Category) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cost Price</label>
                                <Input type="number" min={1} step="0.01" required value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} placeholder="0.00" />
                                {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Selling Price</label>
                                <Input type="number" min={1} step="0.01" required value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} placeholder="0.00" />
                                {errors.selling_price && <p className="text-xs text-destructive">{errors.selling_price}</p>}
                            </div>
                            {/* Product Image Upload */}
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium">Product Image <span className="text-muted-foreground text-xs">(Optional, max 2MB)</span></label>
                                {imagePreview && (
                                    <div className="relative w-full h-28 rounded-lg overflow-hidden border bg-muted/30">
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
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex flex-col">
                                        <label className="text-sm font-bold">Recipe Composition</label>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Define required materials for production</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-8 text-xs gap-1 shadow-sm hover:bg-primary/5">
                                        <FiPlus className="size-3 text-primary" /> Add Ingredient
                                    </Button>
                                </div>

                                <div className="space-y-3 max-h-[350px] overflow-y-auto p-1 pr-2 mt-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                    {data.recipe.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-destructive/5 border border-dashed border-destructive/20">
                                            <FiSlash className="size-8 text-destructive/30 mb-2" />
                                            <p className="text-sm font-bold text-destructive italic tracking-tight">
                                                NO INGREDIENTS REGISTERED.
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase">This product will be unavailable for sale (0 stock)</p>
                                        </div>
                                    )}
                                    {data.recipe.map((item, idx) => {
                                        const selectedIng = (usePage().props as any).ingredients.find((ing: Ingredient) => ing.id.toString() === item.ingredient_id);
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={idx}
                                                className="grid grid-cols-12 gap-2 items-end bg-background p-3 rounded-xl border border-muted ring-offset-background focus-within:ring-2 focus-within:ring-primary/10 transition-all"
                                            >
                                                <div className="col-span-7 space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Material</label>
                                                    <select
                                                        required
                                                        value={item.ingredient_id}
                                                        onChange={(e) => updateRecipeItem(idx, 'ingredient_id', e.target.value)}
                                                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-xs focus:bg-background focus:outline-none focus:ring-1 ring-primary/20 transition-all appearance-none"
                                                    >
                                                        <option value="">-- Choose Ingredient --</option>
                                                        {(usePage().props as any).ingredients.map((ing: Ingredient) => {
                                                            const isTaken = data.recipe.some((r, rIdx) => r.ingredient_id === ing.id.toString() && rIdx !== idx);
                                                            return (
                                                                <option key={ing.id} value={ing.id} disabled={isTaken}>
                                                                    {ing.name} {isTaken ? '(Already added)' : `(${ing.unit})`}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                                <div className="col-span-3 space-y-1.5 px-1">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Qty</label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            step="0.0001"
                                                            required
                                                            value={item.quantity_required}
                                                            onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                            className="h-10 text-xs font-bold pl-3 pr-8 bg-muted/30 focus:bg-background rounded-lg border-input"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase">
                                                            {selectedIng?.unit || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 flex justify-end pb-1 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRecipeItem(idx)}
                                                        className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-lg"
                                                    >
                                                        <FiTrash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                {errors.recipe && <p className="text-xs text-destructive font-bold mt-2 px-2">⚠ {errors.recipe}</p>}
                            </div>
                        </div>
                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-xl h-12 font-bold text-muted-foreground">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={processing || data.recipe.length === 0}
                                className="rounded-xl h-12 flex-1 bg-primary shadow-lg shadow-primary/20 font-bold active:scale-95 transition-all"
                            >
                                {processing ? 'Processing...' : 'Confirm Registration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Product Modal (Synced for scalability) */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter">REVISE PRODUCT.</DialogTitle>
                        <DialogDescription className="font-medium">Modify existing product specifications and ingredients.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Product Name</label>
                                <Input required value={data.name} onChange={(e) => setData('name', e.target.value)} className="h-12 rounded-xl bg-muted/30" />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Identifier (SKU)</label>
                                <Input value={data.sku} onChange={(e) => setData('sku', e.target.value)} className="h-12 rounded-xl bg-muted/30" />
                                {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Category</label>
                                <select
                                    required
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value)}
                                    className="w-full h-12 px-3 rounded-xl border border-input bg-muted/30 text-sm focus:outline-none focus:ring-2 ring-primary/20 transition-all appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c: Category) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Cost (PHP)</label>
                                <Input type="number" step="0.01" required value={data.cost_price} onChange={(e) => setData('cost_price', e.target.value)} className="h-12 rounded-xl bg-muted/30 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Selling (PHP)</label>
                                <Input type="number" step="0.01" required value={data.selling_price} onChange={(e) => setData('selling_price', e.target.value)} className="h-12 rounded-xl bg-muted/30 font-bold text-emerald-600" />
                            </div>

                            {/* Product Image Upload */}
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Product Image <span className="font-normal">(Optional, max 2MB)</span></label>
                                {imagePreview && (
                                    <div className="relative w-full h-28 rounded-xl overflow-hidden border bg-muted/30">
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
                                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all border border-input rounded-xl p-2 bg-muted/30"
                                />
                            </div>

                            <div className="col-span-2 border-t pt-4 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex flex-col">
                                        <label className="text-sm font-bold">Recipe Composition</label>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Update required materials</p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} className="h-8 text-xs gap-1 shadow-sm hover:bg-primary/5">
                                        <FiPlus className="size-3 text-primary" /> Add Ingredient
                                    </Button>
                                </div>

                                <div className="space-y-3 max-h-[350px] overflow-y-auto p-1 pr-2 mt-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                    {data.recipe.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-destructive/5 border border-dashed border-destructive/20">
                                            <FiSlash className="size-8 text-destructive/30 mb-2" />
                                            <p className="text-sm font-bold text-destructive italic tracking-tight">
                                                NO INGREDIENTS REGISTERED.
                                            </p>
                                        </div>
                                    )}
                                    {data.recipe.map((item, idx) => {
                                        const selectedIng = (usePage().props as any).ingredients.find((ing: Ingredient) => ing.id.toString() === item.ingredient_id);
                                        return (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                key={idx}
                                                className="grid grid-cols-12 gap-2 items-end bg-background p-3 rounded-xl border border-muted"
                                            >
                                                <div className="col-span-7 space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Select Material</label>
                                                    <select
                                                        required
                                                        value={item.ingredient_id}
                                                        onChange={(e) => updateRecipeItem(idx, 'ingredient_id', e.target.value)}
                                                        className="w-full h-10 px-3 rounded-lg border border-input bg-muted/30 text-xs focus:bg-background focus:outline-none focus:ring-1 ring-primary/20 transition-all appearance-none"
                                                    >
                                                        <option value="">-- Choose Ingredient --</option>
                                                        {(usePage().props as any).ingredients.map((ing: Ingredient) => {
                                                            const isTaken = data.recipe.some((r, rIdx) => r.ingredient_id === ing.id.toString() && rIdx !== idx);
                                                            return (
                                                                <option key={ing.id} value={ing.id} disabled={isTaken}>
                                                                    {ing.name} {isTaken ? '(Already added)' : `(${ing.unit})`}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                                <div className="col-span-3 space-y-1.5">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Qty</label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            step="0.0001"
                                                            required
                                                            value={item.quantity_required}
                                                            onChange={(e) => updateRecipeItem(idx, 'quantity_required', e.target.value)}
                                                            className="h-10 text-xs font-bold bg-muted/30 focus:bg-background rounded-lg border-input"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-muted-foreground uppercase">
                                                            {selectedIng?.unit || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 flex justify-end pb-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRecipeItem(idx)}
                                                        className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-lg"
                                                    >
                                                        <FiTrash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                {errors.recipe && <p className="text-xs text-destructive font-bold mt-2 px-2">⚠ {errors.recipe}</p>}
                            </div>
                        </div>
                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-12 font-bold text-muted-foreground">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={processing || data.recipe.length === 0}
                                className="rounded-xl h-12 flex-1 bg-primary font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                            >
                                {processing ? 'Updating...' : 'Push Updates'}
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
                            <FiTrash2 className="size-5" /> Delete Product
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-base">
                            Are you sure you want to delete <span className="font-bold text-foreground">"{selectedProduct?.name}"</span>?
                            This will also remove all associated inventory logs.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-6">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>No, keep it</Button>
                        <Button variant="destructive" onClick={handleDeleteSubmit} disabled={processing}>Yes, delete product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout >
    );
}
