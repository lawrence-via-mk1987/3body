import type { EraKind } from '../orbital/types';

export interface TextLog {
  id: string;
  title: string;
  body: string;
  position: { x: number; z: number };
  interactionRadius: number;
  requiresStableEra?: boolean;
}

export const TEXT_LOGS: TextLog[] = [
  {
    id: 'waystone',
    title: 'Waystone Etching',
    position: { x: 8, z: 22 },
    interactionRadius: 4,
    body: 'Fourth cycle since the last Stable Era. We stopped counting the suns and started counting the dead. If you read this, walk toward the broken dome on the eastern ridge. The sky lies there, but so does a little truth.',
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
];

export function canReadLog(log: TextLog, era: EraKind): boolean {
  if (!log.requiresStableEra) {
    return true;
  }
  return era === 'stable';
}
