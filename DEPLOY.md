# 🚀 Panduan Deploy NeuraScan

Ikuti langkah-langkah ini secara **berurutan**.

---

## LANGKAH 1 — Upload ke GitHub

### 1.1 Buat repository baru di GitHub
1. Buka https://github.com/new
2. Nama repo: `neurascan-seizure` (atau sesuai keinginan)
3. Pilih **Public**
4. Klik **Create repository**

### 1.2 Push kode dari komputer kamu
Buka terminal di folder `seizure-v2`, lalu jalankan:

```bash
git init
git add .
git commit -m "Initial commit: NeuraScan seizure classifier"
git branch -M main
git remote add origin https://github.com/USERNAME/neurascan-seizure.git
git push -u origin main
```

> Ganti `USERNAME` dengan username GitHub kamu.

---

## LANGKAH 2 — Deploy Backend ke Render.com

### 2.1 Buat akun & connect GitHub
1. Buka https://render.com dan daftar/login
2. Klik **New → Web Service**
3. Pilih **Connect a GitHub repository**
4. Pilih repo `neurascan-seizure` yang baru kamu buat

### 2.2 Konfigurasi service
Render akan otomatis membaca `render.yaml`, tapi pastikan setting ini:

| Setting | Nilai |
|---|---|
| Name | `neurascan-backend` |
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |

Klik **Create Web Service**.

### 2.3 Catat URL backend kamu
Setelah deploy selesai (±3–5 menit), kamu akan dapat URL seperti:
```
https://neurascan-backend.onrender.com
```
**Simpan URL ini** — diperlukan di langkah berikutnya.

> ⚠️ **Catatan Render Free Tier**: Service akan "tidur" setelah 15 menit tidak ada request. Request pertama setelah tidur butuh ±30 detik. Ini normal untuk tier gratis.

---

## LANGKAH 3 — Tambah Secret di GitHub

1. Buka repo GitHub kamu → **Settings → Secrets and variables → Actions**
2. Klik **New repository secret**
3. Isi:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://neurascan-backend.onrender.com` ← URL dari Render tadi
4. Klik **Add secret**

---

## LANGKAH 4 — Aktifkan GitHub Pages

1. Buka repo GitHub → **Settings → Pages**
2. Di bagian **Source**, pilih: **GitHub Actions**
3. Klik **Save**

---

## LANGKAH 5 — Trigger Deploy Frontend

Setelah secret ditambahkan, trigger ulang workflow:

```bash
# Cara 1: Push perubahan kecil
git commit --allow-empty -m "Trigger deploy frontend"
git push

# Cara 2: Manual dari GitHub
# Buka tab Actions → pilih workflow → klik "Run workflow"
```

---

## LANGKAH 6 — Cek Hasil

Setelah workflow selesai (±2–3 menit), frontend kamu live di:
```
https://USERNAME.github.io/neurascan-seizure
```

Cek tab **Actions** di GitHub untuk melihat status deploy.

---

## Troubleshooting

### Frontend blank / tidak muncul
- Pastikan secret `REACT_APP_API_URL` sudah diisi dengan benar
- Cek tab **Actions** untuk error build

### "Gagal menghubungi server"
- Backend Render mungkin sedang tidur — tunggu 30 detik lalu coba lagi
- Cek https://neurascan-backend.onrender.com/api/health — harus return `{"status":"ok"}`

### Build gagal di Actions
- Pastikan `package-lock.json` ikut ter-push ke GitHub
- Jalankan `npm install` di folder frontend lalu push ulang
