import {
    BookOpen,
    Folder,
    LayoutGrid,
    Box,
    Users,
    User as UserIcon,
    ShoppingCart,
    Archive,
    ClipboardList,
    BarChart2,
    Database,
    CarTaxiFront,
    Truck,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, User } from '@/types';
import AppLogo from './app-logo';
import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { Link } from '@inertiajs/react';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {

        title: 'Pos',
        href: '/pos',
        icon: Database,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Box,
    },
    {
        title: 'Suppliers',
        href: '/suppliers',
        icon: Users,
    },
    {
        title: 'Categories',
        href: '/categories',
        icon: Archive,
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: UserIcon,
    },
    {
        title: 'Sales',
        href: '/sales',
        icon: ShoppingCart,
    },
    {
        title: 'Inventory',
        href: '/inventory',
        icon: ClipboardList,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart2,
    },
    {
        title: 'Delivery',
        href: '/delivery',
        icon: Truck,
    },
    {
        title: 'Employees',
        href: '/employees',
        icon: Users,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user: User } };
    const user = auth.user;

    const filteredNavItems = useMemo(() => {
        if (user.role === 'admin') {
            return mainNavItems.filter(item => item.title !== 'Pos');
        }

        // Cashier restricted items (only hide: Dashboard, Suppliers, Delivery, Employees)
        const restrictedTitles = ['Dashboard', 'Suppliers', 'Delivery', 'Employees'];
        return mainNavItems.filter(item => !restrictedTitles.includes(item.title));
    }, [user.role]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={user.role === 'admin' ? '/dashboard' : '/pos'}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
