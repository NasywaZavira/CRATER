# DECISIONS

Catatan ambiguitas yang dipertahankan/ditafsirkan tanpa menambah mekanik baru.

## E1 — Command Hand

- `CONFIRM_MORNING.playNow` menjalankan kartu, `store` menyimpan kartu ke
  Command Hand dengan `remainingSols = validitySol`, sisanya hangus.
- Kapasitas Command Hand memakai `balance.commandHandCapacity` (4).
- `USE_STORED` boleh dipakai pada siang, sore, malam (sebelum `END_SOL`), dan
  saat `phaseState === 'repair'`.
- `remainingSols` dikurangi 1 pada akhir Sol; kartu dengan nilai 0 dibuang.

## E2 — Daily Routine

- DR-01 “misi fisik berikutnya” ditafsirkan sebagai kartu misi berkategori
  `exploration` atau `build` yang membutuhkan kru. Bonus +1 diterapkan ke
  meter positif utama dan buff dikonsumsi saat dipakai.
- DR-03 dipulihkan pada malam hari setelah ration dibagikan; hanya kru dengan
  ration makanan dan air lengkap.
- DR-06 melindungi kru yang ditugaskan pada misi berat berikutnya; nilai 2 jika
  Corin termasuk kru yang ditugaskan.
- DR-08 dipindahkan dari field khusus ke `activeBuffs` dengan kind
  `exploration-risk-reduction`.
- DR-11 meramal satu bencana pertama pada fase tersisa di Sol yang sama.
  `dayForecast` hanya menyimpan satu entri sesuai permintaan; fase sebelum
  entri tersebut tetap memakai roll normal. Jika roll normal memunculkan
  bencana lebih awal, entri ramalan tidak dihapus (ambiguitas GDD).
- DR-12 memakai `requirements.minMeter` Radiation Shielding ≥ 40 dan
  `blockedByDisaster: ['dustStorm']`.

## E3 — Bencana

- “Tiga fase berlalu” diimplementasikan sebagai selisih indeks fase absolut
  minimal 3.
- Penalti repair −10 diterapkan ke empat meter, sesuai perilaku kode lama.
- Bencana menggantikan fase normal dan menampilkan kartu Repair.
- Irigasi tetap dihitung pada malam ketika kebun tidak beroperasi sebagai
  dampak lanjutan kerusakan tanaman (perilaku kode lama).
- Penentuan “kru luar angkasa” belum ada sebelum E6; karena itu SEP mengenai
  semua kru yang belum Tidak Sehat. Kru yang sudah Tidak Sehat tetap Tidak
  Sehat.
- Dampak lanjutan SEP hanya aktif pada Sol berikutnya dan jika Radiation
  Shielding < 60.
- Dampak lanjutan Badai Debu, Kebocoran Airlock, dan Kerusakan Tanaman
  diterapkan pada perhitungan produksi/pemulihan Power karena secara GDD
  mengubah angka malam tersebut, walaupun daftar urutan §2.4 menaruh dampak
  lanjutan di langkah 6.

## E4 — Malam dan Ending

- Urutan penyembuhan Corin: setelah konsumsi ration dan anxiety, sebelum
  pemulihan Lelah dari upgrade UP-07.
- Laporan Sol dibangun sebelum pemeriksaan hasil, sehingga memuat kondisi
  akhir malam.
- Kegagalan meter memakai teks dari GDD §3; jika beberapa meter 0, teks
  digabung dengan `; `.

## E5 — Save

- Format save menyimpan `hand`, `morningGroups`, dan
  `activeDisaster.repairChoices` sebagai ID kartu.
- Migrasi v2→v3 menambahkan field baru dengan default dan mengubah
  `nextExplorationRiskReduction` menjadi `activeBuffs`.
- Validasi memakai `commandHandCapacity` default 4; `parseSave` menerima
  parameter kapasitas opsional.
- Save hanya ditulis saat batas fase (`sol`, `cycle`, atau `phase` berubah).

## E6 — Penyelesaian misi

- E6 dilewati. `activeMissions` selalu `[]` dan efek misi tetap diterapkan saat
  misi dimulai, sesuai perilaku kode lama. Schema tetap menyertakan field
  tersebut agar save v3 kompatibel.
