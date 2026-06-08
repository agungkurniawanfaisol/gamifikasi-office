<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiHealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok_json_without_auth(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk();
        $response->assertJson([
            'status' => 'ok',
            'service' => 'laravel',
        ]);
        $response->assertJsonStructure([
            'status',
            'service',
            'timestamp',
            'laravel',
            'php',
        ]);
    }
}
