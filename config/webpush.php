<?php

return [

    /*
    |--------------------------------------------------------------------------
    | VAPID Configuration
    |--------------------------------------------------------------------------
    |
    | VAPID keys are used to identify your application to push services.
    | Generate keys using: php artisan webpush:vapid
    |
    */

    'vapid' => [
        'subject' => env('VAPID_SUBJECT', env('APP_URL')),
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Push Service Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for push notification services
    |
    */

    'ttl' => env('WEBPUSH_TTL', 2419200), // 4 weeks default
    'urgency' => env('WEBPUSH_URGENCY', 'normal'), // very-low, low, normal, high
    'topic' => env('WEBPUSH_TOPIC'),

];