import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase.js'
import { setStoreUser } from '../lib/store.js'

const AuthContext = createContext(null)

// Students log in with a WhatsApp/phone number + a chosen password.
// Internally we map the number to a synthetic email so we can use
// Firebase's normal email/password auth and avoid SMS/OTP costs.
// Username and real email are stored as profile info only — they are
// NOT valid login credentials, by design (keeps auth logic to one path).
function numberToSyntheticEmail(phoneNumber) {
  const digitsOnly = phoneNumber.replace(/\D/g, '')
  return `${digitsOnly}@firstclass.app`
}

// undefined = still loading the saved profile, null = this account has no profile yet.
async function fetchProfile(uid) {
  if (import.meta.env.VITE_E2E && window.__FC_TEST__) {
    if (window.__FC_TEST__.fetchProfile) return window.__FC_TEST__.fetchProfile(uid)
    if ('profile' in window.__FC_TEST__) return window.__FC_TEST__.profile
  }
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(false)
  const [loading, setLoading] = useState(true)
  const signingUp = useRef(false) // sign-up writes the profile itself, so the listener must not race it

  const handleAuthChange = useCallback(async (firebaseUser) => {
    setStoreUser(firebaseUser ? firebaseUser.uid : null)
    setProfileError(false)
    if (!firebaseUser) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    // Hold the app on the loading screen until the saved profile has arrived, so a returning
    // student is never mistaken for a new one and sent back through faculty and course set-up.
    setLoading(true)
    setUser(firebaseUser)
    if (signingUp.current) {
      setLoading(false)
      return
    }
    setProfile(undefined)
    try {
      setProfile(await fetchProfile(firebaseUser.uid))
    } catch {
      setProfile(null)
      setProfileError(true) // offline or a rules problem: show a retry screen, never new-student set-up
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Test-only seam: only exists in builds made with VITE_E2E=1, never in production.
    if (import.meta.env.VITE_E2E && window.__FC_TEST__) {
      if (window.__FC_TEST__.uid) handleAuthChange({ uid: window.__FC_TEST__.uid })
      else setLoading(false)
      window.__fcEmit = handleAuthChange
      return undefined
    }
    return onAuthStateChanged(auth, handleAuthChange)
  }, [handleAuthChange])

  async function signUp({ phoneNumber, password, username, email, faculty }) {
    const loginEmail = numberToSyntheticEmail(phoneNumber)
    const profileDoc = {
      phoneNumber,
      username,
      email: email || null,
      faculty: faculty || null,
      courses: [],           // array of course codes the student has added
      streak: 0,
      lastActiveDate: null,
      createdAt: new Date().toISOString()
    }
    signingUp.current = true
    try {
      const cred = await createUserWithEmailAndPassword(auth, loginEmail, password)
      await setDoc(doc(db, 'users', cred.user.uid), profileDoc)
      setProfile(profileDoc)
      return cred.user
    } finally {
      signingUp.current = false
    }
  }

  async function logIn({ phoneNumber, password }) {
    const loginEmail = numberToSyntheticEmail(phoneNumber)
    return signInWithEmailAndPassword(auth, loginEmail, password)
  }

  function logOut() {
    return signOut(auth)
  }

  async function refreshProfile() {
    if (!user) return
    try {
      setProfile(await fetchProfile(user.uid))
      setProfileError(false)
    } catch {
      setProfileError(true)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, profileError, loading, signUp, logIn, logOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
