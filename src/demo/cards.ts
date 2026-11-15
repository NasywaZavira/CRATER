/** CRATER: katalog mini untuk PROTOTYPE HUD, diambil dari GDD.
 * Efek meter adalah efek netto yang langsung diperagakan; penugasan multi-cycle,
 * trait, ration, unlock, serta teknologi permanen belum dihitung di prototype.
 */
export type Phase = 'morning' | 'afternoon' | 'evening';
export type MeterKey = 'life' | 'shielding' | 'power' | 'food';
export type CrewId = 'toria' | 'sylvan' | 'corin' | 'cirra';
export interface ActionCard {
  id: string;
  title: string;
  detail: string;
  deck: 'Daily Routine' | 'Research' | 'Exploration' | 'Building' | 'Upgrade';
  phase: Phase;
  crew: CrewId;
  delta: Partial<Record<MeterKey, number>>;
  science: string;
  quote: string;
}

export const METERS: Array<{ key: MeterKey; label: string; color: string; symbol: string }> = [
  { key: 'life', label: 'LIFE SUPPORT', color: '#65d2e4', symbol: '+' },
  { key: 'power', label: 'POWER', color: '#ffc24f', symbol: 'ϟ' },
  { key: 'shielding', label: 'SHIELDING', color: '#dcaddf', symbol: '⬡' },
  { key: 'food', label: 'FOOD SYSTEM', color: '#84e5a9', symbol: '♜' },
];

// Ditulis eksplisit agar gampang diganti dengan data kartu dari engine Pocut nanti.
export const CARD_POOL: ActionCard[] = [
  { id:'DR-09', phase:'morning', deck:'Daily Routine', title:'Periksa CO₂ Kabin', detail:'Kalibrasi sensor udara dan pemeriksaan scrubber.', crew:'corin', delta:{life:7,power:-2}, science:'Kadar CO₂ kabin harus diawasi agar kru dapat bernapas dengan aman.', quote:'Pembacaan CO₂ stabil. Kita bisa bernapas lebih lega.' },
  { id:'DR-10', phase:'morning', deck:'Daily Routine', title:'Periksa Airlock', detail:'Cek segel termal agar udara habitat tak bocor.', crew:'toria', delta:{life:5,power:3}, science:'Tekanan atmosfer Mars sangat rendah dibandingkan Bumi.', quote:'Tidak ada kebocoran. Semua segel terkunci rapat.' },
  { id:'DR-12', phase:'morning', deck:'Daily Routine', title:'Bersihkan Panel Surya', detail:'Singkirkan debu Mars dari permukaan panel.', crew:'cirra', delta:{power:9}, science:'Debu dapat mengurangi produksi energi panel surya.', quote:'Panel sudah bersih. Aliran listrik kembali meningkat!' },
  { id:'DR-13', phase:'morning', deck:'Daily Routine', title:'Bersihkan Filter Udara', detail:'Rawat HEPA dan pengaliran udara habitat.', crew:'toria', delta:{life:6,power:3}, science:'Filter harus dibersihkan secara berkala agar udara tetap mengalir.', quote:'Udara di ruangan terasa lebih segar sekarang.' },
  { id:'DR-15', phase:'morning', deck:'Daily Routine', title:'Cek Suhu Baterai', detail:'Perbaiki stabilitas baterai pada suhu dingin.', crew:'cirra', delta:{life:-2,power:8}, science:'Suhu ekstrem Mars memengaruhi performa penyimpanan energi.', quote:'Baterai aman, tetapi pendingin kabin bekerja lebih berat.' },
  { id:'DR-16', phase:'morning', deck:'Daily Routine', title:'Rawat Kebun Hidroponik', detail:'Periksa pH, kelembapan, dan lampu tumbuh.', crew:'sylvan', delta:{food:7,power:-2}, science:'Tanaman menggunakan pencahayaan khusus untuk fotosintesis.', quote:'Kebun membutuhkan listrik, tetapi hasilnya bagus.' },

  { id:'RS-02', phase:'afternoon', deck:'Research', title:'Setel MOXIE', detail:'Uji pemisahan oksigen dari atmosfer CO₂ Mars.', crew:'corin', delta:{life:12,power:-6}, science:'MOXIE mendemonstrasikan produksi oksigen dari CO₂ Mars.', quote:'Oksigen bertambah. Pengujian tadi memang boros daya.' },
  { id:'RS-03', phase:'afternoon', deck:'Research', title:'Uji Pelindung Regolith', detail:'Analisis ketebalan tanah untuk peredam radiasi.', crew:'corin', delta:{shielding:12,power:-4}, science:'Lapisan tanah Mars dapat membantu melindungi habitat dari radiasi.', quote:'Sampel ini dapat memperkuat pelindung kita.' },
  { id:'RS-04', phase:'afternoon', deck:'Research', title:'Uji LED Tanaman', detail:'Cari spektrum lampu yang mendukung pertumbuhan.', crew:'sylvan', delta:{food:10,power:1}, science:'LED merah, biru, dan hijau dipakai dalam penelitian tanaman luar angkasa.', quote:'Tanaman merespons pencahayaan baru dengan baik.' },
  { id:'RS-08', phase:'afternoon', deck:'Research', title:'Kultur Sianobakteri', detail:'Uji mikroorganisme fotosintetik untuk dukungan habitat.', crew:'corin', delta:{life:8,food:8,power:-4}, science:'Sianobakteri dapat melakukan fotosintesis.', quote:'Progres kultur menjanjikan, meski membutuhkan energi.' },
  { id:'EX-02', phase:'afternoon', deck:'Exploration', title:'Kumpulkan Regolith', detail:'Cari material untuk lapisan pelindung atap.', crew:'sylvan', delta:{shielding:14,power:-3}, science:'Regolith adalah material batuan dan debu di permukaan Mars.', quote:'Tanah yang terkumpul cukup untuk perkuatan berikutnya.' },
  { id:'EX-04', phase:'afternoon', deck:'Exploration', title:'Survei Batuan Nitrat', detail:'Ambil sampel batuan untuk nutrisi tanaman.', crew:'sylvan', delta:{food:12,power:-4}, science:'Mineral pada batuan Mars menjadi objek penelitian nutrisi tanaman.', quote:'Aku menemukan sampel yang menarik untuk kebun kita.' },
  { id:'EX-07', phase:'afternoon', deck:'Exploration', title:'Survei Delta Jezero', detail:'Selidiki tanah liat dan pelindung alami.', crew:'sylvan', delta:{food:8,shielding:8,power:-3}, science:'Delta Jezero menyimpan endapan dari lingkungan Mars purba.', quote:'Lapisan ini menyimpan lebih banyak petunjuk dari dugaanku.' },

  { id:'BL-01', phase:'evening', deck:'Building', title:'Rancang Reaktor Kilopower', detail:'Bangun sumber listrik yang tak bergantung Matahari.', crew:'toria', delta:{power:10,life:4,shielding:-4}, science:'Konsep Kilopower diteliti sebagai sumber energi antariksa.', quote:'Kita memperoleh cadangan daya, tetapi pembangunan berisiko.' },
  { id:'BL-03', phase:'evening', deck:'Building', title:'Kubah Regolith', detail:'Bentuk penahan radiasi di sekeliling habitat.', crew:'toria', delta:{shielding:18,life:5,power:-8}, science:'Penimbunan material dapat memberi perlindungan radiasi tambahan.', quote:'Strukturnya kokoh. Kita lebih terlindungi sekarang.' },
  { id:'BL-04', phase:'evening', deck:'Building', title:'Menara Aeroponik', detail:'Rakit unit penanaman modular berkapasitas lebih tinggi.', crew:'toria', delta:{food:15,power:-5}, science:'Aeroponik adalah teknik menumbuhkan tanaman tanpa tanah.', quote:'Kita punya ruang baru untuk menanam.' },
  { id:'BL-07', phase:'evening', deck:'Building', title:'Panel Surya Baru', detail:'Tambah panel dengan sudut penempatan yang lebih baik.', crew:'toria', delta:{power:10}, science:'Arah dan sudut panel menentukan paparan sinar Matahari.', quote:'Panel terpasang. Energi bisa lebih stabil.' },
  { id:'UP-02', phase:'evening', deck:'Upgrade', title:'Pengendali Microgrid', detail:'Kurangi beban listrik ruangan kosong.', crew:'cirra', delta:{power:8,life:5}, science:'Manajemen beban membantu menekan pemakaian listrik.', quote:'Sistem kini menghemat lebih banyak energi.' },
  { id:'UP-04', phase:'evening', deck:'Upgrade', title:'LED Spektrum Baru', detail:'Pasang pencahayaan kebun yang lebih efisien.', crew:'cirra', delta:{food:14,power:0}, science:'Spektrum cahaya berbeda dapat membantu pertumbuhan tanaman.', quote:'Kebutuhan daya seimbang dan tanaman tumbuh lebih baik.' },
  { id:'UP-06', phase:'evening', deck:'Upgrade', title:'Lapisan Polimer', detail:'Pertebal pelindung habitat dengan bahan kaya hidrogen.', crew:'cirra', delta:{shielding:16,power:-4}, science:'Bahan kaya hidrogen diteliti untuk pengurangan paparan radiasi.', quote:'Lapisan tambahan sudah terpasang.' },
  { id:'UP-07', phase:'evening', deck:'Upgrade', title:'Scrubber CO₂ Baru', detail:'Perkuat sistem penyaringan udara kabin.', crew:'cirra', delta:{life:15,power:-6}, science:'Sistem scrubber membantu mengendalikan konsentrasi CO₂.', quote:'Sirkulasi udara bekerja lebih efektif sekarang.' },
];

/** Undian tiga kartu TANPA pengulangan dalam satu penawaran. */
export function drawThree(phase: Phase, random: () => number = Math.random): ActionCard[] {
  const pool = CARD_POOL.filter(card => card.phase === phase);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
