#!/usr/bin/env bash

set -euo pipefail

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Post-deploy Laravel commands completed."
