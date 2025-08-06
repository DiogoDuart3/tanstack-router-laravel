<?php

use App\Http\Controllers\Api\AdminChatController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
});

// Health check
Route::get('health', function (Request $request) {
    $startTime = microtime(true);

    // Simulate some processing time for more accurate measurement
    usleep(1000); // 1ms delay

    $endTime = microtime(true);
    $requestTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'request_time_ms' => round($requestTime, 2)
    ]);
});

// Public chat routes (accessible to everyone)
Route::prefix('chat')->group(function () {
    Route::get('/', [ChatController::class, 'index']);
    Route::get('recent', [ChatController::class, 'recent']);
    Route::post('/', [ChatController::class, 'store']);
    Route::post('typing', [ChatController::class, 'typing']);
});

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('auth/user', [AuthController::class, 'user']);
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

    // Notification routes
    Route::prefix('notifications')->group(function () {
        Route::post('demo', [NotificationController::class, 'sendDemo']);
        Route::post('immediate', [NotificationController::class, 'sendImmediate']);
        Route::get('/', [NotificationController::class, 'getNotifications']);
    });

    // Admin chat routes (requires admin privileges)
    Route::prefix('admin/chat')->group(function () {
        Route::get('/', [AdminChatController::class, 'index']);
        Route::get('recent', [AdminChatController::class, 'recent']);
        Route::post('/', [AdminChatController::class, 'store']);
        Route::post('typing', [AdminChatController::class, 'typing']);
    });
});
