# CRATER (ENAM)

Crew Resources And Trade-offs for Emergency Response — engine kartu survival Mars
berdasarkan `CRATER-GDD.docx`.

## Struktur Sol

| Fase | Aktivitas | Aturan |
| --- | --- | --- |
| Pagi | Daily Routine | 9 kartu dalam 3 kelompok; ambil 1 per kelompok. Kartu yang dipilih harus langsung dipakai melalui `playNow`; yang tidak dipakai hangus. |
| Siang | Research / Exploration | 3 kartu; pilih 1, jalankan misi atau terima penalti penolakan. |
| Sore | Building / Upgrade | 3 kartu; pilih 1, jalankan proyek atau terima penalti. |
| Malam | Sol Evaluation | Ration, produksi, pemulihan surya, penurunan pasif, efek tertunda, cek hasil. |

## Sistem utama

- Empat meter 0–100, awal 80: Life Support, Radiation Shielding, Power, Food System.
- Food Ration dan Water Ration terpisah, awal 10/10, konsumsi 1 per kru per Sol.
- Empat kru: Toria, Cirra, Corin, Sylvan. Kondisi Siap/Lelah/Tertekan/Tidak Sehat.
- Misi 1/2/4 cycle dengan diminishing returns 100% / +50% / +25% / +10%.
- Trait karakter, bencana 4 jenis, dek Repair 20 kartu, dan akhir Gold/Silver/Bronze.
- Katalog 80 kartu dengan biaya, penalti, durasi, fakta, dan sumber NASA di
  `data/cards.ts`.

## Skrip

```sh
npm install
npm test
npm run typecheck
```
