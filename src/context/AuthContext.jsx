import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase.js'

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signUp({ phoneNumber, password, username, email, faculty }) {
    const loginEmail = numberToSyntheticEmail(phoneNumber)
    const cred = await createUserWithEmailAndPassword(auth, loginEmail, password)
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
    await setDoc(doc(db, 'users', cred.user.uid), profileDoc)
    setProfile(profileDoc)
    return cred.user
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
    const snap = await getDoc(doc(db, 'users', user.uid))
    setProfile(snap.exists() ? snap.data() : null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, logIn, logOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
