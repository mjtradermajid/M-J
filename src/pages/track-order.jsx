import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingCart, CheckCircle2, Phone, Package, XCircle, Clock, Truck, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'

// Status config
const statusConfig = {
  Pending:   { color: '#B8960C', bg: '#B8960C15', border: '#B8960C33', icon: '⏳', label: 'Pending' },
  Accepted:  { color: '#3B82F6', bg: '#3B82F615', border: '#3B82F633', icon: '✅', label: 'Accepted' },
  Shipped:   { color: '#DC5F00', bg: '#DC5F0015', border: '#DC5F0033', icon: '🚚', label: 'Shipped' },
  Delivered: { color: '#059669', bg: '#05966915', border: '#05966933', icon: '📦', label: 'Delivered' },
  Cancelled: { color: '#CF0A0A', bg: '#CF0A0A15', border: '#CF0A0A33', icon: '❌', label: 'Cancelled' },
}

// Cancel window: 2 hours in ms
const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000

function canCancel(order) {
  if (order.status !== 'Pending') return false
  if (!order.createdAt?.toDate) return false
  const created = order.createdAt.toDate()
  const now = new Date()
  return (now - created) < CANCEL_WINDOW_MS
}

function timeAgo(date) {
  if (!date?.toDate) return ''
  const d = date.toDate()
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function cancelTimeLeft(order) {
  if (!order.createdAt?.toDate) return ''
  const created = order.createdAt.toDate()
  const deadline = new Date(created.getTime() + CANCEL_WINDOW_MS)
  const now = new Date()
  const diff = deadline - now
  if (diff <= 0) return null
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`
}

const couriers = [
  { id: 'tcs', name: 'TCS Logistics', fallbackText: 'TCS', placeholder: 'e.g. 123456789', color: '#CF0A0A' },
  { id: 'leopards', name: 'Leopards Courier', fallbackText: 'LCS', placeholder: 'e.g. LE12345678', color: '#B8960C' },
  { id: 'postx', name: 'PostX', fallbackText: 'PostX', placeholder: 'e.g. PX-98765', color: '#DC5F00' },
]

function TrackOrder() {
  const navigate = useNavigate()

  // My Orders tab
  const [activeTab, setActiveTab] = useState('myorders') // 'myorders' | 'courier'
  const [phoneInput, setPhoneInput] = useState('')
  const [fetchingOrders, setFetchingOrders] = useState(false)
  const [myOrders, setMyOrders] = useState([])
  const [ordersFetched, setOrdersFetched] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelConfirmId, setCancelConfirmId] = useState(null)

  // Courier tab
  const [selectedCourier, setSelectedCourier] = useState(null)
  const [courierLoading, setCourierLoading] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [trackingData, setTrackingData] = useState(null)

  const handlePhoneSearch = async (e) => {
    e.preventDefault()
    const cleaned = phoneInput.replace(/[^0-9]/g, '')
    if (cleaned.length !== 11) {
      setFetchError('Please enter a valid 11-digit phone number')
      return
    }
    setFetchingOrders(true)
    setFetchError('')
    setMyOrders([])
    setOrdersFetched(false)
    try {
      const q = query(collection(db, 'orders'), where('phone', '==', cleaned))
      const snap = await getDocs(q)
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      orders.sort((a, b) => {
        const ta = a.createdAt?.toDate?.() || 0
        const tb = b.createdAt?.toDate?.() || 0
        return tb - ta
      })
      setMyOrders(orders)
      setOrdersFetched(true)
      if (orders.length === 0) setFetchError('No orders found for this phone number.')
    } catch (err) {
      console.error(err)
      setFetchError('Something went wrong. Please try again.')
    } finally {
      setFetchingOrders(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId)
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o))
      setCancelConfirmId(null)
    } catch (err) {
      console.error(err)
      alert('Could not cancel order. Try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleCourierSelect = (courier) => {
    setCourierLoading(true)
    setSelectedCourier(null)
    setTrackingData(null)
    setTrackingId('')
    setTimeout(() => { setSelectedCourier(courier); setCourierLoading(false) }, 1000)
  }

  const handleCourierSearch = (e) => {
    e.preventDefault()
    if (!trackingId.trim()) return
    setSearchLoading(true)
    setTrackingData(null)
    setTimeout(() => {
      setSearchLoading(false)
      setTrackingData({
        id: trackingId, status: 'In Transit', courier: selectedCourier.name,
        estimatedDelivery: 'Expected: 2-3 Days',
        steps: [
          { title: 'Order Placed & Confirmed', desc: 'MJ Trader has processed your order.', time: 'June 01, 2026 - 04:30 PM', done: true },
          { title: 'Handed Over to Courier', desc: `Dispatched via ${selectedCourier.name}.`, time: 'June 02, 2026 - 11:00 AM', done: true },
          { title: 'In Transit', desc: 'Parcel en route to your city.', time: 'June 03, 2026 - 09:15 AM', done: true, current: true },
          { title: 'Out for Delivery', desc: 'Rider will deliver to your address.', time: 'Pending', done: false },
        ]
      })
    }, 1500)
  }

  const handlePhoneInput = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (val.length <= 11) setPhoneInput(val)
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#EEEEEE', fontFamily: 'sans-serif' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <motion.span style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #CF0A0A', '0 0 25px #CF0A0A', '0 0 10px #CF0A0A'] }} transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
            <span style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }}>&</span>
            <motion.span style={{ color: '#B8960C', fontSize: '22px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #B8960C', '0 0 25px #B8960C', '0 0 10px #B8960C'] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
            <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '5px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            {[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }, { label: 'Track', path: '/track-order' }].map(link => (
              <span key={link.label} onClick={() => navigate(link.path)} style={{ cursor: 'pointer', fontSize: '12px', color: link.path === '/track-order' ? '#CF0A0A' : '#EEEEEE88', fontWeight: link.path === '/track-order' ? 700 : 500 }}>{link.label}</span>
            ))}
            <ShoppingCart size={18} style={{ color: '#EEEEEE88', cursor: 'pointer' }} onClick={() => navigate('/cart')} />
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: '860px', width: '100%', margin: '0 auto', padding: '40px 16px' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, marginBottom: '8px' }}>
            Track Your <span style={{ color: '#CF0A0A' }}>Order</span>
          </h1>
          <p style={{ color: '#EEEEEE55', fontSize: '13px' }}>Check your order status or track shipment via courier</p>
          <div style={{ width: '40px', height: '2px', backgroundColor: '#CF0A0A', margin: '14px auto 0' }} />
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#111', borderRadius: '12px', padding: '6px' }}>
          {[
            { key: 'myorders', label: '📦 My Orders', desc: 'Track by phone number' },
            { key: 'courier', label: '🚚 Courier Tracking', desc: 'Track by consignment ID' },
          ].map(tab => (
            <motion.button key={tab.key} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: '12px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === tab.key ? '#CF0A0A' : 'transparent', color: activeTab === tab.key ? 'white' : '#EEEEEE66', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s' }}>
              {tab.label}
              <p style={{ fontSize: '10px', fontWeight: 400, marginTop: '2px', opacity: 0.7 }}>{tab.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* ===== MY ORDERS TAB ===== */}
        <AnimatePresence mode="wait">
          {activeTab === 'myorders' && (
            <motion.div key="myorders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

              {/* Phone Search */}
              <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Enter Your Phone Number</h3>
                <p style={{ color: '#EEEEEE44', fontSize: '12px', marginBottom: '16px' }}>Use the same number you provided while placing the order</p>
                <form onSubmit={handlePhoneSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#CF0A0A' }} />
                    <input
                      type="tel" value={phoneInput} onChange={handlePhoneInput}
                      placeholder="03XXXXXXXXX" maxLength={11}
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#000', border: '1px solid #222', borderRadius: '10px', padding: '13px 14px 13px 42px', color: '#EEEEEE', fontSize: '14px', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: phoneInput.length === 11 ? '#059669' : '#EEEEEE33' }}>{phoneInput.length}/11</span>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={fetchingOrders}
                    style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '10px', padding: '13px 24px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fetchingOrders
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      : <><Search size={14} /> Find Orders</>
                    }
                  </motion.button>
                </form>
                {fetchError && <p style={{ color: '#CF0A0A', fontSize: '12px', marginTop: '10px', fontWeight: 600 }}>⚠ {fetchError}</p>}
              </div>

              {/* Orders List */}
              <AnimatePresence>
                {ordersFetched && myOrders.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p style={{ color: '#EEEEEE55', fontSize: '12px', marginBottom: '14px', fontWeight: 600 }}>
                      {myOrders.length} order{myOrders.length > 1 ? 's' : ''} found
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {myOrders.map((order) => {
                        const st = statusConfig[order.status] || statusConfig.Pending
                        const expanded = expandedOrder === order.id
                        const cancellable = canCancel(order)
                        const timeLeft = cancelTimeLeft(order)
                        const shortId = order.id.slice(-8).toUpperCase()

                        return (
                          <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            style={{ backgroundColor: '#0a0a0a', border: `1px solid ${expanded ? '#CF0A0A44' : '#1a1a1a'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                            {/* Order Header */}
                            <div onClick={() => setExpandedOrder(expanded ? null : order.id)}
                              style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>

                              {/* Product image */}
                              <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#1a1a1a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {order.productImage
                                  ? <img src={order.productImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                  : <Package size={22} style={{ color: '#EEEEEE33' }} />
                                }
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.productName}</p>
                                <p style={{ color: '#EEEEEE44', fontSize: '11px', marginTop: '2px' }}>
                                  #{shortId} · {timeAgo(order.createdAt)} · Qty: {order.quantity}
                                </p>
                              </div>

                              {/* Status badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  {st.icon} {st.label}
                                </span>
                                {expanded ? <ChevronUp size={16} style={{ color: '#EEEEEE44' }} /> : <ChevronDown size={16} style={{ color: '#EEEEEE44' }} />}
                              </div>
                            </div>

                            {/* Expanded Detail */}
                            <AnimatePresence>
                              {expanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                                  <div style={{ borderTop: '1px solid #1a1a1a', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                                    {/* Order Details Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                      {[
                                        ['Product', order.productName],
                                        ['Category', order.productCategory],
                                        ['Quantity', order.quantity],
                                        ['Total Price', `Rs. ${Number(order.totalPrice).toLocaleString()}`],
                                        ['Payment', order.paymentMethod?.toUpperCase()],
                                        ['Payment Status', order.paymentStatus],
                                        order.selectedColor && ['Color', order.selectedColor],
                                        order.selectedRam && ['RAM', `${order.selectedRam} GB`],
                                        order.selectedStorage && ['Storage', `${order.selectedStorage} GB`],
                                        ['City', order.city],
                                      ].filter(Boolean).map(([label, val]) => (
                                        <div key={label} style={{ backgroundColor: '#111', padding: '10px 12px', borderRadius: '8px' }}>
                                          <p style={{ color: '#EEEEEE44', fontSize: '10px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
                                          <p style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 600 }}>{val}</p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Address */}
                                    <div style={{ backgroundColor: '#111', padding: '10px 12px', borderRadius: '8px' }}>
                                      <p style={{ color: '#EEEEEE44', fontSize: '10px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '1px' }}>Delivery Address</p>
                                      <p style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 600 }}>{order.address}, {order.city}</p>
                                    </div>

                                    {/* Status Timeline */}
                                    <div style={{ backgroundColor: '#111', padding: '14px', borderRadius: '10px' }}>
                                      <p style={{ color: '#EEEEEE44', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', marginBottom: '14px' }}>ORDER TIMELINE</p>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                        {['Pending', 'Accepted', 'Shipped', 'Delivered'].map((step, idx) => {
                                          const stConf = statusConfig[step]
                                          const statusOrder = ['Pending', 'Accepted', 'Shipped', 'Delivered']
                                          const currentIdx = statusOrder.indexOf(order.status)
                                          const isCancelled = order.status === 'Cancelled'
                                          const isDone = !isCancelled && idx <= currentIdx
                                          const isCurrent = !isCancelled && idx === currentIdx
                                          const isLast = idx === 3

                                          return (
                                            <div key={step} style={{ display: 'flex', gap: '14px', position: 'relative', paddingBottom: isLast ? 0 : '16px' }}>
                                              {!isLast && (
                                                <div style={{ position: 'absolute', left: '10px', top: '22px', bottom: 0, width: '2px', backgroundColor: isDone && idx < currentIdx ? '#CF0A0A' : '#222' }} />
                                              )}
                                              <div style={{ flexShrink: 0, zIndex: 1, marginTop: '2px' }}>
                                                {isDone
                                                  ? <CheckCircle2 size={20} fill={isCurrent ? '#B8960C' : '#CF0A0A'} color="#000" />
                                                  : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #333', backgroundColor: '#000' }} />
                                                }
                                              </div>
                                              <div>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: isCurrent ? '#B8960C' : isDone ? '#EEEEEE' : '#EEEEEE33' }}>{step}</p>
                                                <p style={{ fontSize: '11px', color: isDone ? '#EEEEEE55' : '#EEEEEE22', marginTop: '2px' }}>
                                                  {isCurrent ? 'Current status' : isDone ? 'Completed' : 'Waiting...'}
                                                </p>
                                              </div>
                                            </div>
                                          )
                                        })}
                                        {order.status === 'Cancelled' && (
                                          <div style={{ display: 'flex', gap: '14px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #222' }}>
                                            <XCircle size={20} style={{ color: '#CF0A0A', flexShrink: 0 }} />
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#CF0A0A' }}>Order Cancelled</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Cancel Section */}
                                    {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                                      <div>
                                        {cancellable ? (
                                          <div style={{ backgroundColor: '#CF0A0A11', border: '1px solid #CF0A0A33', borderRadius: '10px', padding: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                              <Clock size={14} style={{ color: '#CF0A0A' }} />
                                              <p style={{ color: '#CF0A0A', fontSize: '12px', fontWeight: 700 }}>
                                                Cancel window closes in: <span style={{ fontSize: '13px' }}>{timeLeft}</span>
                                              </p>
                                            </div>
                                            {cancelConfirmId === order.id ? (
                                              <div>
                                                <p style={{ color: '#EEEEEE88', fontSize: '12px', marginBottom: '10px' }}>Are you sure you want to cancel this order?</p>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleCancelOrder(order.id)} disabled={cancellingId === order.id}
                                                    style={{ flex: 1, backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                    {cancellingId === order.id
                                                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                                      : <><XCircle size={14} /> Yes, Cancel</>
                                                    }
                                                  </motion.button>
                                                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCancelConfirmId(null)}
                                                    style={{ flex: 1, backgroundColor: 'transparent', color: '#EEEEEE88', border: '1px solid #333', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                                    Keep Order
                                                  </motion.button>
                                                </div>
                                              </div>
                                            ) : (
                                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setCancelConfirmId(order.id)}
                                                style={{ width: '100%', backgroundColor: 'transparent', color: '#CF0A0A', border: '1px solid #CF0A0A44', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <XCircle size={14} /> Cancel Order
                                              </motion.button>
                                            )}
                                          </div>
                                        ) : order.status === 'Pending' ? (
                                          <div style={{ backgroundColor: '#1a1a1a', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} style={{ color: '#EEEEEE44' }} />
                                            <p style={{ color: '#EEEEEE44', fontSize: '12px' }}>Cancel window expired (2 hours limit)</p>
                                          </div>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ===== COURIER TAB ===== */}
          {activeTab === 'courier' && (
            <motion.div key="courier" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
                {couriers.map((courier) => {
                  const isSelected = selectedCourier?.id === courier.id
                  return (
                    <motion.div key={courier.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleCourierSelect(courier)}
                      style={{ backgroundColor: '#0a0a0a', border: `1px solid ${isSelected ? '#CF0A0A' : '#1a1a1a'}`, borderRadius: '12px', padding: '24px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `1px solid ${isSelected ? '#CF0A0A' : '#222'}`, backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: courier.color }}>{courier.fallbackText}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? '#EEEEEE' : '#EEEEEE66', textAlign: 'center' }}>{courier.name}</span>
                    </motion.div>
                  )
                })}
              </div>

              <AnimatePresence>
                {courierLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'center', margin: '30px 0' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ width: '28px', height: '28px', border: '2px solid #CF0A0A', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedCourier && !courierLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                      Tracking ID for <span style={{ color: selectedCourier.color }}>{selectedCourier.name}</span>
                    </h3>
                    <p style={{ color: '#EEEEEE44', fontSize: '12px', marginBottom: '16px' }}>Enter your consignment number below</p>
                    <form onSubmit={handleCourierSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
                        <Truck size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#CF0A0A' }} />
                        <input type="text" required value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder={selectedCourier.placeholder}
                          style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#000', border: '1px solid #222', borderRadius: '8px', padding: '13px 14px 13px 40px', color: '#EEEEEE', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={searchLoading}
                        style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '8px', padding: '0 22px', minHeight: '44px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {searchLoading
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          : <><Search size={13} /> Track</>
                        }
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {trackingData && !searchLoading && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <p style={{ color: '#EEEEEE44', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>CONSIGNMENT</p>
                        <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#CF0A0A', fontFamily: 'monospace' }}>{trackingData.id}</h2>
                      </div>
                      <span style={{ backgroundColor: '#DC5F0015', color: '#DC5F00', border: '1px solid #DC5F0033', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                        ⚡ {trackingData.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                      {trackingData.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: idx !== trackingData.steps.length - 1 ? '24px' : 0 }}>
                          {idx !== trackingData.steps.length - 1 && (
                            <div style={{ position: 'absolute', left: '10px', top: '22px', bottom: 0, width: '2px', backgroundColor: step.done && trackingData.steps[idx + 1]?.done ? '#CF0A0A' : '#222' }} />
                          )}
                          <div style={{ zIndex: 2, marginTop: '2px', flexShrink: 0 }}>
                            {step.done
                              ? <CheckCircle2 size={20} fill={step.current ? '#B8960C' : '#CF0A0A'} color="#000" />
                              : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #333', backgroundColor: '#000' }} />
                            }
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: step.current ? '#B8960C' : step.done ? '#EEEEEE' : '#EEEEEE33' }}>{step.title}</p>
                            <p style={{ color: step.done ? '#EEEEEE55' : '#EEEEEE22', fontSize: '11px', marginTop: '3px' }}>{step.desc}</p>
                            <p style={{ color: '#EEEEEE33', fontSize: '10px', marginTop: '4px' }}>{step.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #CF0A0A22', padding: '20px 16px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <span style={{ color: '#CF0A0A', fontSize: '18px', fontWeight: 900 }}>M</span>
            <span style={{ color: '#CF0A0A', fontSize: '18px', fontWeight: 900 }}>&</span>
            <span style={{ color: '#B8960C', fontSize: '18px', fontWeight: 900 }}>J</span>
            <span style={{ color: '#EEEEEE', fontSize: '10px', marginLeft: '4px', letterSpacing: '2px', fontWeight: 600 }}>TRADER</span>
          </div>
          <p style={{ color: '#EEEEEE22', fontSize: '11px' }}>© 2026 M&J Trader. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default TrackOrder