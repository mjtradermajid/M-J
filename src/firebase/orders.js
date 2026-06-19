import { db } from './config'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, orderBy, where
} from 'firebase/firestore'

// ===== GENERATE TRACKING ID =====
const generateTrackingId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'MJ-'
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

// ===== PLACE ORDER =====
export const placeOrder = async (orderData) => {
  try {
    const order = {
      ...orderData,
      trackingId: generateTrackingId(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docRef = await addDoc(collection(db, 'orders'), order)
    return { id: docRef.id, ...order }
  } catch (error) {
    console.error('Error placing order:', error)
    return null
  }
}

// ===== GET ALL ORDERS =====
export const getOrders = async () => {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error getting orders:', error)
    return []
  }
}

// ===== GET ORDER BY TRACKING ID =====
export const getOrderByTrackingId = async (trackingId) => {
  try {
    const q = query(collection(db, 'orders'), where('trackingId', '==', trackingId))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting order:', error)
    return null
  }
}

// ===== GET SINGLE ORDER =====
export const getOrder = async (id) => {
  try {
    const docRef = doc(db, 'orders', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() }
    return null
  } catch (error) {
    console.error('Error getting order:', error)
    return null
  }
}

// ===== UPDATE ORDER STATUS =====
export const updateOrderStatus = async (id, status, trackingId = null) => {
  try {
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    }
    if (trackingId) updateData.trackingId = trackingId
    await updateDoc(doc(db, 'orders', id), updateData)
    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    return false
  }
}

// ===== DELETE ORDER =====
export const deleteOrder = async (id) => {
  try {
    await deleteDoc(doc(db, 'orders', id))
    return true
  } catch (error) {
    console.error('Error deleting order:', error)
    return false
  }
}

// ===== GET ORDERS STATS =====
export const getOrderStats = async () => {
  try {
    const orders = await getOrders()
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      approved: orders.filter(o => o.status === 'Approved').length,
      dispatched: orders.filter(o => o.status === 'Dispatched').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
      revenue: orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    return null
  }
}