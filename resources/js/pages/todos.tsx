import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { Head, useForm, router } from "@inertiajs/react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  image_url?: string;
}

interface TodosProps {
  todos: Todo[];
}

export default function Todos({ todos }: TodosProps) {
  const [newTodoText, setNewTodoText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, setData, post, processing, reset } = useForm({
    text: "",
    image: null as File | null,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setData('image', file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setData('image', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      setData('text', newTodoText.trim());
      
      post('/api/todos', {
        onSuccess: () => {
          setNewTodoText("");
          handleRemoveImage();
          reset();
        },
        onError: (errors) => {
          console.error('Failed to create todo:', errors);
        }
      });
    }
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    router.patch(`/api/todos/${id}`, {
      completed: !completed
    });
  };

  const handleDeleteTodo = (id: number) => {
    router.delete(`/api/todos/${id}`);
  };

  return (
    <>
      <Head title="Todos" />
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Todo List</CardTitle>
            <CardDescription>Manage your tasks efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTodo} className="mb-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Add a new task..."
                  disabled={processing}
                />
                <Button
                  type="submit"
                  disabled={processing || !newTodoText.trim()}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image-upload" className="text-sm font-medium">
                  Attach Image (optional)
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    ref={fileInputRef}
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={processing}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </form>

            {todos.length === 0 ? (
              <p className="py-4 text-center">
                No todos yet. Add one above!
              </p>
            ) : (
              <ul className="space-y-3">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="rounded-md border p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() =>
                            handleToggleTodo(todo.id, todo.completed)
                          }
                          id={`todo-${todo.id}`}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <label
                            htmlFor={`todo-${todo.id}`}
                            className={`block cursor-pointer ${todo.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {todo.text}
                          </label>
                          {todo.image_url && (
                            <div className="mt-2">
                              <img
                                src={todo.image_url}
                                alt="Todo attachment"
                                className="h-24 w-24 rounded-md object-cover border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTodo(todo.id)}
                        aria-label="Delete todo"
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}