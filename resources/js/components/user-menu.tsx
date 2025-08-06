import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authApi } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

export default function UserMenu() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const userQuery = useQuery({
        queryKey: ['user'],
        queryFn: authApi.getUser,
        retry: false,
    });

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

    const isAuthenticated = !!localStorage.getItem('auth_token') && !userQuery.error;
    const user = userQuery.data?.user;
    const handleLogout = () => {
        logoutMutation.mutate();
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center space-x-2">
                <Link to="/auth/login">
                    <Button variant="ghost" size="sm">
                        Sign In
                    </Button>
                </Link>
                <Link to="/auth/register">
                    <Button size="sm">Sign Up</Button>
                </Link>
            </div>
        );
    }

    if (userQuery.isLoading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex max-w-[120px] items-center gap-2 truncate text-sm md:max-w-none md:text-base">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-medium text-primary">{getUserInitials(user?.name || 'User')}</span>
                    </div>
                    <span className="truncate">{user?.name || 'User'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-card md:w-56" align="end">
                <DropdownMenuLabel className="text-sm md:text-base">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm break-all md:text-base">{user?.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex cursor-pointer items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="flex w-full items-center gap-2 text-sm md:text-base"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                    >
                        <LogOut className="h-4 w-4" />
                        {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
