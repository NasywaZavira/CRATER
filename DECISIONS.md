# Addendum v4 – keputusan integrasi (dinyatakan eksplisit)

1. **JSON terbaru mengalahkan katalog GDD yang lama**. Menghapus 80 kartu TS (6 deck) demi 20 kartu JSON (4 kategori). Nilai angka dan NASA fact berasal 1:1 dari file pengguna.
2. **Pagi menawarkan 3 operations**, bukan 9 Daily Routine dalam tiga grup: jumlah card operations hanya 5, sehingga 9 unik tidak mungkin dan addendum tidak menyebut Command Hand.
3. **Siang = research**, **sore = construction**, **FIX/repair muncul pada bencana**. Ini memetakan kategori baru ke fase yang paling dekat dengan GDD. Kategori perbaikan tidak lagi dikunci ke disaster tertentu karena `disasterId` tidak ada di addendum.
4. **Memainkan kartu langsung menerapkan `effects`**, termasuk angka negatif. Tidak ada biaya terpisah, affordability check, trait, staff bonus, cooldown, misi bertahap, atau efek permanen kartu. Skip tidak memberi `rejectionPenalty` karena tidak ada field tersebut.
5. **Delayed** berlaku tepat saat transisi Sol `playedSol + afterSols`, setelah evaluasi malam Sol sebelumnya. Pending di Sol 8 yang jatuh pada Sol 9 tidak diproses karena campaign hanya 8 Sol.
6. **Meter** mulai 80, clamp 0–100, mencapai 0 menyebabkan Abort. Meter yang bernilai 0 pada `effects` berarti tidak berubah, dan UI menampilkannya sebagai `—`.
7. **Lingkungan & kru**: angka recovery, decay, irigasi, produksi, kebutuhan ration malam, 4 astronaut, peluang bencana, dan dampak meter dasar tetap diambil dari GDD/engine sebelumnya. Namun interaksi trait dan buff kru dibuang dari card flow karena tidak memiliki representasi di addendum. Kondisi kru masih dipengaruhi ration malam; kartu tidak mengubah ration/condition.
8. **Ending adaptasi**: meter 0 atau 4 kru unwell = Abort; setelah Sol 8: semua meter ≥70 = Gold, semua ≥40 = Silver, lainnya Bronze. Syarat Gold/Silver tambahan dari GDD (ration dan status astronaut) tidak diterapkan pada medali karena addendum card baru tidak mampu secara langsung memenuhi syarat-syarat itu. Hal ini perlu disetujui desainer jika ingin kembali ke aturan GDD lama.
9. **Repair skip**: tidak diberi penalti tambahan 10, karena addendum tidak mendefinisikan penalti penolakan/biaya. Bencana tetap memiliki kerusakan dasar dari GDD.
10. **Save v4 tidak memigrasi save v2/v3**: kartu lama (DR-/RS-/UP-/...) tidak punya padanan valid. Parser memberi error `unsupported-version` dan **tidak menghapus** save lokal lama secara otomatis.
11. **Art** hanya key metadata `artKey` dalam JSON. ZIP engine yang diserahkan tidak punya folder sprites; tidak ada karya seni pengguna yang disentuh atau dibuat ulang.
12. **Sumber NASA**: sourceUrl null tetap null, tidak menambahkan atau mengklaim telah memverifikasi tautan NASA.
