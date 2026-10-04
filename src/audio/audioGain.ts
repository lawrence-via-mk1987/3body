/** UI slider is 0–1; Web Audio master can run hotter so 100% is clearly audible. */
export const MASTER_VOLUME_BOOST = 2.65;

export function masterGainFromSlider(slider: number): number {
  const clamped = Math.min(Math.max(slider, 0), 1);
  return clamped * MASTER_VOLUME_BOOST;
}
