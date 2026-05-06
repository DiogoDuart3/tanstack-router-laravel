<?php

use App\Http\Controllers\Api\AdminChatController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Auth routes - using API middleware but with session support
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
});

// Health check — runs lightweight liveness probes against core services.
Route::get('health', function (Request $request) {
    $startTime = microtime(true);

    $check = function (callable $probe): array {
        $start = microtime(true);
        try {
            $probe();
            return [
                'status' => 'ok',
                'latency_ms' => round((microtime(true) - $start) * 1000, 2),
                'error' => null,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'down',
                'latency_ms' => round((microtime(true) - $start) * 1000, 2),
                'error' => $e->getMessage(),
            ];
        }
    };

    $checks = [
        'database' => $check(fn () => DB::connection()->getPdo() && DB::select('select 1 as ok')),
        'cache' => $check(function () {
            $key = '__health_'.bin2hex(random_bytes(4));
            Cache::put($key, '1', 5);
            $ok = Cache::get($key) === '1';
            Cache::forget($key);
            if (! $ok) {
                throw new \RuntimeException('cache round-trip failed');
            }
        }),
        'storage' => $check(function () {
            $disk = Storage::disk(config('filesystems.default'));
            $key = '__health_'.bin2hex(random_bytes(4)).'.txt';
            $disk->put($key, 'ok');
            $ok = $disk->get($key) === 'ok';
            $disk->delete($key);
            if (! $ok) {
                throw new \RuntimeException('storage round-trip failed');
            }
        }),
    ];

    $allOk = collect($checks)->every(fn ($c) => $c['status'] === 'ok');
    $requestTime = (microtime(true) - $startTime) * 1000;

    return response()->json([
        'status' => $allOk ? 'ok' : 'degraded',
        'timestamp' => now(),
        'request_time_ms' => round($requestTime, 2),
        'checks' => $checks,
        'system' => [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'environment' => app()->environment(),
            'debug' => (bool) config('app.debug'),
            'timezone' => config('app.timezone'),
        ],
    ]);
});

// Version check endpoint
Route::get('version', function () {
    $gitHash = null;
    $buildTimestamp = null;
    $builtAt = null;

    // Read build info from storage directory
    $buildFile = storage_path('app/build.json');
    if (file_exists($buildFile)) {
        $buildData = json_decode(file_get_contents($buildFile), true);
        $gitHash = $buildData['version'] ?? null;
        $buildTimestamp = $buildData['timestamp'] ?? null;
        $builtAt = $buildData['built_at'] ?? null;
    }

    // Fallback to git command if build.json doesn't exist
    if (!$gitHash) {
        try {
            $gitHash = trim(shell_exec('git rev-parse HEAD'));
        } catch (Exception $e) {
            // Fallback if git command fails
        }
    }

    return response()->json([
        'version' => $gitHash ?: 'unknown',
        'build_timestamp' => $buildTimestamp,
        'built_at' => $builtAt,
        'server_time' => now()->toISOString(),
    ]);
});

// Public chat routes (accessible to everyone, but with server-controlled usernames)
Route::prefix('chat')->group(function () {
    Route::get('/', [ChatController::class, 'index']);
    Route::get('recent', [ChatController::class, 'recent']);
    Route::post('/', [ChatController::class, 'store']);
    Route::post('typing', [ChatController::class, 'typing']);
});

// Public push notification VAPID key endpoint
Route::get('push/vapid-key', [NotificationController::class, 'getVapidKey']);

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

    // Push notification routes (subscription/unsubscription requires auth)
    Route::prefix('push')->group(function () {
        Route::post('subscribe', [NotificationController::class, 'subscribe']);
        Route::post('unsubscribe', [NotificationController::class, 'unsubscribe']);
        Route::post('test', [NotificationController::class, 'testPush']);
    });

    // Admin chat routes (requires admin privileges)
    Route::prefix('admin/chat')->group(function () {
        Route::get('/', [AdminChatController::class, 'index']);
        Route::get('recent', [AdminChatController::class, 'recent']);
        Route::post('/', [AdminChatController::class, 'store']);
        Route::post('typing', [AdminChatController::class, 'typing']);
    });
});
