# CRATER — Mission Briefing & Ending (integrasi ke enam(4))

## Sudah dipasang

- `src/mission/MissionCinematic.tsx`: scene briefing, title CRATER, fade ke dialog Noe, laporan ending, tombol Continue/Start Mission/Play Again.
- `src/mission/dialogues.ts`: dialog pembuka serta 4 bad ending dan 1 good ending dari `macam macam dialog.docx`.
- `src/mission/ending.ts`: helper `resolveMissionEnding` untuk koneksi ke state engine ketika tersedia.
- `src/styles/mission-cinematic.css`: bintang dan layout responsive seperti referensi.
- `src/App.tsx`: dipasangi alur pembuka -> scene Phaser -> ending preview, **tanpa mengganti kode Phaser atau kontrol existing**.
- `tests/mission/ending.test.ts`: pengujian kondisi ending.

**Portrait menggunakan `public/assets/NOE.png` dari ZIP ini sendiri**, dengan frame dan tulisan NOE S. yang memang sudah jadi bagian gambar. Karakter lain dan seluruh aset PNG tidak diubah.

## Cara menjalankan

```bash
npm install
npm run dev
```

Pertama akan muncul **Mission Briefing** -> **CRATER** -> dialog Noe. Tekan **CONTINUE** di tiap dialog, lalu **START MISSION** untuk membuka outpost.

Kontrol scene Phaser sebelumnya tetap aktif:

- `1`, `2`, `3`, `4`: karakter keluar/masuk saat bekerja
- `P`, `S`, `E`, `M`: morning, afternoon, evening, night
- `R`: reset scene snapshot

## Cara uji 5 ending di ZIP Phaser ini

Di tampilan outpost, tekan:

- `Shift+1`: Life Support Failure
- `Shift+2`: Shielding Failure
- `Shift+3`: Power Failure
- `Shift+4`: Food Failure
- `Shift+5`: Good Ending

Atau buka langsung lewat query URL, misalnya:

- `http://localhost:5173/?ending=lifeSupport`
- `http://localhost:5173/?ending=success`

Akhir dialog menampilkan **PLAY AGAIN**, yang kembali ke pembukaan.

## Batasan (penting)

**File ZIP `enam(4).zip` hanya berisi SceneBridge + Phaser outpost dan fixture.** Tidak ada state meter, kartu, save, engine, atau gameReducer. Karena itu, tidak mungkin mendapatkan ending dari status resource *sebenarnya* hanya dari snapshot scene tersebut. Shortcut di atas adalah **preview**, bukan keputusan engine yang sesungguhnya.

Untuk integrasi ke engine nanti, masukkan data asli engine sesuai interface di `src/mission/ending.ts`:

```tsx
import { resolveMissionEnding } from './mission/ending';

const result = resolveMissionEnding({
  sol: gameState.sol,
  ended: gameState.ended,
  meters: gameState.meters, // lifeSupport, shielding, power, food
});
// Jika result bukan null, tampilkan <MissionCinematic mode="ending" result={result} ... />
```

`threshold` pada dialog keberhasilan masih placeholder di DOCX. Saat preview nilainya 0, bukan persyaratan kelulusan yang sudah disepakati. Ubah setelah aturan keberhasilan ditetapkan tim.

## File yang disentuh

**Modified**: `src/App.tsx`.

**Added**: `src/mission/MissionCinematic.tsx`, `src/mission/dialogues.ts`, `src/mission/ending.ts`, `src/styles/mission-cinematic.css`, `tests/mission/ending.test.ts`, `src/contracts/fixtures.ts` (shim test lama), `README_CINEMATIC.md`.

Tidak ada file asset, Phaser, bridge, dependency, dan file lain yang diubah.

### Perbaikan kompatibilitas bawaan ZIP
`tests/bridge/typed-event-bus.test.ts` bawaan masih mengimpor `src/contracts/fixtures.ts`, sedangkan modul aslinya berada di `src/bridge/fixtures.ts`. Agar perintah `npm run typecheck` / `npm run build` tidak gagal karena import tersebut, ditambahkan **re-export** `src/contracts/fixtures.ts` tanpa mengubah isi fixture atau file tes lama.
