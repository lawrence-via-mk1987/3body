import { resolveRenderQuality } from './renderQuality';

export type DeviceKind = 'mobile' | 'tablet' | 'desktop';

export interface DeviceProfile {
  kind: DeviceKind;
  /** Use on-screen sticks/buttons instead of pointer lock + keyboard. */
  prefersTouchControls: boolean;
  coarsePointer: boolean;
  maxTouchPoints: number;
}

export function detectDeviceProfile(): DeviceProfile {
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const narrowViewport = window.matchMedia('(max-width: 900px)').matches;
  const ua = navigator.userAgent;
  const uaMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const uaTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua)
    || (ua.includes('Android') && !ua.includes('Mobile'));

  let kind: DeviceKind = 'desktop';
  if (uaTablet || (coarsePointer && maxTouchPoints > 0 && window.innerWidth >= 768)) {
    kind = 'tablet';
  } else if (uaMobile || narrowViewport || (coarsePointer && maxTouchPoints > 0)) {
    kind = 'mobile';
  }

  const prefersTouchControls = kind !== 'desktop'
    || (coarsePointer && maxTouchPoints > 0 && narrowViewport);

  return {
    kind,
    prefersTouchControls,
    coarsePointer,
    maxTouchPoints,
  };
}

export function applyDeviceProfileToDocument(profile: DeviceProfile): void {
  const quality = resolveRenderQuality(profile);
  document.body.dataset.device = profile.kind;
  document.body.dataset.touchControls = profile.prefersTouchControls ? 'true' : 'false';
  document.body.dataset.renderTier = quality.tier;
  document.body.dataset.ssao = quality.ssao ? 'on' : 'off';
  if (profile.prefersTouchControls) {
    document.body.classList.add('touch-ui');
  }
}
