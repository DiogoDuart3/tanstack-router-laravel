<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);
});

// Health check
Route::get('health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('profile', [UserController::class, 'profile']);
    Route::put('profile', [UserController::class, 'updateProfile']);
    
    // Todo routes for offline functionality
    Route::prefix('todos')->group(function () {
        Route::get('/', [TodoController::class, 'index']);
        Route::post('/', [TodoController::class, 'store']);
        Route::put('{todo}', [TodoController::class, 'update']);
        Route::delete('{todo}', [TodoController::class, 'destroy']);
        Route::post('sync', [TodoController::class, 'sync']);
    });
});