// Admin actions. Kept free of Firebase imports so the rules can be tested with plain mocks.
// Every action first proves the caller is an admin, and writes a line to the admin log.

const ADMIN_PHONES = require('./adminPhones')
const MIN_PASSWORD = 8
const MAX_PASSWORD = 64

class AdminError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code // maps to a Firebase HttpsError code in index.js
  }
}

async function isAdmin(db, uid) {
  if (!uid) return false
  const snap = await db.doc(`admins/${uid}`).get()
  return snap.exists
}

async function requireAdmin(db, callerUid) {
  if (!callerUid) throw new AdminError('unauthenticated', 'Please log in first.')
  if (!(await isAdmin(db, callerUid))) throw new AdminError('permission-denied', 'This action is for FirstClass admins only.')
}

function requireTarget(data) {
  const uid = data && data.uid
  if (typeof uid !== 'string' || !uid || uid.length > 128 || uid.includes('/')) {
    throw new AdminError('invalid-argument', 'Missing or invalid student.')
  }
  return uid
}

async function log(db, entry, now) {
  await db.collection('adminLog').add({ ...entry, at: now() })
}

/** Set a temporary password. The student is told to change it at their next visit. */
async function resetPassword({ db, auth, now }, callerUid, data) {
  await requireAdmin(db, callerUid)
  const uid = requireTarget(data)
  const pw = data.newPassword
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD || pw.length > MAX_PASSWORD) {
    throw new AdminError('invalid-argument', `The temporary password must be ${MIN_PASSWORD} to ${MAX_PASSWORD} characters.`)
  }
  if (await isAdmin(db, uid)) throw new AdminError('failed-precondition', 'An admin account cannot be reset from here.')
  try {
    await auth.updateUser(uid, { password: pw })
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') throw new AdminError('not-found', 'No such student.')
    throw e
  }
  await auth.revokeRefreshTokens(uid) // signs the student out of any device still logged in
  await db.doc(`users/${uid}`).set({ mustChangePassword: true }, { merge: true })
  await log(db, { action: 'reset-password', target: uid, by: callerUid }, now) // the password itself is never logged
  return { ok: true }
}

/** Block or unblock an account. */
async function setDisabled({ db, auth, now }, callerUid, data) {
  await requireAdmin(db, callerUid)
  const uid = requireTarget(data)
  if (typeof data.disabled !== 'boolean') throw new AdminError('invalid-argument', 'Say whether to block or unblock.')
  if (uid === callerUid) throw new AdminError('failed-precondition', 'You cannot block your own account.')
  if (await isAdmin(db, uid)) throw new AdminError('failed-precondition', 'An admin account cannot be blocked from here.')
  try {
    await auth.updateUser(uid, { disabled: data.disabled })
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') throw new AdminError('not-found', 'No such student.')
    throw e
  }
  if (data.disabled) await auth.revokeRefreshTokens(uid)
  await db.doc(`users/${uid}`).set({ disabled: data.disabled }, { merge: true })
  await log(db, { action: data.disabled ? 'block' : 'unblock', target: uid, by: callerUid }, now)
  return { ok: true }
}

/**
 * Called after login. If this account was registered with one of the listed admin numbers,
 * make it an admin. Anyone else simply gets { admin: false }.
 * The phone number is read from the verified login token, never from anything the app sends.
 */
async function claimAdmin({ db, now }, callerUid, tokenEmail) {
  if (!callerUid) throw new AdminError('unauthenticated', 'Please log in first.')
  if (await isAdmin(db, callerUid)) return { admin: true }
  const m = /^(\d+)@firstclass\.app$/.exec(String(tokenEmail || ''))
  if (!m || !ADMIN_PHONES.includes(m[1])) return { admin: false }
  await db.doc(`admins/${callerUid}`).set({ role: 'owner', phone: m[1], claimedAt: now() })
  await log(db, { action: 'admin-claimed', target: callerUid, by: callerUid }, now)
  return { admin: true }
}

module.exports = { resetPassword, setDisabled, claimAdmin, isAdmin, AdminError, MIN_PASSWORD, MAX_PASSWORD }
