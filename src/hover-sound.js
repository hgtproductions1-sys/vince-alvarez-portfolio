// A short, rounded pop with a little paper texture; no external sample.
export function createHoverSamples(rate) {
  const samples = new Float32Array(Math.ceil(rate * .075));
  let seed = 51, previous = 0, phase = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    previous = previous * .55 + (seed / 2147483648 - 1) * .45;
    phase += 2 * Math.PI * (820 - 260 * t / .075) / rate;
    const envelope = Math.min(1, t / .004) * Math.exp(-t * 62) * Math.min(1, (.075 - t) / .012);
    samples[i] = (Math.sin(phase) * .85 + previous * .15) * envelope * .33;
  }
  return samples;
}
