import { auth } from './config'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

// ✅ Sirf yeh email admin hai — apni email daalo
// ✅ 2 admin emails
const ADMIN_EMAILS = [
  'majidaadii01@admin.com',
  'junaidrumi099@admin.com'
]
// ===== ADMIN LOGIN =====
export const adminLogin = async (email, password) => {
  try {
    // Pehle check karo email admin ki hai ya nahi
    if (email.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: 'Access denied. Admin only.' }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Login error:', error)
    // Firebase ki exact error message hide karo (security)
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
    // Sirf admin email wala user valid hai
    if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      callback(user)
    } else {
      callback(null)
    }
  })
}

// ===== CHECK IF ADMIN =====
export const isAdmin = () => {
  const user = auth.currentUser
  return user !== null && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// ===== GET CURRENT ADMIN USER =====
export const getCurrentAdmin = () => {
  const user = auth.currentUser
  if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return user
  }
  return null
}