import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { authApi } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { type User } from '@/types';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            localStorage.removeItem('auth_token');
            queryClient.clear();
            toast.success('Logged out successfully');
            navigate({ to: '/auth/login' });
        },
        onError: (error) => {
            toast.error(`Logout failed: ${error.message}`);
        },
    });

    const handleLogout = () => {
        cleanup();
        logoutMutation.mutate();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" to="/profile" onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="mr-2" />
                {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
        </>
    );
}
