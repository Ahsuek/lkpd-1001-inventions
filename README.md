# LKPD Digital Interaktif — 1001 INVENTIONS: The Muslim Science Mission

LKPD gamifikasi edukasi **individu** untuk siswa Madrasah Aliyah setelah menonton film
*1001 Inventions*. Siswa berperan sebagai **INNOVATION DETECTIVE** dan menyelesaikan
5 misi (Watch & Hunt → Discover → Think Deeper → Invent → Final Challenge).

**Tidak ada fitur kelompok dalam bentuk apa pun** — semua data, nilai, XP, dan AI feedback
bersifat per siswa individu.

## Struktur Project

```
lkpd-1001-inventions/
├── index.html          # SPA: login → mission hub → 5 misi → result → teacher view
├── css/style.css       # Tema science-museum / Islamic civilization, mobile-first
├── js/config.js        # URL Web App Apps Script (satu-satunya config yang perlu diisi)
├── js/state.js         # State + localStorage + XP/level/predikat
├── js/quiz-data.js     # 5 soal Mission 02 (Discover)
├── js/protect.js       # Anti-copy (.user-content) & anti-paste (data-no-paste)
├── js/canvas.js        # Sketch canvas (touch/mouse, erase, undo, clear)
├── js/app.js           # Logika misi, scoring, AI mentor, submit, teacher view
└── backend/Code.gs     # Google Apps Script: doPost/doGet, AI proxy, Sheets
```

## Cara Setup (± 10 menit)

1. **Buat Spreadsheet baru** di Google Sheets (satu spreadsheet, sheet dibuat otomatis:
   `RESPONSES`, `DETAIL_AI`, `REKAP`). Salin **Spreadsheet ID** dari URL-nya.
2. **Buka Apps Script**: dari Spreadsheet → Extensions → Apps Script. Tempel isi
   `backend/Code.gs`.
3. **Project Settings → Script Properties**, tambahkan:
   - `SPREADSHEET_ID` = ID spreadsheet dari langkah 1
   - `AI_API_KEY` = API key Google Gemini (dapat dari Google AI Studio) — **JANGAN pernah di frontend**
   - (opsional) `AI_MODEL` = default `gemini-1.5-flash`
4. Jalankan fungsi `doGet` sekali dari editor untuk mengizinkan otorisasi (approve izin Sheets/UrlFetch).
5. **Deploy → New deployment → Web app** → Execute as: *Me* → Who has access: *Anyone* → Deploy.
6. Salin **URL Web App (`.../exec`)** dan tempel ke `js/config.js` pada `API_URL`.
7. Host folder ini (GitHub Pages, Netlify, atau file:// pun bekerja karena semua request
   menggunakan `text/plain` POST tanpa preflight CORS). Untuk deployment publik, disarankan
   GitHub Pages.

## Rubrik & Nilai (total 100)

| Komponen | Maksimum |
|---|---:|
| Watch & Hunt | 15 |
| Discover (5×4) | 20 |
| Think Deeper (5+10+5+5) | 25 |
| Innovation Design (5+5+10+5) | 25 |
| Final Challenge (5+5+5) | 15 |

Predikat: 90–100 Sangat Baik · 80–89 Baik · 70–79 Cukup · <70 Perlu Pengembangan.
XP = sama dengan poin per misi (total 100); Level: Explorer → Discoverer → Thinker →
Inventor → Innovation Pioneer.

## Keamanan & Integritas

- **API key AI hanya di Script Properties**; frontend selalu memanggil AI lewat proxy
  Apps Script (`action:"ai"`).
- **Backend menghitung ulang seluruh skor** dari komponen rubrik dengan `clamp(0, max)`;
  skor dari frontend/AI tidak dipercaya sebagai total.
- Submit **idempotent** (upsert berdasarkan Nama+Kelas) — double-submit tidak menduplikasi baris.
- Jika pengiriman gagal, data disimpan di localStorage dan **dikirim ulang otomatis**
  saat halaman hasil dibuka / koneksi kembali.

## Anti-copy / Anti-paste (deterrent sederhana)

- Konten soal, instruksi, feedback AI: `.user-content` (select/copy/context-menu/drag diblock).
- Textarea Think Deeper, Innovation Design, Final Challenge: `data-no-paste="true"`
  (paste diblock + toast). Field Nama/Kelas dan semua input tetap normal.
- Canvas touch drawing, scrolling, keyboard Android tidak terpengaruh.

## AI Failure / Offline

- Jika AI gagal: modal "AI Mentor sedang tidak tersedia" dengan **COBA LAGI** dan
  **LANJUTKAN TANPA AI**; jawaban siswa tidak pernah hilang.
- Final Challenge punya tantangan bawaan jika AI tidak tersedia.

## Teacher Result

Akses dari halaman login → *Teacher Result* atau `index.html#teacher`.
Filter kelas, rekap (jumlah siswa, rata-rata, tertinggi, terendah, jumlah tiap predikat),
tabel hasil per siswa, dan tombol **OPEN GOOGLE SHEETS**.
