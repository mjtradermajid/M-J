import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Star, Heart, ArrowLeft, Check, Truck, Shield, RefreshCw, Zap } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'

const colorMap = {
  'Space Black': '#1a1a1a', 'Silver': '#C0C0C0', 'Gold': '#B8960C',
  'Deep Purple': '#4B0082', 'Phantom Black': '#0a0a0a', 'White': '#F5F5F5',
  'Green': '#166534', 'Burgundy': '#800020', 'Black': '#111111', 'Blue': '#1d4ed8',
}

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedStorage, setSelectedStorage] = useState(null)
  const [selectedRam, setSelectedRam] = useState(null)
  const [wishlist, setWishlist] = useState(false)
  const [activeTab, setActiveTab] = useState('specs')
  const [cartLoading, setCartLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [flyingItems, setFlyingItems] = useState([])
  const cartRef = useRef(null)

  // Fetch product from Firebase
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const docRef = doc(db, 'products', id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() }
          setProduct(data)
          if (data.colors?.length > 0) setSelectedColor(data.colors[0])
          if (data.storage?.length > 0) setSelectedStorage(data.storage[0])
          if (data.ram?.length > 0) setSelectedRam(data.ram[0])
        } else {
          setProduct(null)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  // Cart count from localStorage
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.reduce((sum, item) => sum + (item.qty || 1), 0))
    } catch (e) { setCartCount(0) }
  }, [])

  const handleCart = (e) => {
    const btn = e.currentTarget
    const btnRect = btn.getBoundingClientRect()
    const cartRect = cartRef.current?.getBoundingClientRect()
    const startX = btnRect.left + btnRect.width / 2
    const startY = btnRect.top + btnRect.height / 2
    const endX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 40
    const endY = cartRect ? cartRect.top + cartRect.height / 2 : 40
    const flyId = Date.now()
    setFlyingItems(prev => [...prev, { id: flyId, imageUrl: product?.imageUrl || null, img: product?.img || '📦', startX, startY, endX, endY }])
    setCartLoading(true)
    setTimeout(() => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        const exists = cart.find(x => x.id === product.id)
        const newCart = exists
          ? cart.map(x => x.id === product.id ? { ...x, qty: x.qty + quantity } : x)
          : [...cart, { ...product, qty: quantity, selectedColor, selectedStorage, selectedRam }]
        localStorage.setItem('cart', JSON.stringify(newCart))
        setCartCount(newCart.reduce((sum, item) => sum + (item.qty || 1), 0))
      } catch (e) { console.error(e) }
      setFlyingItems(prev => prev.filter(f => f.id !== flyId))
      setCartLoading(false)
    }, 900)
  }

  // ✅ Order Now → Checkout Page
  const handleOrderNow = () => {
    navigate('/checkout', {
      state: {
        product,
        selectedColor,
        selectedStorage,
        selectedRam,
        quantity,
        totalPrice: currentPrice * quantity
      }
    })
  }

  // Loading
  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ width: '50px', height: '50px', border: '3px solid #CF0A0A33', borderTopColor: '#CF0A0A', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: '#EEEEEE55' }}>Loading product...</p>
        </div>
      </div>
    )
  }

  // Not Found
  if (!product) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EEEEEE' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '60px' }}>😕</p>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Product not found</h2>
          <button onClick={() => navigate('/products')}
            style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '50px', cursor: 'pointer', fontWeight: 700 }}>
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  const currentPrice = Number(product.price || product.sellPrice || 0)
  const oldPrice = Number(product.oldPrice || 0)
  const discount = oldPrice > currentPrice ? Math.round((1 - currentPrice / oldPrice) * 100) : 0

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', display: 'flex', flexDirection: 'column' }}>

      {/* FLYING ANIMATION */}
      <AnimatePresence>
        {flyingItems.map(item => (
          <motion.div key={item.id}
            initial={{ position: 'fixed', left: item.startX - 30, top: item.startY - 30, zIndex: 9999, opacity: 1, scale: 1, pointerEvents: 'none' }}
            animate={{ left: item.endX - 15, top: item.endY - 15, opacity: [1, 1, 0], scale: [1, 1.3, 0.3] }}
            transition={{ duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none' }}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '40px' }}>{item.img}</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* NAVBAR - Logo Left, Cart Right */}
      <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>

        {/* ✅ LOGO LEFT (Back button removed) */}
        <motion.div whileHover={{ scale: 1.05 }} style={{ fontSize: '24px', fontWeight: 900, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <motion.span style={{ color: '#CF0A0A' }} animate={{ textShadow: ['0 0 10px #CF0A0A', '0 0 25px #CF0A0A', '0 0 10px #CF0A0A'] }} transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
          <motion.span style={{ color: '#B8960C' }} animate={{ textShadow: ['0 0 10px #B8960C', '0 0 25px #B8960C', '0 0 10px #B8960C'] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
          <span style={{ color: '#EEEEEE', fontSize: '13px', marginLeft: '6px', letterSpacing: '3px', fontWeight: 400 }}>TRADERS</span>
        </motion.div>

        {/* Right Side: Cart + Wishlist */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div ref={cartRef} whileHover={{ scale: 1.15 }} style={{ position: 'relative', cursor: 'pointer' }}>
            <motion.div animate={cartCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
              <ShoppingCart size={22} style={{ color: '#EEEEEE' }} />
            </motion.div>
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span key={cartCount} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#CF0A0A', color: 'white', fontSize: '10px', fontWeight: 800, width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' }}>
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button whileHover={{ scale: 1.1 }} onClick={() => setWishlist(!wishlist)}
            style={{ backgroundColor: wishlist ? '#CF0A0A22' : 'transparent', border: `1px solid ${wishlist ? '#CF0A0A' : '#333'}`, borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Heart size={18} fill={wishlist ? '#CF0A0A' : 'none'} style={{ color: wishlist ? '#CF0A0A' : '#EEEEEE' }} />
          </motion.button>
        </div>
      </motion.nav>

      {/* MAIN CONTENT - 2 column layout */}
      <div style={{ display: 'flex', gap: '0', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px', boxSizing: 'border-box', flexWrap: 'wrap' }}>

        {/* LEFT COLUMN - Product Info */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          style={{ flex: '1 1 320px', paddingRight: '24px', borderRight: '1px solid #CF0A0A22' }}>

          {/* Category */}
          <p style={{ color: '#CF0A0A', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', marginBottom: '6px' }}>
            {product.category?.toUpperCase()}
          </p>

          {/* Name */}
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 900, marginBottom: '16px', lineHeight: 1.2 }}>{product.name}</h1>

          {/* Image */}
          <div style={{ backgroundColor: '#111', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px', position: 'relative', overflow: 'hidden', marginBottom: '20px', border: '1px solid #CF0A0A22' }}>
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, #CF0A0A44 0%, transparent 70%)', pointerEvents: 'none' }} />
            {product.badge && (
              <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: product.badge === 'SALE' ? '#DC5F00' : product.badge === 'NEW' ? '#059669' : '#CF0A0A', color: 'white', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>
                {product.badge}
              </div>
            )}
            {product.imageUrl ? (
              <motion.img src={product.imageUrl} alt={product.name}
                animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 10px 30px #CF0A0A44)' }} />
            ) : (
              <motion.span animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: '100px', filter: 'drop-shadow(0 10px 30px #CF0A0A66)', zIndex: 1 }}>
                {product.img || '📦'}
              </motion.span>
            )}
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            {[...Array(5)].map((_, j) => (
              <Star key={j} size={15} fill={j < Math.floor(product.rating || 5) ? '#B8960C' : 'none'} style={{ color: '#B8960C' }} />
            ))}
            <span style={{ color: '#B8960C', fontWeight: 700, fontSize: '13px' }}>{product.rating || '5.0'}</span>
            <span style={{ color: '#EEEEEE44', fontSize: '12px' }}>({product.reviews || 0} reviews)</span>
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { icon: <Truck size={14} />, text: '1-3 Day Delivery' },
              { icon: <Shield size={14} />, text: '100% Original' },
              { icon: <RefreshCw size={14} />, text: '7-Day Return' },
              { icon: <Zap size={14} />, text: 'Best Price' },
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#111', border: '1px solid #CF0A0A22', borderRadius: '8px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#EEEEEE66', fontSize: '11px' }}>
                <span style={{ color: '#CF0A0A' }}>{item.icon}</span>{item.text}
              </div>
            ))}
          </div>

          {/* TABS */}
          <div style={{ marginTop: '20px', backgroundColor: '#111', borderRadius: '14px', border: '1px solid #CF0A0A22', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #CF0A0A22' }}>
              {['specs', 'description'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === tab ? '#CF0A0A11' : 'transparent', color: activeTab === tab ? '#CF0A0A' : '#EEEEEE55', fontWeight: activeTab === tab ? 700 : 400, fontSize: '13px', borderBottom: activeTab === tab ? '2px solid #CF0A0A' : '2px solid transparent', transition: 'all 0.2s' }}>
                  {tab === 'specs' ? '📋 SPECIFICATIONS' : '📝 DESCRIPTION'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ padding: '16px' }}>
                {activeTab === 'specs' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {product.specs && Object.keys(product.specs).length > 0 ? (
                      Object.entries(product.specs).map(([key, val], i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                          <span style={{ color: '#EEEEEE44', fontSize: '10px', marginBottom: '3px' }}>{key.toUpperCase()}</span>
                          <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 600 }}>{val}</span>
                        </div>
                      ))
                    ) : (
                      [
                        { key: 'CATEGORY', val: product.category },
                        { key: 'STOCK', val: `${product.stock || 0} units` },
                        { key: 'STATUS', val: product.status || 'Active' },
                        { key: 'BADGE', val: product.badge || 'None' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                          <span style={{ color: '#EEEEEE44', fontSize: '10px', marginBottom: '3px' }}>{item.key}</span>
                          <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 600 }}>{item.val}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p style={{ color: '#EEEEEE77', fontSize: '13px', lineHeight: 1.7 }}>
                    {product.description || 'No description available.'}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* RIGHT COLUMN - Order Panel */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ flex: '1 1 300px', paddingLeft: '24px' }}>

          <div style={{ position: 'sticky', top: '90px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: '#EEEEEE88' }}>Checkout Order Details</h2>
            <p style={{ color: '#EEEEEE44', fontSize: '12px', marginBottom: '20px' }}>Provide delivery destination address details</p>

            {/* Order Summary Box */}
            <div style={{ backgroundColor: '#111', borderRadius: '14px', border: '1px solid #CF0A0A22', padding: '16px', marginBottom: '20px' }}>
              <p style={{ color: '#EEEEEE44', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>ORDER SUMMARY</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#1a1a1a', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '28px' }}>{product.img || '📦'}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{product.name}</p>
                  <p style={{ color: '#EEEEEE55', fontSize: '11px' }}>
                    {selectedRam && `RAM ${selectedRam}`}
                    {selectedStorage && ` · Storage ${selectedStorage}`}
                    {selectedColor && ` · Color: ${selectedColor}`}
                    {` · Qty: ${quantity}`}
                  </p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #EEEEEE11', marginTop: '12px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Subtotal</span>
                <span style={{ color: '#CF0A0A', fontWeight: 800, fontSize: '14px' }}>Rs. {(currentPrice * quantity).toLocaleString()}</span>
              </div>
            </div>

            {/* RAM */}
            {product.ram && Array.isArray(product.ram) && product.ram.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#EEEEEE88', fontSize: '12px', fontWeight: 700, marginBottom: '8px', letterSpacing: '1px' }}>• SELECT RAM:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.ram.map((ram, i) => (
                    <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => setSelectedRam(ram)}
                      style={{ padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedRam === ram ? '#CF0A0A' : '#1a1a1a', border: `1px solid ${selectedRam === ram ? '#CF0A0A' : '#333'}`, color: '#EEEEEE', fontSize: '13px', fontWeight: 600 }}>
                      {ram}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage */}
            {product.storage && Array.isArray(product.storage) && product.storage.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#EEEEEE88', fontSize: '12px', fontWeight: 700, marginBottom: '8px', letterSpacing: '1px' }}>• SELECT STORAGE:</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.storage.map((s, i) => (
                    <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => setSelectedStorage(s)}
                      style={{ padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedStorage === s ? '#CF0A0A' : '#1a1a1a', border: `1px solid ${selectedStorage === s ? '#CF0A0A' : '#333'}`, color: '#EEEEEE', fontSize: '13px', fontWeight: 600 }}>
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && Array.isArray(product.colors) && product.colors.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#EEEEEE88', fontSize: '12px', fontWeight: 700, marginBottom: '8px', letterSpacing: '1px' }}>
                  • SELECT COLOR: <span style={{ color: '#EEEEEE', fontWeight: 400 }}>{selectedColor}</span>
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.colors.map((color, i) => (
                    <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => setSelectedColor(color)} title={color}
                      style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: colorMap[color] || '#555', border: selectedColor === color ? '3px solid #CF0A0A' : '2px solid #444', cursor: 'pointer', position: 'relative', boxShadow: selectedColor === color ? '0 0 10px #CF0A0A88' : 'none' }}>
                      {selectedColor === color && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={12} style={{ color: color === 'White' || color === 'Silver' ? '#000' : '#fff' }} />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: '#111', borderRadius: '12px', padding: '14px 16px', border: '1px solid #222' }}>
              <div>
                <p style={{ color: '#EEEEEE55', fontSize: '11px', marginBottom: '3px' }}>UNIT PRICE</p>
                <p style={{ color: '#CF0A0A', fontSize: '18px', fontWeight: 900 }}>Rs. {currentPrice.toLocaleString()}</p>
                {oldPrice > currentPrice && (
                  <p style={{ color: '#EEEEEE33', fontSize: '11px', textDecoration: 'line-through' }}>Rs. {oldPrice.toLocaleString()}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#EEEEEE', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</motion.button>
                <span style={{ fontSize: '16px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{quantity}</span>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setQuantity(q => q + 1)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#EEEEEE', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</motion.button>
              </div>
            </div>

            {/* Total */}
            <div style={{ backgroundColor: '#CF0A0A11', border: '1px solid #CF0A0A33', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#EEEEEE88', fontSize: '13px', fontWeight: 600 }}>Total ({quantity} item{quantity > 1 ? 's' : ''}):</span>
              <span style={{ color: '#CF0A0A', fontSize: '20px', fontWeight: 900 }}>Rs. {(currentPrice * quantity).toLocaleString()}</span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* ✅ ORDER NOW → Checkout Page */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 25px #CF0A0A88' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOrderNow}
                style={{ width: '100%', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '15px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ShoppingCart size={18} /> Order Now
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 15px #DC5F0066' }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => handleCart(e)}
                disabled={cartLoading}
                style={{ width: '100%', backgroundColor: 'transparent', color: '#DC5F00', border: '2px solid #DC5F00', borderRadius: '12px', padding: '13px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {cartLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '18px', height: '18px', border: '2px solid #DC5F00', borderTopColor: 'transparent', borderRadius: '50%' }} />
                ) : <><ShoppingCart size={16} /> Add to Cart</>}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#0D0D0D', borderTop: '1px solid #CF0A0A22', padding: '20px 32px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '18px', fontWeight: 900 }}>
            <span style={{ color: '#CF0A0A' }}>M</span>
            <span style={{ color: '#B8960C' }}>J</span>
            <span style={{ color: '#EEEEEE', fontSize: '12px', marginLeft: '6px', letterSpacing: '2px' }}>STORE</span>
          </div>
          <motion.a href="https://www.instagram.com/idreesalzeyadi/" target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EEEEEE66', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid #EEEEEE22', padding: '8px 16px', borderRadius: '50px' }}>
            📸 Developed by Idrees Alzeyadi
          </motion.a>
          <p style={{ color: '#EEEEEE22', fontSize: '12px' }}>© 2026 MJ Store.</p>
        </div>
      </footer>
    </div>
  )
}

export default ProductDetail