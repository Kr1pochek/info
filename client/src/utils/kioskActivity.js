export const kioskActivityEvents = ['touchstart', 'pointerdown', 'keydown', 'wheel'];

const kioskActivityEventSet = new Set(kioskActivityEvents);

export function isDeliberateKioskActivity(event) {
  return Boolean(event?.isTrusted && kioskActivityEventSet.has(event.type));
}
