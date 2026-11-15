# Integrasi ke proyek tim CRATER

Tugas Akbar: menghubungkan scene Phaser Mars Outpost dan elemen tutorial HUD. Toria, Sylvan, Corin, Cirra, dan Noe memakai PNG original tanpa desain ulang.

- React bertugas menampilkan UI tutorial, card selection dan hitungan 15 detik (`src/App.tsx`).
- Phaser bertugas mengatur layer environment + empat karakter (`src/phaser/OutpostScene.ts`).
- React memberi `SceneSnapshot` ke Phaser lewat `SceneBridge`. Contoh `available:false` saat astronaut bekerja, lalu `available:true` saat kembali.
- `src/demo/game.ts` dan `src/demo/cards.ts` adalah logic sementara. Jangan duplikasi logika sumber daya dengan engine Pocut saat integrasi. Sambungkan State engine Pocut ke `SceneSnapshot` dan UI dengan format yang disepakati tim.
- Empat meter saat ini 0–100, nilai awal 80. Timer 15 detik adalah permintaan untuk prototype, bukan aturan durasi penuh GDD.
- Noe dan kartu memakai elemen DOM/React di atas canvas Phaser sehingga tombol berfungsi dan HUD tidak ikut bergerak bersama sprite.

File penting: `src/App.tsx`, `src/styles/outpost.css`, `src/bridge/SceneBridge.tsx`, `src/phaser/OutpostScene.ts`, `public/assets`.
