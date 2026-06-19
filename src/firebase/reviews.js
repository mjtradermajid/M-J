import { db } from './config'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy
} from 'firebase/firestore'

// ===== GET PRODUCT REVIEWS =====
export const getProductReviews = async (productId) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting reviews:', error)
    return []
  }
}

// ===== GET ALL REVIEWS (Admin) =====
export const getAllReviews = async () => {
  try {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting all reviews:', error)
    return []
  }
}

// ===== ADD REVIEW =====
export const addReview = async (reviewData) => {
  try {
    const review = {
      ...reviewData,
      approved: false,
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(collection(db, 'reviews'), review)
    return { id: docRef.id, ...review }
  } catch (error) {
    console.error('Error adding review:', error)
    return null
  }
}

// ===== APPROVE REVIEW =====
export const approveReview = async (id) => {
  try {
    await updateDoc(doc(db, 'reviews', id), { approved: true })
    return true
  } catch (error) {
    console.error('Error approving review:', error)
    return false
  }
}

// ===== DELETE REVIEW =====
export const deleteReview = async (id) => {
  try {
    await deleteDoc(doc(db, 'reviews', id))
    return true
  } catch (error) {
    console.error('Error deleting review:', error)
    return false
  }
}