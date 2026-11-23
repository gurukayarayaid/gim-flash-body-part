# GIM FLASH BODY PART — Parts of the Body (Bahasa Inggris Kelas 3 SD)

Flashcard interaktif bertema **Parts of the Body** untuk belajar kosakata bahasa Inggris.
Cocok untuk desktop, Interactive Flat Panel (IFP), dan layar sentuh.

## Fitur

- 16 gambar bagian tubuh fotorealistis (head, hair, eye, ear, nose, mouth, teeth, neck,
  shoulder, arm, hand, fingers, leg, knee, foot, toes)
- Kartu bisa dibalik dengan ketukan, tombol **Balik Kartu**, atau tombol Spasi
- Pilihan sisi depan kartu: **gambar** atau **kata**
- Pilihan jumlah kartu: 6 / 8 / 10 / 12 / 16
- Navigasi kartu sebelumnya / berikutnya (tombol atau panah ← →)
- Tanda **Sudah Hafal** dan **Ulangi** untuk setiap kartu
- Halaman hasil: ringkasan kartu hafal, daftar kartu, dan tombol **Ulangi yang Belum**
- Efek suara, tombol layar penuh, pengaturan tersimpan di `localStorage`

## Menjalankan

Situs statis tanpa build. Buka `index.html` langsung, atau jalankan server statis lokal:

```bash
python -m http.server 8000
```

## Struktur

```
index.html
css/style.css
js/data.js     # daftar 16 bagian tubuh
js/flash.js    # logika flashcard
assets/parts   # 16 gambar bagian tubuh
```
