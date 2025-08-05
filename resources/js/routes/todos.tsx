
import { createFileRoute } from "@tanstack/react-router";
import { todosApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/image-upload";
import { ImageGallery } from "@/components/image-gallery";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/todos")({
  component: TodosComponent,
});

function TodosComponent() {
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [newTodoImages, setNewTodoImages] = useState<File[]>([]);
  const [editingTodo, setEditingTodo] = useState<any>(null);
  const [editingImages, setEditingImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
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
      setNewTodoImages([]);
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
      setEditingTodo(null);
      setEditingImages([]);
      setImagesToRemove([]);
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
        images: newTodoImages,
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

  const handleEditTodo = (todo: any) => {
    setEditingTodo(todo);
    setEditingImages([]);
    setImagesToRemove([]);
  };

  const handleUpdateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;

    updateMutation.mutate({
      id: editingTodo.id.toString(),
      data: {
        title: editingTodo.title,
        description: editingTodo.description,
        completed: editingTodo.completed,
        images: editingImages,
        remove_images: imagesToRemove,
      },
    });
  };

  const handleRemoveExistingImage = (imagePath: string) => {
    setImagesToRemove(prev => [...prev, imagePath]);
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
        <div>
          <label className="block text-sm font-medium mb-2">Images (optional)</label>
          <ImageUpload
            images={newTodoImages}
            onImagesChange={setNewTodoImages}
            maxImages={5}
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

      <div className="space-y-6">
        {todos.map((todo: any) => (
          <div key={todo.id} className="border rounded-lg p-4">
            {editingTodo?.id === todo.id ? (
              // Edit Form
              <form onSubmit={handleUpdateTodo} className="space-y-4">
                <div>
                  <Input
                    placeholder="Todo title"
                    value={editingTodo.title}
                    onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Description (optional)"
                    value={editingTodo.description || ''}
                    onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                  />
                </div>
                <div>
                  <Checkbox
                    checked={editingTodo.completed}
                    onCheckedChange={(checked) => setEditingTodo({ ...editingTodo, completed: checked })}
                  />
                  <label className="ml-2 text-sm">Completed</label>
                </div>

                {/* Existing Images */}
                {todo.image_urls && todo.image_urls.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Images</label>
                    <ImageGallery
                      images={todo.image_urls.filter((url: string) => !imagesToRemove.includes(url.split('/storage/')[1]))}
                      primaryImage={todo.primary_image_url}
                      onRemoveImage={handleRemoveExistingImage}
                    />
                  </div>
                )}

                {/* Add New Images */}
                <div>
                  <label className="block text-sm font-medium mb-2">Add New Images</label>
                  <ImageUpload
                    images={editingImages}
                    onImagesChange={setEditingImages}
                    maxImages={5 - (todo.image_urls?.length || 0) + imagesToRemove.length}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Updating...' : 'Update Todo'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingTodo(null);
                      setEditingImages([]);
                      setImagesToRemove([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              // Display Mode
              <div className="space-y-3">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => handleToggle(todo)}
                    disabled={updateMutation.isPending}
                    className="mt-1"
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTodo(todo)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(todo.id.toString())}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Display Images */}
                {todo.image_urls && todo.image_urls.length > 0 && (
                  <ImageGallery
                    images={todo.image_urls}
                    primaryImage={todo.primary_image_url}
                    readOnly={true}
                  />
                )}
              </div>
            )}
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
