<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class MakeAdminUser extends Command
{
    protected $signature = 'app:make-admin
        {--name= : Admin display name}
        {--email= : Admin email}
        {--password= : Admin password (plain text)}
        {--force : Allow creating even if an admin already exists}';

    protected $description = 'Create the first admin user.';

    public function handle(): int
    {
        $adminExists = User::query()->where('role', 'admin')->exists();

        if ($adminExists && ! $this->option('force')) {
            $this->error('An admin user already exists. Use --force to create another.');

            return self::FAILURE;
        }

        $name = (string) ($this->option('name') ?: $this->ask('Name', 'Admin'));
        $email = (string) ($this->option('email') ?: $this->ask('Email'));
        $password = (string) ($this->option('password') ?: $this->secret('Password'));

        $validator = Validator::make(
            [
                'name' => $name,
                'email' => $email,
                'password' => $password,
            ],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::query()->create([
            'name' => $name,
            'email' => $email,
            // The User model casts password as 'hashed'
            'password' => $password,
            'role' => 'admin',
            'avatar' => null,
            'is_active' => true,
        ]);

        $this->info("Admin user created: {$user->email} (id={$user->id})");

        return self::SUCCESS;
    }
}

