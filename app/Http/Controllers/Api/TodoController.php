<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Todo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TodoController extends Controller
{
    public function index(Request $request)
    {
        $todos = $request->user()->todos()->orderBy('created_at', 'desc')->get();
        
        return response()->json(['todos' => $todos]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'boolean',
        ]);

        $todo = $request->user()->todos()->create([
            'title' => $request->title,
            'description' => $request->description,
            'completed' => $request->completed ?? false,
        ]);

        return response()->json(['todo' => $todo], 201);
    }

    public function update(Request $request, Todo $todo)
    {
        $this->authorize('update', $todo);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'boolean',
        ]);

        $todo->update([
            'title' => $request->title,
            'description' => $request->description,
            'completed' => $request->completed ?? false,
        ]);

        return response()->json(['todo' => $todo]);
    }

    public function destroy(Todo $todo)
    {
        $this->authorize('delete', $todo);
        
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
}