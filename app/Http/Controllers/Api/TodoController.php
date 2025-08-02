<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TodoController extends Controller
{
    public function index(Request $request)
    {
        $todos = $request->user()->todos()->orderBy('created_at', 'desc')->get();
        
        // Append image URLs to each todo
        $todos->each(function ($todo) {
            $todo->append(['image_urls', 'primary_image_url']);
        });
        
        return response()->json(['todos' => $todos]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'boolean',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10MB max per image
        ]);

        $todo = $request->user()->todos()->create([
            'title' => $request->title,
            'description' => $request->description,
            'completed' => $request->completed ?? false,
        ]);

        // Handle image uploads
        if ($request->hasFile('images')) {
            $this->handleImageUploads($todo, $request->file('images'));
        }

        // Load the todo with image URLs
        $todo->load([]);
        $todo->append(['image_urls', 'primary_image_url']);

        return response()->json(['todo' => $todo], 201);
    }

    public function update(Request $request, Todo $todo)
    {
        $this->authorize('update', $todo);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'boolean',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:10240',
            'remove_images' => 'nullable|array',
            'remove_images.*' => 'string',
        ]);

        $todo->update([
            'title' => $request->title,
            'description' => $request->description,
            'completed' => $request->completed ?? false,
        ]);

        // Handle image removals
        if ($request->has('remove_images')) {
            foreach ($request->remove_images as $imagePath) {
                $this->removeImage($todo, $imagePath);
            }
        }

        // Handle new image uploads
        if ($request->hasFile('images')) {
            $this->handleImageUploads($todo, $request->file('images'));
        }

        // Load the todo with image URLs
        $todo->load([]);
        $todo->append(['image_urls', 'primary_image_url']);

        return response()->json(['todo' => $todo]);
    }

    public function destroy(Todo $todo)
    {
        $this->authorize('delete', $todo);
        
        // Delete associated images from storage
        if ($todo->images) {
            foreach ($todo->images as $imagePath) {
                Storage::disk('public')->delete($imagePath);
            }
        }
        
        $todo->delete();

        return response()->json(['message' => 'Todo deleted successfully']);
    }

    public function sync(Request $request)
    {
        $request->validate([
            'todos' => 'required|array',
            'todos.*.id' => 'nullable|string',
            'todos.*.title' => 'required|string|max:255',
            'todos.*.description' => 'nullable|string',
            'todos.*.completed' => 'boolean',
            'todos.*.client_id' => 'required|string',
            'todos.*.updated_at' => 'required|date',
        ]);

        $syncedTodos = [];
        
        DB::transaction(function () use ($request, &$syncedTodos) {
            foreach ($request->todos as $todoData) {
                if ($todoData['id']) {
                    // Update existing todo
                    $todo = Todo::where('id', $todoData['id'])
                                ->where('user_id', $request->user()->id)
                                ->first();
                    
                    if ($todo && $todo->updated_at->lessThan($todoData['updated_at'])) {
                        $todo->update([
                            'title' => $todoData['title'],
                            'description' => $todoData['description'],
                            'completed' => $todoData['completed'],
                        ]);
                        $syncedTodos[] = $todo;
                    }
                } else {
                    // Create new todo
                    $todo = $request->user()->todos()->create([
                        'title' => $todoData['title'],
                        'description' => $todoData['description'],
                        'completed' => $todoData['completed'],
                    ]);
                    $syncedTodos[] = $todo;
                }
            }
        });

        return response()->json([
            'synced_todos' => $syncedTodos,
            'all_todos' => $request->user()->todos()->orderBy('created_at', 'desc')->get(),
        ]);
    }

    private function handleImageUploads(Todo $todo, array $images): void
    {
        foreach ($images as $index => $image) {
            $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('todos', $filename, 'public');
            
            $todo->addImage($path, $index === 0); // First image becomes primary
        }
        
        $todo->save();
    }

    private function removeImage(Todo $todo, string $imagePath): void
    {
        // Remove from storage
        Storage::disk('public')->delete($imagePath);
        
        // Remove from todo model
        $todo->removeImage($imagePath);
        $todo->save();
    }
}