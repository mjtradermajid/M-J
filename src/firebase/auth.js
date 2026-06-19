import { auth } from './config'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

// ===== ADMIN LOGIN =====
export const adminLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
}

// ===== ADMIN LOGOUT =====
export const adminLogout = async () => {
  try {
    await signOut(auth)
    return true
  } catch (error) {
    console.error('Logout error:', error)
    return false
  }
}

// ===== AUTH STATE LISTENER =====
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// ===== CHECK IF ADMIN =====
export const isAdmin = () => {
  return auth.currentUser !== null
}