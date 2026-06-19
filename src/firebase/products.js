import { db, storage } from './config'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where, orderBy
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// ===== GET ALL PRODUCTS =====
export const getProducts = async () => {
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting products:', error)
    return []
  }
}

// ===== GET PRODUCTS BY CATEGORY =====
export const getProductsByCategory = async (category) => {
  try {
    const q = query(collection(db, 'products'), where('category', '==', category))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting products by category:', error)
    return []
  }
}

// ===== GET SINGLE PRODUCT =====
export const getProduct = async (id) => {
  try {
    const docRef = doc(db, 'products', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() }
    return null
  } catch (error) {
    console.error('Error getting product:', error)
    return null
  }
}

// ===== UPLOAD IMAGE =====
export const uploadProductImage = async (file, productName) => {
  try {
    const fileName = `products/${Date.now()}_${productName.replace(/\s/g, '_')}`
    const storageRef = ref(storage, fileName)
    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

// ===== ADD PRODUCT =====
export const addProduct = async (productData, imageFiles) => {
  try {
    // Upload images
    const imageUrls = []
    for (const file of imageFiles) {
      const url = await uploadProductImage(file, productData.name)
      if (url) imageUrls.push(url)
    }

    const product = {
      ...productData,
      images: imageUrls,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await addDoc(collection(db, 'products'), product)
    return { id: docRef.id, ...product }
  } catch (error) {
    console.error('Error adding product:', error)
    return null
  }
}

// ===== UPDATE PRODUCT =====
export const updateProduct = async (id, productData, newImageFiles = []) => {
  try {
    let imageUrls = productData.images || []

    // Upload new images if any
    if (newImageFiles.length > 0) {
      for (const file of newImageFiles) {
        const url = await uploadProductImage(file, productData.name)
        if (url) imageUrls.push(url)
      }
    }

    const updated = {
      ...productData,
      images: imageUrls,
      updatedAt: new Date().toISOString(),
    }

    await updateDoc(doc(db, 'products', id), updated)
    return { id, ...updated }
  } catch (error) {
    console.error('Error updating product:', error)
    return null
  }
}

// ===== DELETE PRODUCT =====
export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, 'products', id))
    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    return false
  }
}