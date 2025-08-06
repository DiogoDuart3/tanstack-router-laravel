<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Public chat channel - anyone can listen
Broadcast::channel('public-chat', function () {
    return true;
});

// Typing indicator channel - anyone can listen
Broadcast::channel('public-chat-typing', function () {
    return true;
});

// Admin chat channel - only admins can listen
Broadcast::channel('admin-chat', function ($user) {
    return $user && $user->isAdmin();
});

// Admin typing indicator channel - only admins can listen
Broadcast::channel('admin-chat-typing', function ($user) {
    return $user && $user->isAdmin();
});

// Notifications channel - authenticated users can listen to their own notifications
Broadcast::channel('notifications', function ($user) {
    return $user ? $user : false;
});
