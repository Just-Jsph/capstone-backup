import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMail, FiMapPin } from 'react-icons/fi';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmployeeIndex({ employees, branches }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        branch_id: '' as string | number,
    });

    const openCreateModal = () => {
        setEditingEmployee(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (employee: any) => {
        setEditingEmployee(employee);
        setData({
            name: employee.name,
            email: employee.email,
            password: '',
            role: employee.role,
            branch_id: employee.branch_id ?? '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEmployee) {
            put(`/employees/${editingEmployee.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post('/employees', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            destroy(`/employees/${id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Employees', href: '/employees' }]}>
            <Head title="Employee Management" />

            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                        <p className="text-muted-foreground">Manage your staff accounts and permissions.</p>
                    </div>
                    <Button onClick={openCreateModal} className="gap-2">
                        <FiPlus /> Add Employee
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((employee: any) => (
                        <Card key={employee.id} className="border-none shadow-md bg-white/50 backdrop-blur-sm overflow-hidden group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                        <FiUser className="size-6 text-primary" />
                                    </div>
                                    <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                        {employee.role}
                                    </Badge>
                                </div>

                                <h3 className="text-lg font-bold truncate">{employee.name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <FiMail className="size-3" /> {employee.email}
                                </p>
                                {employee.branch && (
                                    <p className="text-xs text-primary font-medium flex items-center gap-1 mt-1 mb-4">
                                        <FiMapPin className="size-3" /> {employee.branch.name}
                                    </p>
                                )}
                                {!employee.branch && <div className="mb-4" />}

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => openEditModal(employee)}>
                                        <FiEdit2 className="size-3" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(employee.id)}>
                                        <FiTrash2 className="size-3" /> Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                        <DialogDescription>
                            {editingEmployee ? 'Update account details for this employee.' : 'Create a new staff account.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                            <Input
                                placeholder="Ex. John Doe"
                                className="h-11 rounded-xl"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                            <Input
                                type="email"
                                placeholder="john@example.com"
                                className="h-11 rounded-xl"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                Password {editingEmployee && '(Leave blank to keep current)'}
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-11 rounded-xl"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Role</label>
                            <Select value={data.role} onValueChange={(val) => setData('role', val)}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="cashier">Cashier</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Branch</label>
                            <Select
                                value={data.branch_id ? String(data.branch_id) : ''}
                                onValueChange={(val) => setData('branch_id', val ? Number(val) : '')}
                            >
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((b: any) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(errors as any).branch_id && <p className="text-xs text-destructive">{(errors as any).branch_id}</p>}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="h-11 rounded-xl px-8 font-bold" disabled={processing}>
                                {editingEmployee ? 'Update Account' : 'Create Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}


