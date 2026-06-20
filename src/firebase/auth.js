import { auth } from './config'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

// ✅ 2 admin emails
const ADMIN_EMAILS = [
  'majidaadii01@admin.com',
  'junaidrumi099@admin.com'
]

// ===== ADMIN LOGIN =====
export const adminLogin = async (email, password) => {
  try {
    // Pehle check karo email admin list mein hai ya nahi
    if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      return { success: false, error: 'Invalid email or password.' }
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Invalid email or password.' }
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
  return onAuthStateChanged(auth, (user) => {
    if (user && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      callback(user)
    } else {
      callback(null)
    }
  })
}

// ===== CHECK IF ADMIN =====
export const isAdmin = () => {
  const user = auth.currentUser
  return user !== null && ADMIN_EMAILS.includes(user.email.toLowerCase())
}

// ===== GET CURRENT ADMIN USER =====
export const getCurrentAdmin = () => {
  const user = auth.currentUser
  if (user && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return user
  }
  return null
}