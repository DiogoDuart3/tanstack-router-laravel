<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\HttpFoundation\Response;

class BroadcastingAuthMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        logger()->info('Broadcasting auth middleware', [
            'channel_name' => $request->input('channel_name'),
            'has_session' => Auth::guard('web')->check(),
            'has_bearer_token' => !empty($request->bearerToken()),
            'bearer_token_preview' => $request->bearerToken() ? substr($request->bearerToken(), 0, 10) . '...' : null,
        ]);

        // Try to authenticate via session first
        if (Auth::guard('web')->check()) {
            logger()->info('Authenticated via session', ['user_id' => Auth::guard('web')->id()]);
            return $next($request);
        }

        // Try to authenticate via Sanctum token
        if ($request->bearerToken()) {
            logger()->info('Attempting Sanctum auth with token', ['token_preview' => substr($request->bearerToken(), 0, 10) . '...']);
            $user = Auth::guard('sanctum')->user();
            if ($user) {
                Auth::guard('web')->login($user);
                logger()->info('Authenticated via Sanctum token', ['user_id' => $user->id]);
                return $next($request);
            } else {
                logger()->warning('Sanctum authentication failed - no user found for token');
            }
        }

        // For public channels, allow access
        $channelName = $request->input('channel_name');
        if (in_array($channelName, ['public-chat', 'public-chat-typing'])) {
            logger()->info('Allowing public channel access', ['channel' => $channelName]);
            return $next($request);
        }

        // If neither works, return 403
        logger()->warning('Broadcasting authentication failed', [
            'channel_name' => $channelName,
            'has_session' => Auth::guard('web')->check(),
            'has_bearer_token' => !empty($request->bearerToken()),
        ]);
        return response('Unauthorized', 403);
    }
}
