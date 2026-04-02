# Deploy Laravel + React (Vite) ke Hostinger Shared Hosting

Panduan ini untuk menjalankan project tanpa Docker, hanya PHP + MySQL.

## 1) Build produksi di lokal

Jalankan di mesin lokal sebelum upload:

```bash
cd /home/agung/project/Gamifikasi
npm install
npm run build
```

Pastikan folder `public/build` sudah terisi.

Jika environment lokal kamu punya PHP/Composer:

```bash
composer install --no-dev --optimize-autoloader
```

Jika tidak, jalankan `composer install --no-dev --optimize-autoloader` di server Hostinger via SSH.

## 2) Buat database di hPanel

- Buat MySQL database.
- Buat user database dan assign ke database.
- Catat nilai:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_DATABASE`
  - `DB_USERNAME`
  - `DB_PASSWORD`

## 3) Upload project

Upload source project ke server (misal di folder `~/gamifikasi-app`), termasuk:

- `app`, `bootstrap`, `config`, `database`, `public`, `resources`, `routes`, `storage`, `vendor`
- file root seperti `artisan`, `composer.json`, `composer.lock`

Tidak perlu upload:

- `node_modules`
- `docker`
- file environment lokal yang sensitif

## 4) Atur document root

Opsi paling aman:

- Set document root domain/subdomain langsung ke folder `public` Laravel.

Jika shared hosting tidak bisa ubah document root:

- Letakkan source Laravel di luar `public_html` (misal `~/gamifikasi-app`).
- Isi folder `public_html` dengan isi folder `public` dari project.
- Edit `public_html/index.php` agar path `vendor/autoload.php` dan `bootstrap/app.php` mengarah ke folder source.

## 5) Konfigurasi `.env` produksi

Gunakan referensi dari file `.env.hostinger.example` di root project.

Nilai minimal yang wajib:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://domain-kamu`
- semua variabel `DB_*`
- `APP_KEY` valid

Generate key di server:

```bash
php artisan key:generate
```

## 6) Finalisasi di server

Jalankan:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Pastikan permission tulis untuk:

- `storage`
- `bootstrap/cache`

## 7) Verifikasi

- Buka halaman login/dashboard.
- Cek route penting seperti ranking siswa.
- Jika error 500, cek `storage/logs/laravel.log`.
- Pastikan aset Vite (`/build/assets/...`) tidak 404.
