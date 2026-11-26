// One phone number, one account, however the student types it.
//
// Accounts are keyed by a made-up email built from the phone number. Until now that used the
// digits exactly as typed, so 0803..., +234803... and 234803... were three different accounts.
// New accounts always use the standard local form (0 + 10 digits). Log-in also tries the older
// forms, so accounts created before this change keep working.

const NIGERIAN_LOCAL = /^0[789]\d{9}$/

/** Standard form: Nigerian numbers become 0XXXXXXXXXX; other numbers keep their digits. */
export function normalizePhone(input) {
  let d = String(input || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2) // 00234... dialled from abroad
  if (d.startsWith('234') && d.length === 13) return '0' + d.slice(3)
  if (d.length === 10 && /^[789]/.test(d)) return '0' + d // the leading 0 was left off
  return d
}

export function isValidPhone(input) {
  const n = normalizePhone(input)
  if (NIGERIAN_LOCAL.test(n)) return true
  if (n.startsWith('0') || n.startsWith('234')) return false // looks Nigerian but is the wrong length
  return n.length >= 8 && n.length <= 15 // numbers from other countries
}

const emailFor = (digits) => `${digits}@firstclass.app`

/** The account email for a NEW sign-up. */
export function phoneToEmail(input) {
  return emailFor(normalizePhone(input))
}

/** Every email an existing account for this number could have been created under, best guess first. */
export function loginEmailCandidates(input) {
  const typed = String(input || '').replace(/\D/g, '')
  const std = normalizePhone(input)
  const list = [std, typed]
  if (NIGERIAN_LOCAL.test(std)) list.push('234' + std.slice(1), std.slice(1))
  return [...new Set(list.filter(Boolean))].map(emailFor)
}

const WRONG_CREDENTIALS = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/user-not-found',
  'auth/wrong-password'
])

/**
 * Try each possible account email until one signs in.
 * Only "no such account / wrong password" moves on to the next one. Anything else
 * (no internet, blocked account, too many attempts) stops at once with its own message.
 */
export async function logInWithCandidates(phoneNumber, password, signIn) {
  const emails = loginEmailCandidates(phoneNumber)
  let firstError = null
  for (const email of emails) {
    try {
      return await signIn(email, password)
    } catch (err) {
      if (!WRONG_CREDENTIALS.has(err && err.code)) throw err
      firstError = firstError || err
    }
  }
  throw firstError || Object.assign(new Error('no phone number'), { code: 'auth/invalid-credential' })
}
