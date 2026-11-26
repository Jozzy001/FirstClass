// Cloud copy of a student's progress, so results follow them to any phone or computer.
//
// The device stays the primary store (screens read from it instantly, offline included).
// On login we merge the cloud copy in, then every change is pushed a moment later.
// Merging only ever adds what one side is missing, so nothing is lost either way.
// If the network is slow or down, nothing breaks: the app just keeps working locally and
// pushes the next time something changes.

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { exportProgress, hasProgress, mergeProgress, onStoreChange } from './store.js'

const PUSH_DELAY_MS = 2500
const PULL_TIMEOUT_MS = 4000

const firestoreRemote = {
  async get(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data().progress || null : null
  },
  async set(uid, progress) {
    await setDoc(doc(db, 'users', uid), { progress, progressUpdatedAt: new Date().toISOString() }, { merge: true })
  }
}

function remote() {
  // Test-only seam, present only in builds made with VITE_E2E=1.
  if (import.meta.env.VITE_E2E && window.__FC_TEST__) {
    return window.__FC_TEST__.remote || { get: async () => null, set: async () => {} }
  }
  return firestoreRemote
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

let stopFn = null
let status = 'idle' // idle | syncing | synced | offline
const statusListeners = new Set()
function setStatus(next) {
  status = next
  statusListeners.forEach((fn) => fn(next))
}
export function getSyncStatus() {
  return status
}
export function onSyncStatus(fn) {
  statusListeners.add(fn)
  return () => statusListeners.delete(fn)
}

async function push(uid) {
  if (!hasProgress()) return
  setStatus('syncing')
  try {
    await remote().set(uid, JSON.parse(JSON.stringify(exportProgress())))
    setStatus('synced')
  } catch {
    setStatus('offline')
  }
}

/**
 * Pull the cloud copy, merge it into this device, and push the merged result back.
 * Never throws and never waits longer than a few seconds.
 */
export async function syncDown(uid) {
  setStatus('syncing')
  try {
    const cloud = await withTimeout(remote().get(uid), PULL_TIMEOUT_MS)
    mergeProgress(cloud)
    setStatus('synced')
  } catch {
    setStatus('offline')
    return false
  }
  push(uid) // fire and forget: writes the merged copy back
  return true
}

/** Push changes shortly after they happen, and again when the page is hidden or closed. */
export function startAutoSync(uid) {
  stopAutoSync()
  let timer = null
  let dirty = false
  const flush = () => {
    if (timer) clearTimeout(timer)
    timer = null
    if (!dirty) return
    dirty = false
    push(uid)
  }
  const off = onStoreChange(() => {
    dirty = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, PUSH_DELAY_MS)
  })
  const onHide = () => {
    if (document.visibilityState === 'hidden') flush()
  }
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', flush)
  window.addEventListener('online', () => {
    dirty = true
    flush()
  })
  stopFn = () => {
    off()
    if (timer) clearTimeout(timer)
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', flush)
  }
}

export function stopAutoSync() {
  if (stopFn) stopFn()
  stopFn = null
  setStatus('idle')
}
