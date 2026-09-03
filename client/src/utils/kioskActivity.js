export const kioskActivityEvents = ['touchstart', 'pointerdown', 'keydown', 'wheel'];

const kioskActivityEventSet = new Set(kioskActivityEvents);

export function isDeliberateKioskActivity(event) {
  return Boolean(event?.isTrusted && kioskActivityEventSet.has(event.type));
}

export function shouldUseKioskInactivityTimer(pathname) {
  const path = String(pathname || '');
  return !path.startsWith('/information') && path !== '/qr-tavojnya';
}
