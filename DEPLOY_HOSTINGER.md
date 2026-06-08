# Deploy Laravel + React (Vite) ke Hostinger Shared Hosting

Panduan ini untuk menjalankan project **tanpa Docker**, hanya PHP + MySQL.

**Syarat:** PHP **8.3+** (cek `composer.json`: `"php": "^8.3"`). Di hPanel Hostinger, pilih versi PHP yang sesuai untuk domain tersebut.

## 1) Build produksi di lokal

Jalankan di mesin lokal **sebelum** upload:

```bash
cd /path/ke/Gamifikasi
npm install
npm run build
```

Pastikan folder `public/build` terisi **hanya** `manifest.json` + folder `assets/` (hasil `npm run build`).

**Catatan project ini:** halaman Inertia di-bundle **eager** ke satu file JS utama (`app-*.js` ±1,7 MB gzip ~393 KB) supaya **tidak** ada puluhan chunk `/build/assets/NamaHalaman-*.js` yang gampang 404 kalau upload tidak lengkap. Deploy cukup pastikan **`manifest.json` + `assets/app-*.js` + `assets/app-*.css`** dari **satu** `npm run build` ikut naik semua.

### Chunk JS 404 (`/build/assets/Login-xxxxx.js` Not Found) tapi `app-xxxxx.js` jalan

Hampir selalu **tidak satu paket** dengan `manifest.json`:

- `app-….js` dari **build A**, sedangkan folder `assets/` isinya dari **build B**, atau
- upload **sebagian** saja (lupa beberapa file), atau
- di server masih ada file lama + file baru tercampur.

**Perbaikan:** di lokal satu kali `npm run build`, lalu upload **seluruh** isi `public/build` dari hasil itu sekaligus: **`manifest.json` + semua isi `assets/`** (ratusan file sekalian). Lebih aman: **hapus dulu** `public/build` di server (folder `assets` + `manifest.json`), lalu upload ulang folder `build` lengkap.

Cek: buka langsung URL yang 404 di browser; jika 404, file itu memang tidak ada di disk — bandingkan nama file dengan folder `public/build/assets` di lokal setelah build.

**Bukan bagian deploy:** folder `public/build/storage` (jika ada di mesin Anda) **bukan** output Vite standar dan **tidak perlu** di-upload. Biasanya muncul karena salah salin, symlink yang diikuti tool FTP, atau folder manual. Aman dihapus dari dalam `public/build` sebelum upload. Upload besar dari situ hanya membuang waktu.

Penyimpanan file aplikasi Laravel: **`storage/app/...`** di root project + perintah `php artisan storage:link` yang membuat tautan **`public/storage`** (bukan di dalam `public/build`).

**Vite / URL asset:** Jangan set `VITE_BASE` di `.env` kecuali document root benar-benar bukan folder `public` Laravel (lihat juga `vite.config.js`). Untuk Hostinger dengan document root = `public`, biarkan kosong agar chunk memakai `/build/assets/...`.

Jika di mesin lokal ada PHP/Composer:

```bash
composer install --no-dev --optimize-autoloader
```

Jika tidak, jalankan perintah yang sama **di server** lewat SSH (setelah upload `composer.json` / `composer.lock`).

## 2) Buat database di hPanel

- Buat MySQL database + user, assign user ke database.
- Di panel Hostinger, **host** database sering **bukan** `127.0.0.1` — gunakan hostname yang ditampilkan (mis. `mysqlXXX.hostinger.com` atau sejenis) untuk `DB_HOST` di `.env`.

## 3) Upload project

Upload isi project ke server (misalnya `~/domains/nama-domain.com/gamifikasi-app` atau path yang disarankan Hostinger), termasuk:

- `app`, `bootstrap`, `config`, `database`, `public`, `resources`, `routes`, `storage`, `vendor` (jika sudah `composer install` di lokal)

**File statis di `public/`** (mis. `public/images/logo.png` untuk favicon & `ApplicationLogo`) **tidak** diproses `npm run build` — harus ikut ter-upload bersama folder `public`. URL yang benar jika document root = `public` Laravel: `https://domain-anda/images/logo.png` (**bukan** `/public/images/...`).
- file root: `artisan`, `composer.json`, `composer.lock`

**Tidak perlu** (hemat ruang / keamanan):

- `node_modules`
- folder Docker/Sail jika tidak dipakai di produksi
- `.env` lokal (buat `.env` baru di server dari `.env.hostinger.example`)
- `.git` (opsional)

Jika **tidak** meng-upload `vendor`, wajib `composer install --no-dev --optimize-autoloader` di server setelah upload.

## 4) Atur document root

**Cara terbaik:** di hPanel, set **document root** domain/subdomain langsung ke folder `public` Laravel (mis. `.../gamifikasi-app/public`).

**Jika document root harus `public_html` dan app di folder di atasnya** (pola umum shared hosting):

1. Salin isi folder `public` Laravel ke `public_html` (termasuk `.htaccess`).
2. Edit **`public_html/index.php`** — ubah dua baris `require` agar menunjuk ke folder **root project** (bukan `public_html`):

   Contoh jika Laravel ada di `../gamifikasi-app` relatif dari `public_html`:

   ```php
   require __DIR__.'/../gamifikasi-app/vendor/autoload.php';
   // ...
   $app = require_once __DIR__.'/../gamifikasi-app/bootstrap/app.php';
   ```

   Sesuaikan nama folder (`gamifikasi-app`) dengan path sebenarnya di server.

Tanpa penyesuaian ini, aplikasi tidak akan menemukan `vendor` / `bootstrap`.

## 5) Konfigurasi `.env` produksi

Di server, salin contoh:

```bash
cp .env.hostinger.example .env
php artisan key:generate
```

Lalu isi minimal:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://domain-anda` (pakai `https`, tanpa slash akhir)
- Semua `DB_*` sesuai database Hostinger
- **`GEMINI_API_KEY`** (dan opsional `GEMINI_MODEL`, dll.) jika fitur feedback AI ujian dipakai — lihat `config/services.php`

**Sesi & cache:** `.env.hostinger.example` memakai `SESSION_DRIVER=database`, `CACHE_STORE=database`, `QUEUE_CONNECTION=database`. Pastikan sudah `php artisan migrate --force` agar tabel `sessions`, `cache`, `jobs`, dll. ada.

**Antrian job (feedback AI, dll.):** `QUEUE_CONNECTION=database` membutuhkan worker yang memproses job (`php artisan queue:work`). Di shared hosting sering **tidak** ada proses yang jalan terus. Opsi praktis:

- **Tanpa worker:** set `QUEUE_CONNECTION=sync` di `.env` — job dijalankan dalam request yang sama (lebih sederhana, bisa memperlambat response jika job berat), **atau**
- Pasang **cron** Hostinger yang menjalankan `php artisan queue:work --stop-when-empty` setiap menit (kurang ideal tapi kadang dipakai), atau konsultasikan batasan paket Hostinger Anda.

## 6) Finalisasi di server (SSH)

Dari **root project** (folder yang berisi `artisan`):

```bash
php artisan migrate --force
php artisan storage:link
php artisan view:clear
php artisan config:cache
php artisan view:cache
```

Setelah mengubah `resources/views/app.blade.php` (mis. hanya `@vite(['resources/js/app.tsx'])`), **wajib** `php artisan view:clear` — kalau tidak, Hostinger masih memakai Blade ter-compile lama di `storage/framework/views/*.php` dan error **Unable to locate file in Vite manifest: resources/js/Pages/Welcome.tsx** bisa muncul walau `manifest.json` sudah benar.

**`php artisan storage:link`** wajib jika ada upload file (mis. media soal) ke disk `public` — tanpa symlink, file tidak terbaca lewat URL.

**Route cache (opsional):**

```bash
php artisan route:cache
```

Jika perintah ini **error**, lewati saja untuk sementara (beberapa setup Ziggy/route dinamis bisa bermasalah); aplikasi tetap jalan tanpa `route:cache`.

## 7) Permission

Pastikan web server bisa menulis:

- `storage` (rekursif)
- `bootstrap/cache`

Contoh umum (sesuaikan user/group server):

```bash
chmod -R ug+rwx storage bootstrap/cache
```

## 8) Verifikasi

- Buka login / dashboard.
- Cek halaman penting (mis. ranking, bank soal).
- Pastikan aset Vite memuat: `/build/assets/...` **tidak** 404 (hard refresh / cache browser).
- Upload satu file media soal (jika dipakai) dan pastikan URL `storage/...` bisa diakses.
- Jika error 500: `storage/logs/laravel.log`.

## 9) Folder `storage` — tidak perlu upload semuanya

Yang **penting di server** adalah struktur folder yang bisa ditulis web server, bukan salinan isi development:

- Buat (kosong boleh) minimal: `storage/framework/cache`, `storage/framework/sessions`, `storage/framework/views`, `storage/logs`, `storage/app/public` (untuk upload user).
- **Jangan** wajib meng-upload ribuan file dari `storage/framework/cache` atau `storage/logs` lokal — di server bisa dikosongkan lalu `chmod` seperti di §7.
- Setelah deploy: `php artisan storage:link` (§6).

Upload besar biasanya karena `storage/logs` atau cache; itu bisa diabaikan / dikosongkan di server.

## 10) `/build/assets/*.js` membalas **500** (bukan 404)

File di `public/build/assets/` adalah **statis**; respons 500 hampir selalu dari **konfigurasi server**, bukan dari kode Laravel di request tersebut.

**Cek cepat:** buka langsung di browser salah satu URL chunk, mis.  
`https://deeptest.universitaspgridelta.ac.id/build/manifest.json`  
- Jika isi JSON muncul → file `build/` terbaca; masalahnya mungkin spesifik (ModSecurity, cache CDN).  
- Jika **500** atau halaman HTML error Laravel → request **tidak** dilayani sebagai file statis (sering melewati `index.php` / handler salah).

**Perbaikan umum di shared hosting:**

1. Pastikan **`public/.htaccess`** ikut ter-deploy (Laravel punya aturan `RewriteCond %{REQUEST_FILENAME} !-f` agar file yang ada **tidak** diarahkan ke `index.php`).
2. Pastikan document root benar-benar folder yang berisi **`build/`** dan `.htaccess` itu (bukan hanya parent project).
3. **Permission:** folder `public/build` dan isinya harus bisa dibaca user web server (mis. `644` file, `755` folder).
4. **ModSecurity / firewall Hostinger:** kadang mem-blok pola pada nama file atau query; coba nonaktifkan sementara di hPanel atau hubungi support jika URL `.js` di bawah `/build/` selalu 500.
5. Pastikan **bukan** ada aturan custom yang memaksa semua request ke PHP.

**Sidebar / menu aneh setelah navigasi:** jika banyak chunk JS gagal dimuat (500), React/Inertia bisa tidak lengkap; perbaiki pengiriman `public/build` dulu, lalu hard refresh. Di aplikasi ini juga ada perbaikan agar grup menu **Main** (Dashboard) tidak tertutup otomatis untuk peran dosen/admin saat membuka halaman seperti Question Bank.

---

## Ringkasan: alur Anda sudah benar?

| Langkah di panduan | Status |
|---------------------|--------|
| `npm run build` lokal + upload `public/build` | Benar |
| `composer install --no-dev` (lokal atau server) | Benar |
| `.env` produksi + `key:generate` | Benar |
| Document root ke `public` atau edit `index.php` | Benar — pastikan contoh path `index.php` sesuai folder server |
| `migrate --force` + `config:cache` + `view:cache` | Benar |
| Permission `storage` / `bootstrap/cache` | Benar |

Yang **sebelumnya kurang** di dokumen lama dan sekarang sudah ditambahkan: **PHP 8.3**, **`storage:link`**, **hostname DB Hostinger**, **detail edit `index.php`**, **Gemini / queue**, dan **catatan `route:cache`**.
