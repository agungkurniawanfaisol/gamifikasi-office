#!/usr/bin/env bash

set -euo pipefail

php artisan migrate --force
# Ensure public/storage → storage/app/public (absolute paths from Docker break on the host)
php artisan storage:link --force --relative
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Post-deploy Laravel commands completed."
