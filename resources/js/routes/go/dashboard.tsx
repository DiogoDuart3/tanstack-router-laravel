import { createFileRoute } from "@tanstack/react-router";
import { dashboardApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/go/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const dashboardData = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getData,
  });

  if (dashboardData.isLoading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  if (dashboardData.error) {
    return <div className="flex items-center justify-center h-64 text-red-500">Error loading dashboard</div>;
  }

  const { user, stats, recent_activity } = dashboardData.data || {};

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's what's happening with your todos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Todos</h3>
          <p className="text-2xl font-bold">{stats?.total_todos || 0}</p>
        </div>
        <div className="bg-card rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{stats?.completed_todos || 0}</p>
        </div>
        <div className="bg-card rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats?.pending_todos || 0}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recent_activity && recent_activity.length > 0 ? (
          <div className="space-y-3">
            {recent_activity.map((todo: any) => (
              <div key={todo.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{todo.title}</p>
                  <p className="text-sm text-muted-foreground">{todo.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  todo.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {todo.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No recent activity</p>
        )}
      </div>
    </div>
  );
}