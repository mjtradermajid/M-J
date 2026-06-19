import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { Search, Eye, X, Truck, CheckCircle, Clock, XCircle, Package, Loader2 } from 'lucide-react'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore'

const statusConfig = {
  Pending:   { color: '#f59e0b', bg: '#f59e0b15', icon: <Clock size={14} />,   label: 'Pending' },
  Approved:  { color: '#3b82f6', bg: '#3b82f615', icon: <CheckCircle size={14} />, label: 'Approved' },
  Dispatched:{ color: '#DC5F00', bg: '#DC5F0015', icon: <Truck size={14} />,       label: 'Dispatched' },
  Delivered: { color: '#22c55e', bg: '#22c55e15', icon: <CheckCircle size={14} />, label: 'Delivered' },
  Cancelled: { color: '#CF0A0A', bg: '#CF0A0A15', icon: <XCircle size={14} />,     label: 'Cancelled' },
}

const statusFlow = ['Pending', 'Approved', 'Dispatched', 'Delivered']

// ===== ORDER DETAIL MODAL =====
function OrderDetailModal({ order, onClose, onStatusChange }) {
  const [trackingId, setTrackingId] = useState(order.trackingId || '')
  const [updating, setUpdating] = useState(false)
  const currentIdx = statusFlow.indexOf(order.status)

  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    await onStatusChange(order.id, newStatus, newStatus === 'Dispatched' ? trackingId : order.trackingId)
    setUpdating(false)
  }

  // Format Date Safely
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A'
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput)
    return date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: '#000000dd', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a0000, #CF0A0A)', padding: '20px 24px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 900, fontSize: '18px', color: 'white' }}>Order #{order.id.slice(-8).toUpperCase()}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>{formatDate(order.createdAt)}</p>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X size={18} />
          </motion.button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* Status Progress */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#EEEEEE55', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>ORDER PROGRESS</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              {statusFlow.map((status, idx) => {
                const isDone = currentIdx >= idx
                const isCurrent = currentIdx === idx
                const cfg = statusConfig[status]
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', flex: idx < statusFlow.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isDone ? cfg.color : '#222', border: `2px solid ${isDone ? cfg.color : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? 'white' : '#444', fontSize: '12px', transition: 'all 0.3s' }}
                      >
                        {isDone ? '✓' : idx + 1}
                      </motion.div>
                      <span style={{ fontSize: '9px', color: isDone ? cfg.color : '#EEEEEE33', fontWeight: isDone ? 700 : 400, whiteSpace: 'nowrap' }}>{status}</span>
                    </div>
                    {idx < statusFlow.length - 1 && (
                      <div style={{ flex: 1, height: '2px', backgroundColor: currentIdx > idx ? '#CF0A0A' : '#222', margin: '0 4px', marginBottom: '16px', transition: 'all 0.3s' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
            <p style={{ color: '#CF0A0A', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>CUSTOMER</p>
            {[
              ['Name', order.customerName],
              ['Phone', order.phone],
              ['City', order.city],
              ['Address', order.address],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EEEEEE08' }}>
                <span style={{ color: '#EEEEEE44', fontSize: '12px' }}>{l}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{v || 'N/A'}</span>
              </div>
            ))}
          </div>

          {/* Order Info */}
          <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
            <p style={{ color: '#B8960C', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>ORDER DETAILS</p>
            {[
              ['Product', order.productName],
              ['Category', order.productCategory],
              ['RAM', order.selectedRam],
              ['Storage', order.selectedStorage],
              ['Color', order.selectedColor],
              ['Quantity', order.quantity],
              ['Unit Price', `Rs. ${(order.unitPrice || 0).toLocaleString()}`],
              ['Total Amount', `Rs. ${(order.totalPrice || 0).toLocaleString()}`],
              ['Payment', order.paymentMethod?.toUpperCase() || 'COD'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EEEEEE08' }}>
                <span style={{ color: '#EEEEEE44', fontSize: '12px' }}>{l}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: l === 'Total Amount' ? '#B8960C' : '#EEEEEE' }}>{v || 'N/A'}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
              <p style={{ color: '#DC5F00', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>CUSTOMER NOTES</p>
              <p style={{ color: '#EEEEEE88', fontSize: '12px', lineHeight: 1.5 }}>{order.notes}</p>
            </div>
          )}

          {/* Tracking ID (show when dispatching) */}
          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
            <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
              <p style={{ color: '#DC5F00', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>TRACKING ID</p>
              <input
                value={trackingId}
                onChange={e => setTrackingId(e.target.value)}
                placeholder="e.g. TCS-445566 (add before dispatching)"
                style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #DC5F0044', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
              {order.trackingId && (
                <p style={{ color: '#22c55e', fontSize: '11px', marginTop: '5px' }}>✓ Current: {order.trackingId}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: '#EEEEEE44', fontSize: '11px', fontWeight: 700, letterSpacing: '2px' }}>UPDATE STATUS</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {order.status === 'Pending' && (
                  <>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleStatusChange('Approved')}
                      disabled={updating}
                      style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: 700, cursor: updating ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: updating ? 0.7 : 1 }}>
                      {updating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />} Approve
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleStatusChange('Cancelled')}
                      disabled={updating}
                      style={{ flex: 1, backgroundColor: '#CF0A0A22', color: '#CF0A0A', border: '1px solid #CF0A0A44', borderRadius: '10px', padding: '11px', fontWeight: 700, cursor: updating ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: updating ? 0.7 : 1 }}>
                      {updating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={15} />} Cancel
                    </motion.button>
                  </>
                )}
                {order.status === 'Approved' && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleStatusChange('Dispatched')}
                    disabled={updating}
                    style={{ flex: 1, backgroundColor: '#DC5F00', color: 'white', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: 700, cursor: updating ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: updating ? 0.7 : 1 }}>
                    {updating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Truck size={15} />} Mark Dispatched
                  </motion.button>
                )}
                {order.status === 'Dispatched' && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleStatusChange('Delivered')}
                    disabled={updating}
                    style={{ flex: 1, backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: 700, cursor: updating ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: updating ? 0.7 : 1 }}>
                    {updating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />} Mark Delivered
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {/* Final status badges */}
          {(order.status === 'Delivered' || order.status === 'Cancelled') && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: statusConfig[order.status].bg, borderRadius: '12px', border: `1px solid ${statusConfig[order.status].color}44` }}>
              <p style={{ color: statusConfig[order.status].color, fontWeight: 700, fontSize: '14px' }}>
                {order.status === 'Delivered' ? '✓ Order Delivered Successfully' : '✗ Order Cancelled'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ===== MAIN ORDERS PAGE =====
function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')

  // ✅ Fetch real orders from Firestore
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }))
      setOrders(ordersData)
      setLoading(false)
    }, (error) => {
      console.error('Orders fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ✅ Update status in Firestore
  const handleStatusChange = async (orderId, newStatus, trackingId) => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        status: newStatus,
        trackingId: trackingId || '',
        updatedAt: serverTimestamp()
      })
      
      // Real-time listener will auto update the UI, but we need to update selected modal ref safely
      setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: newStatus, trackingId: trackingId || '' } : prev)

    } catch (error) {
      console.error('Status update error:', error)
      alert('Error updating status. Check console.')
    }
  }

  const filtered = orders.filter(o => {
    const matchSearch = (o.customerName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.productName?.toLowerCase() || '').includes(search.toLowerCase())
    const matchStatus = activeStatus === 'All' || o.status === activeStatus
    return matchSearch && matchStatus
  })

  const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((a, o) => a + (o.totalPrice || 0), 0)

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A'
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput)
    return date.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <AdminLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, marginBottom: '2px' }}>
            Manage <span style={{ color: '#CF0A0A' }}>Orders</span>
          </h1>
          <p style={{ color: '#EEEEEE44', fontSize: '12px' }}>{orders.length} total orders</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Orders', value: orders.length, color: '#3b82f6' },
          { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: '#f59e0b' },
          { label: 'Approved', value: orders.filter(o => o.status === 'Approved').length, color: '#3b82f6' },
          { label: 'Dispatched', value: orders.filter(o => o.status === 'Dispatched').length, color: '#DC5F00' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: '#22c55e' },
          { label: 'Cancelled', value: orders.filter(o => o.status === 'Cancelled').length, color: '#CF0A0A' },
          { label: 'Revenue', value: `Rs.${(totalRevenue / 1000).toFixed(0)}k`, color: '#B8960C' },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3, boxShadow: `0 6px 20px ${s.color}22` }}
            style={{ backgroundColor: '#111', border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '13px', cursor: 'pointer' }}
            onClick={() => setActiveStatus(s.label === 'Total Orders' || s.label === 'Revenue' ? 'All' : s.label)}
          >
            <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '4px' }}>{s.label}</p>
            <p style={{ color: s.color, fontWeight: 900, fontSize: '18px' }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#EEEEEE44' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, order ID, product..."
            style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '9px 14px 9px 34px', color: '#EEEEEE', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Approved', 'Dispatched', 'Delivered', 'Cancelled'].map(status => (
          <motion.button key={status} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
            onClick={() => setActiveStatus(status)}
            style={{
              padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              backgroundColor: activeStatus === status ? (statusConfig[status]?.color || '#CF0A0A') : '#111',
              color: activeStatus === status ? 'white' : '#EEEEEE55',
              border: activeStatus === status ? `1px solid ${statusConfig[status]?.color || '#CF0A0A'}` : '1px solid #333',
              transition: 'all 0.2s'
            }}>
            {status} {status !== 'All' && `(${orders.filter(o => o.status === status).length})`}
          </motion.button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
          <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
          <p style={{ fontSize: '14px' }}>Loading orders from database...</p>
        </div>
      ) : (
        /* Orders List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((order, i) => {
            const cfg = statusConfig[order.status] || statusConfig.Pending
            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2, borderColor: cfg.color + '55' }}
                style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '14px', padding: '16px', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>

                  {/* Left */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}44`, color: cfg.color, padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{order.customerName || 'Unknown'}</p>
                      <p style={{ color: '#EEEEEE55', fontSize: '11px' }}>{order.productName || 'Unknown Product'}</p>
                      <p style={{ color: '#EEEEEE33', fontSize: '10px', marginTop: '1px' }}>
                        📅 {formatDate(order.createdAt)} • 📞 {order.phone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Middle */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: '#B8960C', fontWeight: 900, fontSize: '15px' }}>Rs. {(order.totalPrice || 0).toLocaleString()}</p>
                      {order.trackingId && (
                        <p style={{ color: '#DC5F00', fontSize: '10px', marginTop: '2px' }}>🚚 {order.trackingId}</p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: cfg.bg, border: `1px solid ${cfg.color}44`, color: cfg.color, padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                      {cfg.icon} {order.status}
                    </div>
                  </div>

                  {/* Details Button */}
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: `0 0 15px ${cfg.color}44` }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedOrder(order)}
                    style={{ backgroundColor: cfg.color, color: 'white', border: 'none', borderRadius: '10px', padding: '9px 18px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Eye size={14} /> Details
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px', color: '#EEEEEE33' }}>
          <Package size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', fontWeight: 600 }}>No orders found</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Try different filters or wait for new orders</p>
        </motion.div>
      )}
    </AdminLayout>
  )
}

export default Orders;