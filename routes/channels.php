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
