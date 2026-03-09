<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated admin can visit the dashboard', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user);
 
    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('authenticated cashier is redirected from dashboard', function () {
    $user = User::factory()->create(['role' => 'cashier']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertStatus(403);
});