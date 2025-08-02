import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authApi } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";

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
          <Button size="sm">
            Sign Up
          </Button>
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
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-sm md:text-base max-w-[120px] md:max-w-none truncate flex items-center gap-2"
        >
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {getUserInitials(user?.name || 'User')}
            </span>
          </div>
          <span className="truncate">{user?.name || 'User'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card w-48 md:w-56" align="end">
        <DropdownMenuLabel className="text-sm md:text-base">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-sm md:text-base break-all">
          {user?.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/go/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Button
            variant="destructive"
            size="sm"
            className="w-full text-sm md:text-base flex items-center gap-2"
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
