<?php

test('health check endpoint returns ok status', function () {
    $response = $this->getJson('/api/health');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'status',
            'timestamp',
            'request_time_ms'
        ])
        ->assertJson([
            'status' => 'ok'
        ]);
});

test('health check includes timestamp', function () {
    $response = $this->getJson('/api/health');

    $response->assertStatus(200);
    
    $data = $response->json();
    expect($data['timestamp'])->not->toBeNull();
    expect($data['timestamp'])->toMatch('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/');
});

test('health check includes request time', function () {
    $response = $this->getJson('/api/health');

    $response->assertStatus(200);
    
    $data = $response->json();
    expect($data['request_time_ms'])->toBeFloat();
    expect($data['request_time_ms'])->toBeGreaterThan(0);
});

test('health check is accessible without authentication', function () {
    $response = $this->getJson('/api/health');

    $response->assertStatus(200);
});