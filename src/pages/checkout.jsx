import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ShoppingCart, CheckCircle, ArrowLeft, Truck, CreditCard, User, Phone, MapPin, Package, Wallet, Banknote, Smartphone } from 'lucide-react'

const paymentMethods = {
  cod: {
    id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive the order',
    icon: <Banknote size={18} />, color: '#CF0A0A', details: null
  },
  easypaisa: {
    id: 'easypaisa', label: 'EasyPaisa', desc: 'Pay via EasyPaisa mobile account',
    icon: <Wallet size={18} />, color: '#2E7D32',
    details: { accountTitle: 'Abdul Majeed', accountNumber: '03499833707', }
  },  jazzcash: {
    id: 'jazzcash', label: 'JazzCash', desc: 'Pay via JazzCash mobile account',
    icon: <Smartphone size={18} />, color: '#9C27B0',
    details: { accountTitle: 'Abdul Majeed', accountNumber: '03259364309', }
  },
}

// Field limits
const LIMITS = {
  name: 50,
  phone: 11,
  city: 30,
  address: 150,
  notes: 200,
}

function CheckoutPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('cod')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})

  const product = state?.product
  const selectedColor = state?.selectedColor
  const selectedStorage = state?.selectedStorage
  const selectedRam = state?.selectedRam
  const quantity = state?.quantity || 1
  const totalPrice = state?.totalPrice || 0

  useEffect(() => {
    if (!product) navigate('/products')
  }, [product, navigate])

  // Field change handlers with max length enforcement
  const handlePhone = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '') // only digits
    if (val.length <= LIMITS.phone) {
      setPhone(val)
      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handleName = (e) => {
    if (e.target.value.length <= LIMITS.name) {
      setName(e.target.value)
      if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handleCity = (e) => {
    if (e.target.value.length <= LIMITS.city) {
      setCity(e.target.value)
      if (errors.city) setErrors(prev => ({ ...prev, city: '' }))
    }
  }

  const handleAddress = (e) => {
    if (e.target.value.length <= LIMITS.address) {
      setAddress(e.target.value)
    }
  }

  const handleNotes = (e) => {
    if (e.target.value.length <= LIMITS.notes) {
      setNotes(e.target.value)
    }
  }

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!phone.trim()) errs.phone = 'Phone number is required'
    else if (phone.length !== 11) errs.phone = 'Phone must be exactly 11 digits'
    else if (!phone.startsWith('03')) errs.phone = 'Phone must start with 03'
    if (!city.trim()) errs.city = 'City is required'
    if (!address.trim()) errs.address = 'Address is required'
    else if (address.trim().length < 10) errs.address = 'Please enter a complete address'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const orderData = {
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        notes: notes.trim(),
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        productImage: product.imageUrl || '',
        selectedColor: selectedColor || '',
        selectedStorage: selectedStorage || '',
        selectedRam: selectedRam || '',
        quantity: Number(quantity),
        unitPrice: Number(product.price || product.sellPrice || 0),
        totalPrice: Number(totalPrice),
        paymentMethod: selectedPayment,
        paymentStatus: selectedPayment === 'cod' ? 'Unpaid' : 'Pending',
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'orders'), orderData)
      setOrderId(docRef.id)
      setOrderPlaced(true)
      localStorage.removeItem('cart')
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Error placing order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', backgroundColor: '#111',
    border: `1px solid ${hasError ? '#CF0A0A' : '#333'}`,
    borderRadius: '10px', padding: '14px', color: '#EEEEEE',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  })

  const errorText = (msg) => msg ? (
    <p style={{ color: '#CF0A0A', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>⚠ {msg}</p>
  ) : null

  const counterText = (val, max) => (
    <p style={{ color: val.length >= max ? '#CF0A0A' : '#EEEEEE33', fontSize: '10px', textAlign: 'right', marginTop: '3px' }}>
      {val.length}/{max}
    </p>
  )

  // Order Success Screen
  if (orderPlaced) {
    return (
      <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ maxWidth: '500px', width: '100%', textAlign: 'center', backgroundColor: '#111111', border: '1px solid #222222', padding: '40px', borderRadius: '24px' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
            <CheckCircle size={80} style={{ color: '#059669', marginBottom: '20px' }} />
          </motion.div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '10px' }}>Order Placed! 🎉</h2>
          <p style={{ color: '#EEEEEE66', fontSize: '14px', marginBottom: '20px' }}>
            Thank you <span style={{ color: '#EEEEEE', fontWeight: 700 }}>{name}</span>! Your order has been received.
          </p>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#EEEEEE44', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>ORDER ID</p>
            <p style={{ color: '#CF0A0A', fontSize: '18px', fontWeight: 900, fontFamily: 'monospace' }}>#{orderId.slice(-8).toUpperCase()}</p>
          </div>
          <div style={{ backgroundColor: '#059669' + '11', border: '1px solid #05966933', borderRadius: '10px', padding: '12px', marginBottom: '20px' }}>
            <p style={{ color: '#059669', fontSize: '13px', fontWeight: 600 }}>
              📱 Track your order anytime on the <strong>Track Order</strong> page using your phone number: <strong>{phone}</strong>
            </p>
          </div>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ color: '#EEEEEE44', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>ORDER SUMMARY</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#EEEEEE88', fontSize: '13px' }}>{product.name}</span>
              <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 600 }}>× {quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Total Amount</span>
              <span style={{ color: '#CF0A0A', fontSize: '16px', fontWeight: 900 }}>Rs. {Number(totalPrice).toLocaleString()}</span>
            </div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '8px', marginTop: '8px' }}>
              <span style={{ color: '#059669', fontSize: '12px' }}>
                ✓ {selectedPayment === 'cod' ? 'Cash on Delivery' : selectedPayment === 'jazzcash' ? 'JazzCash Payment' : 'EasyPaisa Payment'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/track-order')}
              style={{ flex: 1, backgroundColor: '#111', color: '#EEEEEE', border: '1px solid #333', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Track Order
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              style={{ flex: 1, backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Continue Shopping
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: '#000000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '40px', height: '40px', border: '3px solid #CF0A0A', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    )
  }

  const unitPrice = Number(product.price || product.sellPrice || 0)
  const currentPayment = paymentMethods[selectedPayment]

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', fontFamily: 'sans-serif' }}>

      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <motion.div whileHover={{ scale: 1.05 }} style={{ fontSize: '24px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '1px' }} onClick={() => navigate('/')}>
          <span style={{ color: '#CF0A0A' }}>M</span><span style={{ color: '#CF0A0A' }}>&</span>
          <span style={{ color: '#B8960C' }}>J</span>
          <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '5px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
        </motion.div>
        <motion.button whileHover={{ x: -4 }} onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: 'none', color: '#EEEEEE', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
           
        </motion.button>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>

        {/* LEFT: Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px' }}>Checkout <span style={{ color: '#CF0A0A' }}>Details</span></h2>
          <p style={{ color: '#EEEEEE44', fontSize: '13px', marginBottom: '30px' }}>Fill in your delivery information</p>

          <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Name */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE99', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <User size={14} style={{ color: '#CF0A0A' }} /> FULL NAME *
              </label>
              <input type="text" placeholder="Enter your full name" value={name} onChange={handleName}
                style={inputStyle(errors.name)} />
              {counterText(name, LIMITS.name)}
              {errorText(errors.name)}
            </div>

            {/* Phone */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE99', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Phone size={14} style={{ color: '#CF0A0A' }} /> WHATSAPP NUMBER * <span style={{ color: '#EEEEEE33', fontWeight: 400 }}>(11 digits, e.g. 03001234567)</span>
              </label>
              <input type="tel" placeholder="03XXXXXXXXX" value={phone} onChange={handlePhone}
                style={inputStyle(errors.phone)} maxLength={11} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                {errorText(errors.phone)}
                <p style={{ color: phone.length === 11 ? '#059669' : phone.length >= 9 ? '#B8960C' : '#EEEEEE33', fontSize: '10px', marginLeft: 'auto' }}>
                  {phone.length}/11
                </p>
              </div>
            </div>

            {/* City */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE99', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <MapPin size={14} style={{ color: '#CF0A0A' }} /> CITY *
              </label>
              <input type="text" placeholder="e.g. Karachi, Lahore, Islamabad" value={city} onChange={handleCity}
                style={inputStyle(errors.city)} />
              {counterText(city, LIMITS.city)}
              {errorText(errors.city)}
            </div>

            {/* Address */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE99', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Truck size={14} style={{ color: '#CF0A0A' }} /> DELIVERY ADDRESS *
              </label>
              <textarea rows="3" placeholder="House #, Street name, Area, Near landmark..." value={address} onChange={handleAddress}
                style={{ ...inputStyle(errors.address), resize: 'none' }} />
              {counterText(address, LIMITS.address)}
              {errorText(errors.address)}
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE99', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Package size={14} style={{ color: '#CF0A0A' }} /> ORDER NOTES <span style={{ color: '#EEEEEE33', fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea rows="2" placeholder="Any special instructions..." value={notes} onChange={handleNotes}
                style={{ ...inputStyle(false), resize: 'none' }} />
              {counterText(notes, LIMITS.notes)}
            </div>

            {/* Payment Method */}
            <div style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '14px', padding: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#EEEEEE99', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={14} style={{ color: '#CF0A0A' }} /> SELECT PAYMENT METHOD
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.values(paymentMethods).map((method) => (
                  <motion.div key={method.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPayment(method.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '10px', cursor: 'pointer', border: selectedPayment === method.id ? `2px solid ${method.color}` : '2px solid #333', backgroundColor: selectedPayment === method.id ? `${method.color}11` : '#0a0a0a', transition: 'all 0.2s' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${selectedPayment === method.id ? method.color : '#555'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selectedPayment === method.id && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: method.color }} />}
                    </div>
                    <div style={{ color: method.color, flexShrink: 0 }}>{method.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', color: '#EEEEEE' }}>{method.label}</p>
                      <p style={{ color: '#EEEEEE55', fontSize: '11px', marginTop: '2px' }}>{method.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <AnimatePresence>
                {currentPayment.details && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ marginTop: '16px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#0a0a0a', border: `1px solid ${currentPayment.color}33`, borderRadius: '10px', padding: '16px' }}>
                      <p style={{ color: currentPayment.color, fontSize: '11px', fontWeight: 800, letterSpacing: '2px', marginBottom: '12px', textTransform: 'uppercase' }}>{currentPayment.label} ACCOUNT DETAILS</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[['Account Title', currentPayment.details.accountTitle], ['Account Number', currentPayment.details.accountNumber], ['IBAN', currentPayment.details.iban]].map(([label, val]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#111', borderRadius: '8px' }}>
                            <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>{label}</span>
                            <span style={{ color: '#EEEEEE', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ color: '#EEEEEE44', fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>Please send payment screenshot to WhatsApp after transfer</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 25px #CF0A0A55' }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              style={{ width: '100%', backgroundColor: loading ? '#7a0606' : '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: 800, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
              {loading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /> Processing...</>
              ) : (
                <><ShoppingCart size={20} /> Place Order — Rs. {Number(totalPrice).toLocaleString()}</>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* RIGHT: Order Summary */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#EEEEEE88' }}>Order Summary</h3>
            <div style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '70px', height: '70px', backgroundColor: '#1a1a1a', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                  {product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{product.img || '📦'}</span>}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{product.name}</p>
                  <p style={{ color: '#EEEEEE55', fontSize: '12px' }}>{product.category}</p>
                </div>
              </div>
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <p style={{ color: '#EEEEEE44', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>SELECTED OPTIONS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedRam && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#EEEEEE55', fontSize: '12px' }}>RAM</span><span style={{ color: '#EEEEEE', fontSize: '12px', fontWeight: 600 }}>{selectedRam} GB</span></div>}
                  {selectedStorage && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Storage</span><span style={{ color: '#EEEEEE', fontSize: '12px', fontWeight: 600 }}>{selectedStorage} GB</span></div>}
                  {selectedColor && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Color</span><span style={{ color: '#EEEEEE', fontSize: '12px', fontWeight: 600 }}>{selectedColor}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Quantity</span><span style={{ color: '#EEEEEE', fontSize: '12px', fontWeight: 600 }}>{quantity}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#EEEEEE55', fontSize: '13px' }}>Unit Price</span><span style={{ color: '#EEEEEE', fontSize: '13px' }}>Rs. {unitPrice.toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#EEEEEE55', fontSize: '13px' }}>Quantity</span><span style={{ color: '#EEEEEE', fontSize: '13px' }}>× {quantity}</span></div>
                <div style={{ borderTop: '1px solid #333', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#EEEEEE88', fontSize: '14px', fontWeight: 700 }}>Total</span>
                  <span style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }}>Rs. {Number(totalPrice).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ backgroundColor: '#CF0A0A11', border: '1px solid #CF0A0A22', borderRadius: '8px', padding: '10px' }}>
                <p style={{ color: '#CF0A0A', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><Truck size={12} /> FREE DELIVERY</p>
                <p style={{ color: '#EEEEEE55', fontSize: '11px', marginTop: '2px' }}>Estimated delivery: 1-3 business days</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CheckoutPage