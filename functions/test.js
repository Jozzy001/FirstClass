// Plain-Node tests for the admin rules, using in-memory stand-ins for Firebase.
const assert = require('assert')
const L = require('./logic')

function make({ admins = [], users = {} } = {}) {
  const docs = new Map()
  admins.forEach((a) => docs.set(`admins/${a}`, {}))
  Object.keys(users).forEach((u) => docs.set(`users/${u}`, {}))
  const logs = []
  const calls = []
  const db = {
    doc: (p) => ({
      get: async () => ({ exists: docs.has(p) }),
      set: async (d, o) => { docs.set(p, { ...(docs.get(p) || {}), ...d }); calls.push(['set', p, d, o]) }
    }),
    collection: (c) => ({ add: async (d) => { logs.push({ c, ...d }) } })
  }
  const auth = {
    updateUser: async (uid, patch) => {
      if (!users[uid]) { const e = new Error('nf'); e.code = 'auth/user-not-found'; throw e }
      Object.assign(users[uid], patch); calls.push(['updateUser', uid, patch])
    },
    revokeRefreshTokens: async (uid) => calls.push(['revoke', uid])
  }
  return { deps: { db, auth, now: () => 'T' }, docs, logs, calls, users }
}
const rejects = async (p, code) => {
  try { await p } catch (e) { assert.strictEqual(e.code, code, `expected ${code}, got ${e.code}: ${e.message}`); return }
  assert.fail(`expected rejection with ${code}`)
}
;(async () => {
  // not logged in
  let m = make({ admins: ['boss'], users: { s1: {} } })
  await rejects(L.resetPassword(m.deps, null, { uid: 's1', newPassword: 'abcdefgh' }), 'unauthenticated')
  // a normal student cannot reset anyone, including themselves
  await rejects(L.resetPassword(m.deps, 's1', { uid: 's1', newPassword: 'abcdefgh' }), 'permission-denied')
  await rejects(L.setDisabled(m.deps, 's1', { uid: 's1', disabled: true }), 'permission-denied')
  assert.strictEqual(m.calls.length, 0, 'nothing may change for a non-admin')
  // admin: password rules
  await rejects(L.resetPassword(m.deps, 'boss', { uid: 's1', newPassword: 'short' }), 'invalid-argument')
  await rejects(L.resetPassword(m.deps, 'boss', { uid: 's1', newPassword: 12345678 }), 'invalid-argument')
  await rejects(L.resetPassword(m.deps, 'boss', { uid: '', newPassword: 'abcdefgh' }), 'invalid-argument')
  await rejects(L.resetPassword(m.deps, 'boss', { uid: 'a/b', newPassword: 'abcdefgh' }), 'invalid-argument')
  await rejects(L.resetPassword(m.deps, 'boss', { uid: 'ghost', newPassword: 'abcdefgh' }), 'not-found')
  // admin: success
  const r = await L.resetPassword(m.deps, 'boss', { uid: 's1', newPassword: 'abcdefgh' })
  assert.deepStrictEqual(r, { ok: true })
  assert.strictEqual(m.users.s1.password, 'abcdefgh')
  assert(m.calls.some((c) => c[0] === 'revoke' && c[1] === 's1'), 'sessions revoked')
  assert.strictEqual(m.docs.get('users/s1').mustChangePassword, true)
  assert.strictEqual(m.logs.length, 1)
  assert(!JSON.stringify(m.logs).includes('abcdefgh'), 'password must never reach the log')
  assert.deepStrictEqual({ a: m.logs[0].action, t: m.logs[0].target, b: m.logs[0].by }, { a: 'reset-password', t: 's1', b: 'boss' })
  // admins are protected from each other and themselves
  m = make({ admins: ['boss', 'boss2'], users: { boss: {}, boss2: {}, s1: {} } })
  await rejects(L.resetPassword(m.deps, 'boss', { uid: 'boss2', newPassword: 'abcdefgh' }), 'failed-precondition')
  await rejects(L.setDisabled(m.deps, 'boss', { uid: 'boss', disabled: true }), 'failed-precondition')
  await rejects(L.setDisabled(m.deps, 'boss', { uid: 'boss2', disabled: true }), 'failed-precondition')
  // block and unblock
  await rejects(L.setDisabled(m.deps, 'boss', { uid: 's1', disabled: 'yes' }), 'invalid-argument')
  await L.setDisabled(m.deps, 'boss', { uid: 's1', disabled: true })
  assert.strictEqual(m.users.s1.disabled, true)
  assert(m.calls.some((c) => c[0] === 'revoke' && c[1] === 's1'))
  assert.strictEqual(m.docs.get('users/s1').disabled, true)
  await L.setDisabled(m.deps, 'boss', { uid: 's1', disabled: false })
  assert.strictEqual(m.users.s1.disabled, false)
  assert.deepStrictEqual(m.logs.map((l) => l.action), ['block', 'unblock'])
  // ---- claimAdmin ----
  m = make({ users: { a: {}, b: {}, c: {}, d: {}, e: {} } })
  await rejects(L.claimAdmin(m.deps, null, '09121192596@firstclass.app'), 'unauthenticated')
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'b', '08031234567@firstclass.app'), { admin: false })
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'c', '2349121192596@firstclass.app'), { admin: false }, 'look-alike format must not qualify')
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'c', '+9121192596@firstclass.app'), { admin: false })
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'd', '09121192596@evil.com'), { admin: false }, 'only the app domain counts')
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'd', 'x09121192596@firstclass.app'), { admin: false })
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'd', undefined), { admin: false })
  assert(!m.docs.has('admins/b') && !m.docs.has('admins/c') && !m.docs.has('admins/d'), 'nobody else becomes admin')
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'a', '09121192596@firstclass.app'), { admin: true })
  assert(m.docs.has('admins/a'))
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'e', '07068414492@firstclass.app'), { admin: true })
  assert(m.docs.has('admins/e'))
  const before = m.logs.length
  assert.deepStrictEqual(await L.claimAdmin(m.deps, 'a', '09121192596@firstclass.app'), { admin: true }, 'second call is harmless')
  assert.strictEqual(m.logs.length, before, 'no duplicate log line')
  console.log('all admin logic tests passed')
})().catch((e) => { console.error('FAIL', e.message); process.exit(1) })
