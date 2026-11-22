import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase web config for the FirstClass project. These values are public by design;
// access is protected by Firebase Authentication and Firestore security rules.
const firebaseConfig = {
  apiKey: 'AIzaSyDnxK0Hr12TFniZBhR8nHpZeRijfT9hRy4',
  authDomain: 'firstclass-887f7.firebaseapp.com',
  projectId: 'firstclass-887f7',
  storageBucket: 'firstclass-887f7.firebasestorage.app',
  messagingSenderId: '486608460345',
  appId: '1:486608460345:web:178905d5451e57c4d68be8',
  measurementId: 'G-1SSSF01XCE'
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
