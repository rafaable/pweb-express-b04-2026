# Panduan Pengerjaan & Dokumentasi Backend MLBB Shop (Express 5 + TypeScript + Prisma 7 + Neon)

Dokumentasi ini dibuat khusus sebagai panduan lengkap dan mudah dipahami (bahkan untuk orang awam sekalipun) mengenai cara membangun backend **MLBB Shop** dari persiapan awal hingga **Fitur Kedua (Hero)** selesai dan teruji secara aman.

---

## DAFTAR ISI
1. [Konsep Materi & Solusi Teknis](#1-konsep-materi--solusi-teknis)
2. [Langkah Persiapan & Pengerjaan (Step-by-Step)](#2-langkah-persiapan--pengerjaan-step-by-step)
   - [Step 1: Inisialisasi Project & Konfigurasi Modul Modern](#step-1-inisialisasi-project--konfigurasi-modul-modern)
   - [Step 2: Pemasangan Dependensi & Library](#step-2-pemasangan-dependensi--library)
   - [Step 3: Konfigurasi Keamanan, TypeScript, & Environment](#step-3-konfigurasi-keamanan-typescript--environment)
   - [Step 4: Menyiapkan Skema Database & Dataset](#step-4-menyiapkan-skema-database--dataset)
   - [Step 5: Migrasi Database ke Cloud & Generator Client](#step-5-migrasi-database-ke-cloud--generator-client)
   - [Step 6: Pengisian Data Awal (Database Seeding)](#step-6-pengisian-data-awal-database-seeding)
   - [Step 7: Pembuatan Helper, Middleware, & Arsitektur Server](#step-7-pembuatan-helper-middleware--arsitektur-server)
   - [Step 8: Pembuatan Fitur 1 (Health Check) & Fitur 2 (Hero)](#step-8-pembuatan-fitur-1-health-check--fitur-2-hero)
   - [Step 9: Pengecekan Kualitas Kode (Typecheck)](#step-9-pengecekan-kualitas-kode-typecheck)
3. [Panduan Praktik Demonstrasi Testcase di Postman](#3-panduan-praktik-demonstrasi-testcase-di-postman)
   - [Persiapan Sebelum Demo](#persiapan-sebelum-demo)
   - [Testcase 01: Health Check](#testcase-01-health-check)
   - [Testcase 02: Daftar Hero Role Marksman](#testcase-02-daftar-hero-role-marksman)
   - [Testcase 03: Cari Hero dengan Kata "la"](#testcase-03-cari-hero-dengan-kata-la)
   - [Testcase 04: Detail Hero Layla Beserta Skin-nya](#testcase-04-detail-hero-layla-beserta-skin-nya)
   - [Testcase 05: Detail Hero Tidak Ada](#testcase-05-detail-hero-tidak-ada)
   - [Testcase 06: Tambah Hero Baru ("Collie")](#testcase-06-tambah-hero-baru-collie)
   - [Testcase 07: Tambah Hero dengan Nama yang Sudah Ada](#testcase-07-tambah-hero-dengan-nama-yang-sudah-ada)
   - [Testcase 08: Tambah Hero dengan Data Kurang](#testcase-08-tambah-hero-dengan-data-kurang)

---

## 1. Konsep Materi & Solusi Teknis

Dalam mengerjakan penugasan ini hingga fitur Hero, ada beberapa konsep dasar pemrograman web backend yang kita gunakan:

1. **Node.js & ES Module (ESM):**
   - **Materi/Konsep:** Node.js adalah lingkungan (*runtime*) untuk mengeksekusi JavaScript di luar browser. Standar JavaScript modern memakai format ES Module (`import` dan `export`). Prisma versi 7 mewajibkan mode ESM ini.
   - **Yang Kita Lakukan:** Menyiapkan identitas project dan mengaktifkan pengaturan tipe modul agar seluruh file `.ts` dapat saling mengimpor fungsi secara modern.

2. **TypeScript & Runner Eksekusi Cepat (`tsx`):**
   - **Materi/Konsep:** TypeScript menambahkan sistem tipe data pada JavaScript agar kesalahan penulisan (*typo*) atau ketidaksesuaian tipe langsung terdeteksi sebelum aplikasi dijalankan. Untuk menjalankan kode tanpa perlu bolak-balik mengubahnya ke JavaScript manual, kita menggunakan runner modern bernama `tsx` yang memiliki fitur *watch* (server otomatis me-restart sendiri jika ada file yang diedit dan disimpan).
   - **Yang Kita Lakukan:** Menyusun aturan kompilasi ketat (*strict mode*) dan mendefinisikan script pintasan di terminal.

3. **Database Cloud PostgreSQL (Neon) & Driver Adapter:**
   - **Materi/Konsep:** Daripada menginstal database berat di komputer sendiri, kita memakai database cloud Neon. Neon bersifat *serverless* dan memiliki dua jenis alamat koneksi:
     - **Pooled (Host memiliki kata `-pooler`):** Dipakai oleh aplikasi web yang sedang berjalan agar efisien menangani banyak pengguna sekaligus.
     - **Direct / Unpooled (Host tanpa `-pooler`):** Dipakai oleh tool CLI saat membuat dan mengubah struktur tabel database.
     - Prisma 7 mewajibkan penggunaan driver adapter khusus bernama `@prisma/adapter-neon` untuk terhubung ke Neon.
   - **Yang Kita Lakukan:** Memisahkan kedua link tersebut di dalam file rahasia `.env` dan menyambungkannya ke Prisma Client.

4. **Object-Relational Mapping (Prisma ORM):**
   - **Materi/Konsep:** ORM menjembatani kode pemrograman dengan database. Kita tidak perlu menulis perintah SQL manual yang panjang, melainkan memanggil fungsi objek TypeScript (seperti `prisma.hero.findMany()`).
   - **Yang Kita Lakukan:** Menulis skema tabel (`Hero`, `Skin`, `Player`, `PlayerHero`) beserta relasinya, seperti relasi satu Hero ke banyak Skin dengan aturan *Cascade Delete* (jika hero dihapus, skin ikut terhapus).

5. **Database Seeding:**
   - **Materi/Konsep:** Mengisi database kosong dengan data bawaan resmi (133 Hero Mobile Legends, 892 Skin, dan 3 Player).
   - **Yang Kita Lakukan:** Membuat skrip otomatis yang membersihkan database dengan perintah SQL `TRUNCATE` (mereset ID kembali ke angka 1) lalu memasukkan ratusan data tersebut sekaligus menggunakan teknik *bulk insert* (`createMany`).

6. **Arsitektur Express: Middleware, Router, dan Controller:**
   - **Middleware:** Pos penjaga yang memeriksa setiap permintaan sebelum sampai ke tujuan. Kita membuat *Logger* (mencatat siapa yang mengakses server) dan *Error Handler* (menangkap error agar server tidak mendadak mati dan selalu mengembalikan pesan rapi).
   - **Router:** Papan penunjuk jalan yang mengarahkan alamat URL ke fungsi yang tepat.
   - **Controller:** Otak dari fitur, tempat kita memeriksa validitas input, mengambil data dari database, menghitung pagination (halaman), dan mengirimkan balasan JSON ke pengguna.

---

## 2. Langkah Persiapan & Pengerjaan (Step-by-Step)

Berikut adalah urutan kerja nyata beserta perintah terminal yang dijalankan:

### Step 1: Inisialisasi Project & Konfigurasi Modul Modern
- **Terminal Command yang Dijalankan:**
  ```powershell
  npm init -y
  npm pkg set type=module
  ```
- **Tujuan Perintah:**
  1. `npm init -y` membuat file `package.json` secara instan dengan nilai default tanpa harus menjawab pertanyaan interaktif satu per satu.
  2. `npm pkg set type=module` menambahkan baris `"type": "module"` ke dalam `package.json`. Ini bertujuan mengaktifkan sistem ES Module modern agar kita bisa menggunakan sintaks `import ... from ...`.
- **File yang Muncul:**
  - `package.json`

---

### Step 2: Pemasangan Dependensi & Library
- **Terminal Command yang Dijalankan:**
  ```powershell
  npm install express@5 @prisma/client@7 @prisma/adapter-neon@7 dotenv bcryptjs
  npm install -D typescript tsx @types/node @types/express prisma@7
  ```
- **Tujuan Perintah:**
  - Mengunduh dan memasang library utama ke folder project:
    - `express@5`: Framework web server versi 5.
    - `@prisma/client@7`: Mesin penghubung query database ke kode kita.
    - `@prisma/adapter-neon@7`: Driver khusus untuk database cloud Neon.
    - `dotenv`: Untuk membaca file rahasia `.env`.
    - `bcryptjs`: Library keamanan enkripsi data.
    - `typescript`, `tsx`, `@types/*`: Alat bantu compiler TypeScript dan runner eksekusi file `.ts`.
    - `prisma@7`: CLI Prisma untuk migrasi skema dan inspeksi data.
- **File yang Muncul:**
  - Folder `node_modules/` (tempat penyimpanan file library).
  - `package-lock.json` (catatan detail versi library yang terpasang).

---

### Step 3: Konfigurasi Keamanan, TypeScript, & Environment
Pada tahap ini, kita membuat file-file konfigurasi penting di root folder project:

1. **Membuat file `.gitignore`:**
   - **Fungsi:** Memberitahu Git untuk tidak pernah mengunggah folder atau file tertentu ke repository GitHub.
   - **Tujuan:** Melindungi file `.env` (yang berisi password database) agar tidak bocor ke publik, serta mengabaikan folder berat seperti `node_modules/`.
   - **Isi file:**
     ```gitignore
     node_modules
     dist
     .env
     src/generated
     ```

2. **Membuat file `tsconfig.json`:**
   - **Fungsi:** Mengatur kompilasi TypeScript.
   - **Tujuan:** Menentukan standar JavaScript modern (`ES2023`, `ESNext`), menyalakan mode pengecekan ketat (`strict: true`), dan menyetel `noEmit: true` agar TypeScript hanya bertindak sebagai pemeriksa kesalahan tanpa memproduksi file JavaScript terpisah.
   - **Isi file:**
     ```json
     {
       "compilerOptions": {
         "target": "ES2023",
         "module": "ESNext",
         "moduleResolution": "bundler",
         "types": ["node"],
         "strict": true,
         "esModuleInterop": true,
         "resolveJsonModule": true,
         "isolatedModules": true,
         "skipLibCheck": true,
         "noEmit": true
       },
       "include": ["src", "prisma.config.ts", "prisma"]
     }
     ```

3. **Membuat file `.env`:**
   - **Fungsi:** Menyimpan variabel lingkungan dan kunci rahasia.
   - **Tujuan:** Menghubungkan project ke database PostgreSQL Neon dengan dua jenis string koneksi (pooled dan direct unpooled).
   - **Isi file:**
     ```env
     DATABASE_URL="postgresql://neondb_owner:npg_zruoR8TbZ9EA@ep-ancient-cake-b5fqes02-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
     DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_zruoR8TbZ9EA@ep-ancient-cake-b5fqes02.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
     PORT=3000
     ```

4. **Membuat file `prisma.config.ts`:**
   - **Fungsi:** Konfigurasi resmi Prisma versi 7 CLI.
   - **Tujuan:** Memberitahu Prisma CLI bahwa URL database langsung (*unpooled*) diambil dari `DATABASE_URL_UNPOOLED` dan skema database ada di `prisma/schema.prisma`.
   - **Isi file:**
     ```typescript
     import "dotenv/config";
     import { defineConfig, env } from "prisma/config";

     export default defineConfig({
       schema: "prisma/schema.prisma",
       migrations: { path: "prisma/migrations" },
       datasource: { url: env("DATABASE_URL_UNPOOLED") },
     });
     ```

5. **Menambahkan Script di `package.json`:**
   - Kita menambahkan perintah cepat agar bisa dijalankan di terminal:
     - `"dev": "tsx watch src/index.ts"` (menjalankan server mode reload otomatis).
     - `"start": "tsx src/index.ts"` (menjalankan server sekali jalan).
     - `"typecheck": "tsc --noEmit"` (mengecek ada tidaknya error kode TypeScript).
     - `"seed": "tsx prisma/seed.ts"` (menjalankan pengisian data awal database).

---

### Step 4: Menyiapkan Skema Database & Dataset

1. **Membuat File `prisma/schema.prisma`:**
   - **Fungsi:** Menggambarkan cetak biru (*blueprint*) tabel database.
   - **Tujuan:** Mendefinisikan model `Hero`, `Skin`, `Player`, dan `PlayerHero` lengkap dengan Enum (`Role`, `Lane`, `Rarity`, `Currency`) serta relasi antar tabel (seperti `onDelete: Cascade` pada Skin dan PlayerHero).
   - **Isi model utama:**
     - `Hero`: Menyimpan data pahlawan (`name` unik, `role`, `lane`, `releaseYear`, `priceBP`, `priceDiamond`).
     - `Skin`: Menyimpan skin (`name`, `rarity`, `priceDiamond`, dan relasi `heroId` ke Hero).
     - `Player`: Menyimpan pemain (`nickname` unik, saldo awal default 10.000 BP dan 0 Diamond).
     - `PlayerHero`: Tabel perantara pencatat kepemilikan hero oleh pemain (`playerId`, `heroId`, mata uang saat beli, dan harga bayar).

2. **Menyiapkan Dataset Resmi:**
   - Dataset resmi diunduh dan dikonversi ke dalam bentuk JSON standar yang rapi di folder `data/`:
     - `data/heroes.json`: Berisi 133 hero dari Miya (id 1) sampai Hirara (id 133).
     - `data/skins.json`: Berisi 892 skin lengkap dengan id hero pemiliknya.

---

### Step 5: Migrasi Database ke Cloud & Generator Client

- **Terminal Command yang Dijalankan:**
  ```powershell
  npx prisma migrate dev --name init
  ```
- **Tujuan Perintah:**
  Prisma membaca file `schema.prisma`, membuat berkas SQL migrasi otomatis, dan menjalankannya ke database PostgreSQL di cloud Neon. Dengan perintah ini, tabel fisik asli terbentuk di database Neon.
- **File yang Muncul:**
  - Folder `prisma/migrations/20261031103328_init/migration.sql` (berisi perintah SQL `CREATE TABLE`, `CREATE TYPE`, dsb).

- **Terminal Command yang Dijalankan:**
  ```powershell
  npx prisma generate
  ```
- **Tujuan Perintah:**
  Di Prisma 7, perintah ini wajib dijalankan manual. Tujuannya membangun kode library Prisma Client di folder `src/generated/prisma/` agar editor kita memiliki fitur autocomplete otomatis dan type-checking penuh terhadap tabel database.
- **File yang Muncul:**
  - Seluruh isi folder `src/generated/prisma/`.

---

### Step 6: Pengisian Data Awal (Database Seeding)

1. **Membuat Instance Koneksi di `src/config/prisma.ts`:**
   - **Fungsi:** Menghubungkan Prisma Client ke Neon menggunakan driver adapter pooler.
   - **Tujuan:** Menjaga satu koneksi global yang dipakai oleh seluruh fungsi aplikasi.

2. **Membuat File `prisma/seed.ts`:**
   - **Fungsi:** Skrip pengisian data otomatis.
   - **Tujuan:**
     1. Menjalankan raw SQL: `TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE;` untuk mengosongkan tabel dan mengembalikan urutan nomor ID ke 1.
     2. Membaca `data/heroes.json` lalu memasukkan 133 hero sekaligus dengan `createMany`.
     3. Membaca `data/skins.json` lalu memasukkan 892 skin sekaligus dengan `createMany`.
     4. Memasukkan 3 data player awal (`ArekITS`, `SangPushRank`, `MageSurabaya`).
     5. Memasukkan data awal kepemilikan hero pemain (Miya, Layla, Ling, Gusion).

- **Terminal Command yang Dijalankan:**
  ```powershell
  npx tsx prisma/seed.ts
  ```
- **Tujuan Perintah:**
  Mengeksekusi skrip pengisian data ke database cloud.
- **Hasil di Terminal:**
  ```text
  Seeding database...
  Seeded 133 heroes.
  Seeded 892 skins.
  Seeded 3 players.
  Seeded player heroes.
  Database seed completed successfully! 🌟
  ```

---

### Step 7: Pembuatan Helper, Middleware, & Arsitektur Server

Kita membangun komponen pendukung agar kode bersih, modular, dan terstruktur:

1. **`src/utils/http-error.ts`:**
   - **Fungsi:** Membuat class error buatan sendiri yang membawa kode status HTTP (misal 400, 404, 409).
   - **Tujuan:** Memudahkan kita melempar error langsung di baris validasi tanpa perlu menulis banyak `if-else` bersarang.

2. **`src/utils/response.ts`:**
   - **Fungsi:** Helper fungsi `sendSuccess()`.
   - **Tujuan:** Memastikan semua respon sukses memiliki format JSON yang seragam:
     ```json
     {
       "status": true,
       "message": "Pesan sukses",
       "data": ...,
       "metadata": { ... } // otomatis disertakan jika ada paginasi
     }
     ```

3. **`src/utils/parse.ts`:**
   - **Fungsi:** Helper fungsi `parseId()`.
   - **Tujuan:** Memeriksa parameter ID dari URL (seperti `req.params.hero_id`), memastikan nilainya adalah angka bulat positif murni. Jika tidak valid, langsung melempar error HTTP 400.

4. **`src/middlewares/logger.ts`:**
   - **Fungsi:** Middleware pencatat aktivitas request.
   - **Tujuan:** Menampilkan riwayat setiap request yang masuk ke terminal, misalnya: `GET /api/heroes 200 (12ms)`.

5. **`src/middlewares/error.ts`:**
   - **Fungsi:** Middleware penanganan error global (`errorHandler`) dan penanganan rute tidak terdaftar (`notFound`).
   - **Tujuan:**
     - Jika pengguna membuka URL ngawur yang tidak ada, sistem membalas status HTTP 404 dengan format `{ "status": false, "message": "Endpoint ... tidak ditemukan" }`.
     - Jika ada error di tengah proses (seperti data bentrok atau id tidak ketemu), sistem menangkapnya dan mengirim format respon gagal yang rapi `{ "status": false, "message": "..." }` tanpa membuat server mati/crash.

---

### Step 8: Pembuatan Fitur 1 (Health Check) & Fitur 2 (Hero)

1. **`src/controllers/heroController.ts`:**
   Berisi seluruh logika pemrosesan data hero:
   - **`getAllHeroes` (`GET /api/heroes`):**
     - Membaca parameter query URL: `page` (default 1), `limit` (default 10), `search` (pencarian nama hero tanpa peduli huruf besar/kecil), dan `role` (filter kategori seperti MARKSMAN, TANK, dll).
     - Mengambil data dari database dengan paginasi (`skip` dan `take`) dan menghitung total data menggunakan transaksi Prisma.
     - Mengembalikan data hero terurut dari id terkecil beserta metadata (`currentPage`, `limit`, `totalItems`, `totalPages`).
   - **`getHeroById` (`GET /api/heroes/:hero_id`):**
     - Mencari hero berdasarkan ID tertentu dan menyertakan seluruh daftar skin miliknya menggunakan klausa `include: { skins: true }`.
     - Jika hero tidak ditemukan, melempar HTTP 404 ("Hero tidak ditemukan").
   - **`createHero` (`POST /api/heroes`):**
     - Membaca body request: `name`, `role`, `lane`, `releaseYear`, `priceBP`, `priceDiamond`.
     - Memeriksa urutan validasi:
       1. Jika field wajib (`name`, `role`, `lane`, atau `releaseYear`) kosong $\rightarrow$ balas HTTP 400.
       2. Jika nama hero sudah terdaftar sebelumnya di database $\rightarrow$ balas HTTP 409.
       3. Jika semua aman $\rightarrow$ simpan ke database dan balas HTTP 201 dengan data hero baru.

2. **`src/routes/hero.routes.ts` & `src/routes/index.ts`:**
   - Memetakan fungsi controller di atas ke method HTTP masing-masing di bawah rute `/api/heroes`.

3. **`src/index.ts`:**
   - File utama server Express.
   - Memasang middleware global (`logger`, `express.json()`, `express.urlencoded()`).
   - Mendaftarkan endpoint **Fitur 1: Health Check (`GET /health`)** yang menjalankan query ringan `SELECT 1` ke database Neon untuk memastikan koneksi aktif dan membangunkan database dari mode hemat daya (*sleep*).
   - Menghubungkan rute `/api`.
   - Memasang middleware 404 dan error handler di bagian paling bawah.
   - Menyalakan server pada Port 3000.

---

### Step 9: Pengecekan Kualitas Kode (Typecheck)
- **Terminal Command yang Dijalankan:**
  ```powershell
  npm run typecheck
  ```
- **Tujuan Perintah:**
  Menjalankan perintah `tsc --noEmit` untuk menguji seluruh kode dari awal hingga akhir. Tidak ada satu pun peringatan atau error tipe TypeScript yang tersisa (Status lolos 100%).

---

## 3. Panduan Praktik Demonstrasi Testcase di Postman

Berikut panduan langkah demi langkah yang dapat langsung dipraktikkan untuk menguji atau mendemonstrasikan hasil pengerjaan Fitur 1 dan Fitur 2 menggunakan file `testcase.json`.

### Persiapan Sebelum Demo
1. Buka aplikasi **Terminal / Command Prompt / PowerShell** di komputer kalian pada folder project ini.
2. Jika database habis dipakai uji coba sebelumnya dan ingin dikembalikan ke kondisi awal, ketik perintah berikut lalu tekan Enter:
   ```powershell
   npx tsx prisma/seed.ts
   ```
   *(Tunggu sampai muncul pesan `Database seed completed successfully! 🌟`)*
3. Nyalakan server aplikasi Express dengan perintah:
   ```powershell
   npm run dev
   ```
   *(Pastikan muncul tulisan `Express is running on Port 3000`. Biarkan jendela terminal ini tetap terbuka)*.
4. Buka aplikasi **Postman**:
   - Di pojok kiri atas Postman, klik tombol **Import**.
   - Pilih file `testcase.json` yang ada di folder project ini.
   - Folder koleksi request baru bernama **"MLBB Shop - Urutan Testcase"** akan otomatis muncul di menu samping kiri Postman.

---

### Testcase 01: Health Check
- **Apa tujuannya?** Mengecek apakah server Express menyala dan database cloud Neon terhubung dengan baik.
- **Langkah di Postman:**
  1. Di sidebar kiri, buka folder koleksi lalu klik request **"01. Health Check"**.
  2. Pastikan method adalah `GET` dan URL adalah `http://localhost:3000/health`.
  3. Klik tombol warna biru **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP di pojok kanan bawah: **`200 OK`**
  - Balasan JSON:
    ```json
    {
      "status": true,
      "message": "Server dan database OK"
    }
    ```

---

### Testcase 02: Daftar Hero Role Marksman
- **Apa tujuannya?** Mengambil daftar hero khusus yang perannya adalah `MARKSMAN`, dibatasi maksimal 5 hero saja per halaman.
- **Langkah di Postman:**
  1. Klik request nomor **"02. Daftar Hero Role Marksman"**.
  2. Method: `GET`, URL: `http://localhost:3000/api/heroes?role=MARKSMAN&limit=5`.
  3. Klik tombol **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP: **`200 OK`**
  - Pada bagian `data`, tampil 5 hero (Miya, Bruno, Clint, Layla, Moskov).
  - Pada bagian `metadata` di paling bawah, pastikan angka-angkanya persis seperti ini:
    ```json
    "metadata": {
      "currentPage": 1,
      "limit": 5,
      "totalItems": 20,
      "totalPages": 4
    }
    ```

---

### Testcase 03: Cari Hero dengan Kata "la"
- **Apa tujuannya?** Mencari semua hero yang namanya ada unsur kata "la" (huruf besar/kecil dianggap sama).
- **Langkah di Postman:**
  1. Klik request nomor **"03. Cari Hero 'la'"**.
  2. Method: `GET`, URL: `http://localhost:3000/api/heroes?search=la`.
  3. Klik tombol **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP: **`200 OK`**
  - Muncul daftar hero seperti Rafaela, Layla, Angela, Floryn, Nolan, dsb.
  - Bagian `metadata` menunjukkan total ada 10 hero yang cocok:
    ```json
    "metadata": {
      "currentPage": 1,
      "limit": 10,
      "totalItems": 10,
      "totalPages": 1
    }
    ```

---

### Testcase 04: Detail Hero Layla Beserta Skin-nya
- **Apa tujuannya?** Melihat data lengkap hero Layla (ID 18) sekaligus menampilkan semua skin yang dimilikinya.
- **Langkah di Postman:**
  1. Klik request nomor **"04. Detail Hero Layla"**.
  2. Method: `GET`, URL: `http://localhost:3000/api/heroes/18`.
  3. Klik tombol **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP: **`200 OK`**
  - Menampilkan data hero Layla beserta daftar array `skins` yang berisi 11 macam skin (Green Flash, Bunny Babe, Cannon and Roses, SABER Breacher, dsb).

---

### Testcase 05: Detail Hero Tidak Ada
- **Apa tujuannya?** Menguji respon server ketika ada pengguna yang mencari ID hero yang tidak terdaftar (misalnya ID 999).
- **Langkah di Postman:**
  1. Klik request nomor **"05. Detail Hero Tidak Ada"**.
  2. Method: `GET`, URL: `http://localhost:3000/api/heroes/999`.
  3. Klik tombol **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP: **`404 Not Found`**
  - Balasan JSON:
    ```json
    {
      "status": false,
      "message": "Hero tidak ditemukan"
    }
    ```

---

### Testcase 06: Tambah Hero Baru ("Collie")
- **Apa tujuannya?** Menambahkan data satu hero baru ke dalam database.
- **Langkah di Postman:**
  1. Klik request nomor **"06. Tambah Hero Collie"**.
  2. Method: `POST`, URL: `http://localhost:3000/api/heroes`.
  3. Buka tab **Body** $\rightarrow$ pilih opsi **raw** $\rightarrow$ pastikan format di sebelah kanan adalah **JSON**:
     ```json
     {
       "name": "Collie",
       "role": "MAGE",
       "lane": "MID",
       "releaseYear": 2026,
       "priceBP": 32000,
       "priceDiamond": 599
     }
     ```
  4. Klik tombol **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP: **`201 Created`**
  - Balasan JSON:
    ```json
    {
      "status": true,
      "message": "Hero berhasil ditambahkan",
      "data": {
        "id": 134,
        "name": "Collie",
        "role": "MAGE",
        "lane": "MID",
        "releaseYear": 2026,
        "priceBP": 32000,
        "priceDiamond": 599
      }
    }
    ```
    *(Hero Collie berhasil ditambahkan dengan nomor ID 134)*.

---

### Testcase 07: Tambah Hero dengan Nama yang Sudah Ada
- **Apa tujuannya?** Menguji sistem proteksi server agar tidak ada dua hero dengan nama yang sama persis (nama harus unik).
- **Langkah di Postman:**
  1. Klik request nomor **"07. Tambah Hero Nama Sudah Ada"**.
  2. Method: `POST`, URL: `http://localhost:3000/api/heroes`.
  3. Isinya sama persis seperti request nomor 06 di atas (mencoba mendaftarkan hero Collie lagi).
  4. Klik tombol **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP: **`409 Conflict`**
  - Balasan JSON:
    ```json
    {
      "status": false,
      "message": "Hero dengan nama tersebut sudah ada"
    }
    ```

---

### Testcase 08: Tambah Hero dengan Data Kurang
- **Apa tujuannya?** Memastikan server menolak pendaftaran hero baru jika data wajib (seperti `role`, `lane`, atau `releaseYear`) tidak disertakan.
- **Langkah di Postman:**
  1. Klik request nomor **"08. Tambah Hero Data Kurang"**.
  2. Method: `POST`, URL: `http://localhost:3000/api/heroes`.
  3. Pada tab **Body**, hanya tertulis nama saja tanpa role atau lane:
     ```json
     {
       "name": "Kaiden"
     }
     ```
  4. Klik tombol **Send**.
- **Hasil yang harus muncul di layar:**
  - Status HTTP: **`400 Bad Request`**
  - Balasan JSON:
    ```json
    {
      "status": false,
      "message": "name, role, lane, dan releaseYear wajib diisi"
    }
    ```

---

Dengan mengikuti panduan di atas, Fitur 1 (Health Check) dan Fitur 2 (Hero) telah selesai dikerjakan, terverifikasi ke database cloud, dan siap didemonstrasikan dengan hasil pengujian 100% sesuai spesifikasi soal.

---

## 4. Fitur 3 (Skin), Fitur 4 (Player), & Fitur 5 (Top Up & Match)

Bagian ini melanjutkan panduan di atas untuk Fitur 3 sampai 5. Semua endpoint memakai helper yang sama dengan Fitur 2 (`HttpError`, `parseId`, `sendSuccess`), jadi format response sukses dan gagal tetap seragam.

### Konsep Tambahan

1. **Filter dinamis + pagination:** Objek `where` dibangun sesuai query yang dikirim (`heroId`, `rarity`), lalu dipakai bersama oleh `findMany` dan `count`. Dengan begitu `totalItems` di `metadata` selalu ikut terfilter.
2. **Validasi enum di pintu masuk:** Nilai `rarity` dicek terhadap enum `Rarity` dari Prisma. Nilai ngawur (misal `rarity=FOO`) dibalas **400** dengan daftar nilai yang valid, bukan error 500 dari database.
3. **`increment` atomik:** Top up dan hadiah match memakai `{ increment: n }`. Penambahan dilakukan langsung oleh database, sehingga dua request bersamaan tidak saling menimpa (berbeda dengan pola baca → tambah → simpan).
4. **Urutan pemeriksaan:** Setiap endpoint memeriksa satu per satu dan berhenti di kegagalan pertama, sesuai urutan di soal (400 → 404 → 409).

---

### Step 10: Fitur 3 (Skin)

- **File:** `src/controllers/skinController.ts`, `src/routes/skin.routes.ts`
- **`GET /api/skins`:**
  - Query: `page` (default 1), `limit` (default 10), `heroId`, `rarity`.
  - Memakai `include: { hero: { select: { name: true } } }` agar tiap skin membawa nama hero-nya.
  - `heroId` bukan bilangan bulat positif → **400**. `rarity` bukan salah satu enum → **400**.
- **`GET /api/skins/:skin_id`:**
  - Menampilkan skin beserta data hero lengkap (`include: { hero: true }`).
  - Skin tidak ada → **404** ("Skin tidak ditemukan").

---

### Step 11: Fitur 4 (Player)

- **File:** `src/controllers/playerController.ts`, `src/routes/player.routes.ts`
- **`POST /api/players`:** body `{ "nickname": "..." }`. Nickname kosong → **400**, sudah dipakai → **409**, berhasil → **201**. Saldo awal (10000 BP, 0 Diamond) terisi otomatis dari default schema.
- **`GET /api/players/:player_id`:** menampilkan player beserta daftar hero miliknya. Tiap hero diringkas menjadi `{ heroId, name, currency, pricePaid }`. Tidak ada → **404**.
- **`PATCH /api/players/:player_id`:** mengganti nickname. Urutan: player tidak ada → **404**, nickname kosong → **400**, dipakai player lain → **409**. Mengganti ke nickname milik sendiri tetap diizinkan.
- **`DELETE /api/players/:player_id`:** menghapus player. `PlayerHero` milik player ikut terhapus lewat `onDelete: Cascade` di schema. Tidak ada → **404**.

---

### Step 12: Fitur 5 (Top Up & Match)

- **`POST /api/players/:player_id/topup`:** body `{ "amount": 706 }`.
  - `amount` bukan angka bulat lebih dari 0 (termasuk string `"50"`, desimal, atau negatif) → **400**.
  - Player tidak ada → **404**.
  - Berhasil → **200** berisi `playerId`, `amount`, dan `diamond` terbaru.
- **`POST /api/players/:player_id/matches`:** body `{ "result": "WIN" }`.
  - `result` selain `WIN` / `LOSE` → **400**. Player tidak ada → **404**.
  - Berhasil → **200**. WIN menambah 300 BP, LOSE menambah 100 BP. Response berisi `playerId`, `result`, `bpEarned`, dan `bp` terbaru.

---

### Step 13: Perbaikan Seed (Sequence ID Player)

- **Masalah:** `seed.ts` memasukkan player dengan `id` 1, 2, 3 secara manual. Saat id diisi manual, PostgreSQL **tidak** memajukan penghitung otomatis (sequence) `Player_id_seq`. Akibatnya `POST /api/players` mencoba memakai id 1 yang sudah terpakai dan gagal dengan error unique constraint (terbaca sebagai 409 "Data sudah ada").
- **Solusi:** setelah memasukkan 3 player, seed menjalankan:
  ```typescript
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Player"', 'id'), (SELECT MAX(id) FROM "Player"))`;
  ```
  Penghitung dimajukan ke id terbesar, sehingga player baru mendapat id 4.
- Data seed tetap sama persis seperti di soal.

---

## 5. Testcase Fitur 3, 4, & 5 di Postman

Jalankan `npx tsx prisma/seed.ts` lebih dulu, lalu kirim request berurutan dari collection `testcase.json`.

### Testcase 09: Daftar Skin Layla
- **Request:** `GET http://localhost:3000/api/skins?heroId=18`
- **Hasil yang harus muncul:** **`200 OK`**. Tiap skin memuat `"hero": { "name": "Layla" }`, dan `metadata.totalItems` adalah **11**:
  ```json
  "metadata": { "currentPage": 1, "limit": 10, "totalItems": 11, "totalPages": 2 }
  ```

### Testcase 10: Daftar Skin Rarity GRAND
- **Request:** `GET http://localhost:3000/api/skins?rarity=GRAND`
- **Hasil yang harus muncul:** **`200 OK`**, `metadata.totalItems` adalah **98**.

### Testcase 11: Detail Skin Silverbolt Raiko
- **Request:** `GET http://localhost:3000/api/skins/891`
- **Hasil yang harus muncul:** **`200 OK`**, skin **Silverbolt Raiko** milik hero **Selena**:
  ```json
  { "status": true, "message": "Berhasil mengambil data skin",
    "data": { "id": 891, "name": "Silverbolt Raiko", "rarity": "GRAND", "heroId": 63,
              "hero": { "id": 63, "name": "Selena", "...": "..." } } }
  ```

### Testcase 12: Buat Player JunglerMalam
- **Request:** `POST http://localhost:3000/api/players`, body JSON `{ "nickname": "JunglerMalam" }`
- **Hasil yang harus muncul:** **`201 Created`**, `id` **4**, `bp` 10000, `diamond` 0:
  ```json
  { "status": true, "message": "Player berhasil dibuat",
    "data": { "id": 4, "nickname": "JunglerMalam", "bp": 10000, "diamond": 0, "createdAt": "..." } }
  ```

### Testcase 13: Buat Player Nickname Dipakai
- **Request:** `POST /api/players`, body `{ "nickname": "ArekITS" }`
- **Hasil yang harus muncul:** **`409 Conflict`**, `{ "status": false, "message": "Nickname sudah dipakai" }`

### Testcase 14: Top Up 706 Diamond
- **Request:** `POST /api/players/3/topup`, body `{ "amount": 706 }`
- **Hasil yang harus muncul:** **`200 OK`**. Player 3 mulai dari 0 Diamond, sehingga saldo menjadi 706:
  ```json
  { "status": true, "message": "Top up berhasil",
    "data": { "playerId": 3, "amount": 706, "diamond": 706 } }
  ```

### Testcase 15: Top Up Amount Negatif
- **Request:** `POST /api/players/3/topup`, body `{ "amount": -10 }`
- **Hasil yang harus muncul:** **`400 Bad Request`**, `{ "status": false, "message": "amount harus bilangan bulat lebih dari 0" }`

### Testcase 16: Match Menang (WIN)
- **Request:** `POST /api/players/3/matches`, body `{ "result": "WIN" }`
- **Hasil yang harus muncul:** **`200 OK`**. Player 3 mulai dari 10000 BP, sehingga menjadi 10300:
  ```json
  { "status": true, "message": "Match berhasil dicatat",
    "data": { "playerId": 3, "result": "WIN", "bpEarned": 300, "bp": 10300 } }
  ```

### Testcase 22: Detail Player MageSurabaya
- **Request:** `GET /api/players/3`
- **Hasil yang harus muncul:** **`200 OK`**. Setelah Fitur 6 (Beli Hero) selesai, daftar `heroes` berisi Freya dan Layla:
  ```json
  "heroes": [
    { "heroId": 22, "name": "Freya", "currency": "DIAMOND", "pricePaid": 599 },
    { "heroId": 18, "name": "Layla", "currency": "BP", "pricePaid": 2000 }
  ]
  ```
  Sebelum Fitur 6 ada, `heroes` berupa array kosong `[]`.

### Testcase 23: Ganti Nickname Jadi MageITS
- **Request:** `PATCH /api/players/3`, body `{ "nickname": "MageITS" }`
- **Hasil yang harus muncul:** **`200 OK`**, `{ "status": true, "message": "Nickname berhasil diubah", "data": { "id": 3, "nickname": "MageITS", ... } }`

### Testcase 24: Ganti Nickname Dipakai
- **Request:** `PATCH /api/players/3`, body `{ "nickname": "ArekITS" }`
- **Hasil yang harus muncul:** **`409 Conflict`**, `{ "status": false, "message": "Nickname sudah dipakai player lain" }`

### Testcase 26: Hapus Player JunglerMalam
- **Request:** `DELETE /api/players/4`
- **Hasil yang harus muncul:** **`200 OK`**, `{ "status": true, "message": "Player berhasil dihapus" }`

### Testcase 27: Detail Player Terhapus
- **Request:** `GET /api/players/4`
- **Hasil yang harus muncul:** **`404 Not Found`**, `{ "status": false, "message": "Player tidak ditemukan" }`

### Testcase 28: Endpoint Tidak Ada
- **Request:** `GET /api/ngawur`
- **Hasil yang harus muncul:** **`404 Not Found`**, `{ "status": false, "message": "Endpoint GET /api/ngawur tidak ditemukan" }`
