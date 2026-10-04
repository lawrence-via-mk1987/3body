export const PIT_LANDMARK = { x: -42, z: 18 } as const;
export const GROVE_LANDMARK = { x: 28, z: -32 } as const;
export const SPAWN_HINT = { x: 0, z: 24 } as const;

/** Registrar stands just outside the interaction ring. */
export const PIT_REGISTRAR = { x: -39, z: 21, talkRadius: 7 } as const;

export const OBSERVATORY_LANDMARK = { x: 45, z: -35 } as const;
/**
 * Just outside the observatory door. The drum is ~5 m across, so the old spot (42, -32)
 * sat inside the masonry; talk radius still covers the approach.
 */
export const LAST_PREDICTOR = { x: 40, z: -30, talkRadius: 8 } as const;

export const GROVE_KEEPER = { x: 31, z: -29, talkRadius: 8 } as const;
