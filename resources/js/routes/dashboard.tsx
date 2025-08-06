import { dashboardApi } from '@/lib/api';
import type { RecentActivityItem } from '@/types';
import { UpdateDemo } from '@/components/UpdateDemo';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
    component: DashboardComponent,
});

function DashboardComponent() {
    const dashboardData = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardApi.getData,
    });

    if (dashboardData.isLoading) {
        return <div className="flex h-64 items-center justify-center">Loading dashboard...</div>;
    }

    if (dashboardData.error) {
        return <div className="flex h-64 items-center justify-center text-red-500">Error loading dashboard</div>;
    }

    const { user, stats, recent_activity } = dashboardData.data || {};

    return (
        <div className="container mx-auto max-w-4xl px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
                <p className="text-muted-foreground">Here's what's happening with your todos</p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Todos</h3>
                    <p className="text-2xl font-bold">{stats?.total_todos || 0}</p>
                </div>
                <div className="rounded-lg bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                    <p className="text-2xl font-bold text-green-600">{stats?.completed_todos || 0}</p>
                </div>
                <div className="rounded-lg bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.pending_todos || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-card p-6">
                    <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
                    {recent_activity && recent_activity.length > 0 ? (
                        <div className="space-y-3">
                            {recent_activity.map((todo: RecentActivityItem) => (
                                <div key={todo.id} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                        <p className="font-medium">{todo.type}</p>
                                        <p className="text-sm text-muted-foreground">{todo.description}</p>
                                    </div>
                                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">{todo.type}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No recent activity</p>
                    )}
                </div>
                
                <div className="rounded-lg bg-card p-6">
                    <UpdateDemo />
                </div>
            </div>
        </div>
    );
}
