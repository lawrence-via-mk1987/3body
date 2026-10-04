import { getLogCopy as resolveLogCopy } from '../i18n/logContent';
import type { Locale } from '../i18n/locale';
import type { EraKind } from '../orbital/types';

export interface TextLog {
  id: string;
  title: string;
  body: string;
  position: { x: number; z: number };
  interactionRadius: number;
  requiresStableEra?: boolean;
  /** Meta stage from epilogue clears; tablet hidden until then. */
  requiresWorldStage?: number;
}

export const TEXT_LOGS: TextLog[] = [
  {
    id: 'waystone',
    title: 'Waystone Etching',
    position: { x: 8, z: 22 },
    interactionRadius: 4,
    body: 'Fourth cycle since the last Stable Era. We stopped counting the suns and started counting the dead. Landmarks: east — buried shelter entrance near (-2, 10). Northwest — dehydration pit (-42, 18); read the tablets with F, dehydrate with E only on the ring, not the stone. Southwest grove (28, -32) wakes in a Stable Era. Southeast ridge — broken observatory dome.',
  },
  {
    id: 'observatory',
    title: 'Observatory Shard',
    position: { x: 45, z: -35 },
    interactionRadius: 5,
    body: 'The predictor sang three notes and fell silent. We thought the next Chaotic Era would pass like the others — survivable if we were quick. The flying star came one day early. Our numbers were beautiful. Our timing was not.',
  },
  {
    id: 'shelter_ruin',
    title: 'Collapsed Shelter',
    position: { x: 20, z: -15 },
    interactionRadius: 4.5,
    body: 'Walls of woven bone and clay. A child\'s bowl, still upright. Whoever sealed this place hoped the next civilization would find water in the walls. We left the bowl. We left the hope.',
  },
  {
    id: 'dehydration_rows',
    title: 'Pit Inscription',
    position: { x: -36, z: 24 },
    interactionRadius: 5,
    body: 'Row upon row, bodies folded like parchment. Dehydration is not death — we tell ourselves that. It is waiting. The problem is what waits with you when the suns return.',
  },
  {
    id: 'cave_refuge',
    title: 'Cave Carving',
    position: { x: -5, z: 10 },
    interactionRadius: 4,
    body: 'We dug when the surface became a skillet. The earth remembers cold longer than we remember mercy. If the sky turns red, go down. If the sky turns black, go down faster.',
  },
  {
    id: 'traveler_stone',
    title: 'Traveler\'s Stone',
    position: { x: -16, z: -6 },
    interactionRadius: 4,
    body: 'Do not trust a single sun. Do not trust three. Trust the cracks in the ground — they fill with water only when the world forgets to burn. I am going to the pit. I may not unfold.',
  },
  {
    id: 'grove_hope',
    title: 'Grove Tablet',
    position: { x: 28, z: -32 },
    interactionRadius: 5,
    requiresStableEra: true,
    body: 'A Stable Era is not peace. It is a breath held between catastrophes. We planted nothing permanent. We planted the idea that someone else might live long enough to see green return. You are standing in it. Endure.',
  },
  {
    id: 'final_log',
    title: 'The Final Log',
    position: { x: 32, z: -28 },
    interactionRadius: 4,
    requiresStableEra: true,
    body: 'If you have survived long enough to read this beneath a gentle sun, then our cycle was not wasted. The three-body sky will turn again. Store water. Mark the pit. Teach the next traveler to look up — and to look away when the horizon glows red. Hope is not a prediction. It is a discipline.',
  },
  {
    id: 'distant_sky',
    title: 'Distant Sky Tablet',
    position: { x: 41.5, z: -31.5 },
    interactionRadius: 4.5,
    requiresStableEra: true,
    requiresWorldStage: 5,
    body:
      'The pendulum no longer lies to us about tomorrow — only about how long the calm will last. '
      + 'We fixed a second sky in our charts: a pale, steady star that does not share our three suns. '
      + 'We do not know its name. We know it has a world. We know that someday our descendants may look toward it '
      + 'the way it may already look toward us. Store water anyway. The chaos is still ours.',
  },
];

export function getLogCopy(log: TextLog, locale: Locale): { title: string; body: string } {
  return resolveLogCopy(log.id, log.title, log.body, locale);
}

export function canReadLog(log: TextLog, era: EraKind): boolean {
  if (!log.requiresStableEra) {
    return true;
  }
  return era === 'stable';
}
