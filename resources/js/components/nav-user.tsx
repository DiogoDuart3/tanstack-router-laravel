import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { authApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    // Fetch user data for authentication
    const { data: userData } = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: authApi.getUser,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    const isAuthenticated = !!userData?.user;
    const user = userData?.user;

    // Don't render anything if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent">
                            <UserInfo user={user!} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                    >
                        <UserMenuContent user={user!} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
