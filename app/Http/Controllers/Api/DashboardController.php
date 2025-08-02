<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'user' => $user,
            'stats' => [
                'total_todos' => $user->todos()->count(),
                'completed_todos' => $user->todos()->where('completed', true)->count(),
                'pending_todos' => $user->todos()->where('completed', false)->count(),
            ],
            'recent_activity' => $user->todos()->latest()->take(5)->get(),
        ]);
    }
}