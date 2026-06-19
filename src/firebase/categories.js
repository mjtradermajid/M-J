import { db } from './config'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy
} from 'firebase/firestore'

// ===== GET ALL CATEGORIES =====
export const getCategories = async () => {
  try {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
}

// ===== GET SINGLE CATEGORY =====
export const getCategory = async (id) => {
  try {
    const docRef = doc(db, 'categories', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() }
    return null
  } catch (error) {
    console.error('Error getting category:', error)
    return null
  }
}

// ===== ADD CATEGORY =====
export const addCategory = async (categoryData) => {
  try {
    const category = {
      ...categoryData,
      discount: { active: false, percentage: 0, label: '' },
      createdAt: new Date().toISOString(),
    }
    const docRef = await addDoc(collection(db, 'categories'), category)
    return { id: docRef.id, ...category }
  } catch (error) {
    console.error('Error adding category:', error)
    return null
  }
}

// ===== UPDATE CATEGORY =====
export const updateCategory = async (id, data) => {
  try {
    await updateDoc(doc(db, 'categories', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('Error updating category:', error)
    return false
  }
}

// ===== DELETE CATEGORY =====
export const deleteCategory = async (id) => {
  try {
    await deleteDoc(doc(db, 'categories', id))
    return true
  } catch (error) {
    console.error('Error deleting category:', error)
    return false
  }
}

// ===== SET CATEGORY DISCOUNT =====
export const setCategoryDiscount = async (categoryId, discount) => {
  try {
    await updateDoc(doc(db, 'categories', categoryId), {
      discount: {
        active: discount.active,
        percentage: discount.percentage,
        label: discount.label || '',
        expiresAt: discount.expiresAt || null,
      },
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('Error setting discount:', error)
    return false
  }
}