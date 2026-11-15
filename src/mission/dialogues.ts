/** Transkrip sesuai "macam macam dialog.docx"; urutan dan kata-katanya dipertahankan. */
export type FailureMeter = 'lifeSupport' | 'shielding' | 'power' | 'food';

export const OPENING_LINES: readonly string[] = [
  "Hello, Commander! Can you hear me? This is Noe, calling from Mission Control on Earth.",
  "Welcome to Mars. You are now in charge of CRATER Outpost, a small base far from home.",
  "Four crew members are counting on you: two engineers, a medic, and a botanist.",
  "Mars is beautiful, but it is not kind. There is little air to breathe and no one nearby to help.",
  "Your mission is to keep your crew alive for 8 sols. A sol is one day on Mars.",
  "Every sol, I will be waiting for your report back on Earth.",
  "Ready, Commander? Sol 1 begins now.",
] as const;

export const FAILURE_LINES: Record<FailureMeter, readonly string[]> = {
  lifeSupport: [
  "Commander, the air and water systems have failed. I’ll say it plainly: this mission has to end early.",
  "Your crew made it to the emergency shelter, and they are safe. But CRATER Outpost cannot keep anyone going without air and water, so we are calling off the mission.",
  "Your journal shows Life Support kept dropping while other things got your attention. Air and water come first, because everything else depends on them.",
  "Tip for next time: pick a card like Clean Air Filter or Fix Water Pump before the meter gets low. A small fix early costs less than a big one late.",
  "Real astronauts know this too. The ISS recycles about 98% of its water, so less has to be shipped up from Earth.",
  "Ready to try again, Commander?",
],
  shielding: [
  "Commander, the radiation shielding has failed. This mission has to end early.",
  "The crew is safe in the shelter, but they have been exposed to too much radiation. Our medic says everyone needs to come home for check-ups.",
  "Space radiation is invisible, so it is easy to forget. Your journal shows Shielding slipping day after day.",
  "Tip for next time: build a Regolith Shield early, and use Read Space Weather Report so you see solar storms coming.",
  "In May 2024, a solar storm hit Mars. An astronaut standing next to the Curiosity rover would have received radiation equal to 30 chest X-rays.",
  "Shall we try again, Commander?",
],
  power: [
  "Commander, the outpost has run out of power. This mission has to end early.",
  "The lights, heaters, and pumps have all shut down, and Mars gets very cold. Your crew is safe in their suits, but they cannot stay.",
  "Power runs everything else, and your journal shows it kept draining faster than you refilled it.",
  "Tip for next time: upgrade the Solar Array early, and keep an eye on dust with Dust Off Solar Panels. Power-Saving Mode helps in a pinch, but it has a price too.",
  "NASA’s InSight lander ran on solar power for over four years, until dust piled up on its panels.",
  "Want to take another turn, Commander?",
],
  food: [
  "Commander, the food supplies have run out. This mission has to end early.",
  "Your crew is hungry and too weak to keep working. The outpost is safe, but we need to bring everyone home.",
  "Plants take time to grow, and a garden planted on Sol 7 cannot feed anyone on Sol 8. Your journal shows Food was low for a long time.",
  "Tip for next time: plant your Plant Garden early, and use Plan the Meals to make supplies last.",
  "NASA grew radishes on the ISS because they are ready in just 27 days. Even in space, plants take time.",
  "Ready for another try, Commander?",
],
};

export const SUCCESS_LINES: readonly string[] = [
  "Commander, I just received your final report. Sol 8 is complete!",
  "Air, shielding, power, and food are all still running, and your crew is safe and healthy.",
  "I’ll be specific, because you earned it: you kept every system above {threshold}%, even though every card had a cost.",
  "Those choices were not easy. Every card helped something and cost something, and you chose carefully. That is what a real mission commander does.",
  "My messages were slow, and you often had to decide on your own. You did it well.",
  "Your crew has packed up CRATER Outpost. They are ready to go home.",
  "Thank you, Commander. Mission complete. Welcome home!",
] as const;

/** `threshold` belum diberi angka dalam DOCX; nilainya disuplai dari aturan game. */
export function successLines(threshold: number): string[] {
  return SUCCESS_LINES.map(line => line.replace('{threshold}', String(threshold)));
}
