// Admin-only helpers. Everything here is protected twice: the Firestore rules only let admins
// read other students' profiles, and the server functions refuse anyone who is not an admin.

import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from './firebase.js'

const seam = () => (import.meta.env.VITE_E2E && window.__FC_TEST__ && window.__FC_TEST__.admin) || null

/** Is this signed-in person an admin? Never throws. */
export async function checkIsAdmin(uid) {
  const s = seam()
  if (s) return !!s.isAdmin
  try {
    const snap = await getDoc(doc(db, 'admins', uid))
    return snap.exists()
  } catch {
    return false
  }
}

/** Every student profile (newest first). Fine for thousands of students; paginate beyond that. */
export async function loadStudents() {
  const s = seam()
  if (s) return s.students
  const snap = await getDocs(query(collection(db, 'users'), limit(5000)))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

export async function loadAdminLog() {
  const s = seam()
  if (s) return s.log || []
  const snap = await getDocs(query(collection(db, 'adminLog'), orderBy('at', 'desc'), limit(20)))
  return snap.docs.map((d) => {
    const x = d.data()
    return { id: d.id, action: x.action, target: x.target, by: x.by, at: x.at && x.at.toDate ? x.at.toDate().toISOString() : null }
  })
}

async function call(name, data) {
  const s = seam()
  if (s) return s[name] ? s[name](data) : { admin: false }
  const [{ getFunctions, httpsCallable }, { default: app }] = await Promise.all([import('firebase/functions'), import('./firebase.js')])
  const fn = httpsCallable(getFunctions(app, 'us-central1'), name)
  const res = await fn(data)
  return res.data
}

/**
 * After login: ask the server whether this account's phone number is on the admin list.
 * Students get a plain "no" once per device and are never asked again; the list itself
 * stays on the server. Never throws, and never blocks the app.
 */
export async function claimAdminIfListed(uid) {
  const flag = `fc_admin_checked_${uid}`
  try {
    if (window.localStorage.getItem(flag)) return false
  } catch {
    /* storage unavailable: just ask again */
  }
  try {
    const res = await call('claimAdmin', {})
    if (res && res.admin) return true
    try {
      window.localStorage.setItem(flag, '1')
    } catch {
      /* ignore */
    }
  } catch {
    /* functions not deployed yet, or offline: try again next login */
  }
  return false
}

export const adminResetPassword = (uid, newPassword) => call('adminResetPassword', { uid, newPassword })
export const adminSetDisabled = (uid, disabled) => call('adminSetDisabled', { uid, disabled })

/** A readable one-time password with no look-alike characters (no 0/O, 1/l/I). */
export function generateTempPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = new Uint32Array(10)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/** 0803... or +234803... to the international digits WhatsApp links need. */
export function whatsappNumber(phone) {
  const d = String(phone || '').replace(/\D/g, '')
  if (d.startsWith('234')) return d
  if (d.startsWith('0')) return '234' + d.slice(1)
  return d
}

export function friendlyAdminError(err) {
  const code = err && err.code ? String(err.code).replace('functions/', '') : ''
  if (code === 'permission-denied') return 'Your account is not set up as an admin.'
  if (code === 'unauthenticated') return 'Please log in again.'
  if (code === 'not-found' && err.message && /function/i.test(err.message)) return 'The admin tools are not switched on yet. Finish the setup guide first.'
  if (code === 'unavailable' || code === 'network-request-failed') return 'No internet connection. Try again.'
  if (err && err.message && ['invalid-argument', 'failed-precondition', 'not-found'].includes(code)) return err.message
  return 'Something went wrong. Please try again.'
}
