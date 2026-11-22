// Decides whether the app plays animations and records it on <html data-motion="full|reduced">.
// Default: follow the phone's "reduce motion" / "remove animations" setting.
// A student can choose "always animate"; that choice is saved on the device.
const KEY = 'fc_motion_v1'

export function systemPrefersReduced() {
  try {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export function getMotionChoice() {
  try {
    return window.localStorage.getItem(KEY) === 'full' ? 'full' : 'system'
  } catch {
    return 'system'
  }
}

export function setMotionChoice(choice) {
  try {
    if (choice === 'full') window.localStorage.setItem(KEY, 'full')
    else window.localStorage.removeItem(KEY)
  } catch {
    /* non-fatal */
  }
}

export function initMotion() {
  const effective = getMotionChoice() === 'full' || !systemPrefersReduced() ? 'full' : 'reduced'
  document.documentElement.dataset.motion = effective
  return effective
}
