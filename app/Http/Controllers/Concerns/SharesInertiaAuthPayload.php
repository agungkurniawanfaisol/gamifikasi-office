<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use Illuminate\Http\Request;

trait SharesInertiaAuthPayload
{
    /**
     * Explicit auth payload for Inertia pages so the client keeps role/user when
     * shared middleware props are missing from the JSON (e.g. hosting/subpath quirks).
     *
     * @return array{auth: array{user: array{id: int, name: string, email: string, email_verified_at: string|null, role: string}}}
     */
    protected function inertiaAuthPayload(Request $request): array
    {
        /** @var User $user */
        $user = $request->user();

        return [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                    'role' => $user->role->value,
                ],
            ],
        ];
    }
}
