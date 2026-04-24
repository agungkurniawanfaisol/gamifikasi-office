<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->select(['id', 'name', 'email', 'role', 'is_active', 'created_at'])
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Create');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $avatarPath = null;

        if ($request->hasFile('avatar')) {
            $avatarPath = Storage::disk('public')->putFile('avatars', $request->file('avatar'));
        }

        User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'phone_number' => $data['phone_number'],
            'gender' => $data['gender'],
            'birth_date' => $data['birth_date'],
            'address' => $data['address'],
            'bio' => $data['bio'] ?? null,
            'avatar' => $avatarPath,
            'is_active' => $data['is_active'],
            'password' => $data['password'],
        ]);

        return redirect()->route('admin.users.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                ...$user->only([
                    'id',
                    'name',
                    'email',
                    'role',
                    'is_active',
                    'phone_number',
                    'gender',
                    'birth_date',
                    'address',
                    'bio',
                ]),
                'avatar_url' => $user->avatar
                    ? Storage::disk('public')->url($user->avatar)
                    : null,
            ],
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();
        $avatarPath = $user->avatar;

        if ($request->hasFile('avatar')) {
            $avatarPath = Storage::disk('public')->putFile('avatars', $request->file('avatar'));
            if ($user->avatar !== null) {
                Storage::disk('public')->delete($user->avatar);
            }
        }

        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'phone_number' => $data['phone_number'],
            'gender' => $data['gender'],
            'birth_date' => $data['birth_date'],
            'address' => $data['address'],
            'bio' => $data['bio'] ?? null,
            'avatar' => $avatarPath,
            'is_active' => $data['is_active'],
            'password' => $data['password'] ?? $user->password,
        ]);

        return redirect()->route('admin.users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ((int) $user->id === (int) request()->user()?->id) {
            abort(422, 'You cannot delete your own account.');
        }

        if ($user->avatar !== null) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->delete();

        return redirect()->route('admin.users.index');
    }
}

