import { createFileRoute } from "@tanstack/react-router";
import { todosApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/go/todos")({
  component: TodosComponent,
});

function TodosComponent() {
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const queryClient = useQueryClient();

  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: todosApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: todosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setNewTodo({ title: '', description: '' });
      toast.success('Todo created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create todo: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => todosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update todo: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: todosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete todo: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.title.trim()) {
      createMutation.mutate({
        title: newTodo.title,
        description: newTodo.description,
      });
    }
  };

  const handleToggle = (todo: any) => {
    updateMutation.mutate({
      id: todo.id.toString(),
      data: {
        ...todo,
        completed: !todo.completed,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      deleteMutation.mutate(id);
    }
  };

  const todos = todosQuery.data?.todos || [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Todos</h1>
        <p className="text-muted-foreground">Manage your tasks</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <Input
            placeholder="Todo title"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Input
            placeholder="Description (optional)"
            value={newTodo.description}
            onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
          />
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Todo'}
        </Button>
      </form>

      {todosQuery.isLoading && (
        <div className="flex items-center justify-center h-32">Loading todos...</div>
      )}

      {todosQuery.error && (
        <div className="flex items-center justify-center h-32 text-red-500">
          Error loading todos: {todosQuery.error.message}
        </div>
      )}

      <div className="space-y-4">
        {todos.map((todo: any) => (
          <div key={todo.id} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={() => handleToggle(todo)}
              disabled={updateMutation.isPending}
            />
            <div className="flex-1">
              <h3 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                {todo.title}
              </h3>
              {todo.description && (
                <p className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                  {todo.description}
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(todo.id.toString())}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

      {todos.length === 0 && !todosQuery.isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          No todos yet. Create your first todo above!
        </div>
      )}
    </div>
  );
}