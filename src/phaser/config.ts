import Phaser from 'phaser';
import { OutpostScene } from './OutpostScene';

/** Buat Phaser.Game di dalam `parent`. Ukuran mengikuti container (RESIZE) agar portrait/desktop tidak terdistorsi. */
export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO, // WebGL, jatuh ke Canvas jika perlu
    parent,
    backgroundColor: '#120a08',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth || 360,
      height: parent.clientHeight || 360,
    },
    scene: [OutpostScene],
    audio: { noAudio: true }, // P0 tanpa suara; hindari masalah autoplay
    banner: false,
  });
}
