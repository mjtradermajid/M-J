import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Star, Heart } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore'

const colorMap = {
  'Space Black': '#1a1a1a', 'Silver': '#C0C0C0', 'Gold': '#B8960C',
  'Deep Purple': '#4B0082', 'Phantom Black': '#0a0a0a', 'White': '#EEEEEE',
  'Green': '#166534', 'Burgundy': '#800020', 'Black': '#111111', 'Blue': '#1d4ed8',
}

function Products() {
  const [products, setProducts] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [cartCount, setCartCount] = useState(0)
  const [flyingItems, setFlyingItems] = useState([])
  const [loadingMap, setLoadingMap] = useState({})
  const [fetching, setFetching] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const cartRef = useRef(null)
  const navigate = useNavigate()

  // Fetch products
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProducts(pList)
      setFetching(false)
    }, (error) => {
      console.error('Firestore Fetching Error:', error)
      setFetching(false)
    })
    return () => unsubscribe()
  }, [])

  // Fetch active discounts
  useEffect(() => {
    const discountsQuery = query(
      collection(db, 'discounts'),
      where('isActive', '==', true)
    )
    
    const unsubscribe = onSnapshot(discountsQuery, (snapshot) => {
      const discountList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Filter discounts that are currently valid (check date range)
      const today = new Date().toISOString().split('T')[0] // "2026-06-27" format
      const activeDiscounts = discountList.filter(discount => {
        const startDate = discount.startDate || '1970-01-01'
        const endDate = discount.endDate || '2099-12-31'
        return today >= startDate && today <= endDate
      })
      
      console.log('Active Discounts:', activeDiscounts) // Debug log
      setDiscounts(activeDiscounts)
    }, (error) => {
      console.error('Discounts Fetching Error:', error)
    })
    
    return () => unsubscribe()
  }, [])

  // Function to get applicable discount for a product
  const getProductDiscount = (product) => {
    const discount = discounts.find(d => d.productId === product.id)
    return discount || null
  }

  // Calculate discounted price
  const calculateDiscountedPrice = (product) => {
    const originalPrice = Number(product.price || product.sellPrice || 0)
    const discount = getProductDiscount(product)
    
    if (!discount) {
      // No active discount - use product's own oldPrice if exists
      return {
        currentPrice: originalPrice,
        oldPrice: Number(product.oldPrice || 0),
        discountPct: product.oldPrice > originalPrice 
          ? Math.round((1 - originalPrice / product.oldPrice) * 100) 
          : 0,
        hasActiveDiscount: false
      }
    }

    // Use discount from discounts collection
    return {
      currentPrice: Number(discount.salePrice),
      oldPrice: Number(discount.originalPrice),
      discountPct: Number(discount.discountPercent),
      hasActiveDiscount: true,
      discountLabel: `${discount.discountPercent}% OFF`
    }
  }

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load cart count from localStorage
  useEffect(() => {
    const loadCartCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartCount(saved.reduce((sum, item) => sum + (item.qty || 1), 0))
      } catch {
        setCartCount(0)
      }
    }
    loadCartCount()
    window.addEventListener('cartUpdated', loadCartCount)
    window.addEventListener('storage', loadCartCount)
    return () => {
      window.removeEventListener('cartUpdated', loadCartCount)
      window.removeEventListener('storage', loadCartCount)
    }
  }, [])

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Add to cart with discounted price
  const handleAddToCart = (product, e) => {
    e.stopPropagation()
    const btn = e.currentTarget
    const btnRect = btn.getBoundingClientRect()
    const cartRect = cartRef.current?.getBoundingClientRect()
    const startX = btnRect.left + btnRect.width / 2
    const startY = btnRect.top + btnRect.height / 2
    const endX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 40
    const endY = cartRect ? cartRect.top + cartRect.height / 2 : 40
    const flyId = Date.now()

    setFlyingItems(prev => [...prev, { id: flyId, imageUrl: product.imageUrl || null, img: product.img || '📦', startX, startY, endX, endY }])
    setLoadingMap(prev => ({ ...prev, [product.id]: true }))

    setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem('cart') || '[]')
        const idx = existing.findIndex(x => x.id === product.id)
        
        // Get discounted price for cart
        const priceInfo = calculateDiscountedPrice(product)
        const cartProduct = {
          ...product,
          price: priceInfo.currentPrice,
          originalPrice: priceInfo.oldPrice,
          discountApplied: priceInfo.hasActiveDiscount
        }
        
        if (idx > -1) {
          existing[idx].qty = (existing[idx].qty || 1) + 1
        } else {
          existing.push({ ...cartProduct, qty: 1 })
        }
        localStorage.setItem('cart', JSON.stringify(existing))
        setCartCount(existing.reduce((sum, item) => sum + (item.qty || 1), 0))
        window.dispatchEvent(new Event('cartUpdated'))
      } catch (err) {
        console.error('Cart error:', err)
      }
      setFlyingItems(prev => prev.filter(f => f.id !== flyId))
      setLoadingMap(prev => ({ ...prev, [product.id]: false }))
    }, 900)
  }

  const isMobile = windowWidth < 768
  const gridCols = windowWidth >= 1024 ? 'repeat(4, 1fr)' : windowWidth >= 768 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      {/* Flying cart animation */}
      <AnimatePresence>
        {flyingItems.map(item => (
          <motion.div
            key={item.id}
            initial={{ position: 'fixed', left: item.startX - 30, top: item.startY - 30, zIndex: 9999, opacity: 1, scale: 1, pointerEvents: 'none' }}
            animate={{ left: item.endX - 15, top: item.endY - 15, opacity: [1, 1, 0], scale: [1, 1.3, 0.3] }}
            transition={{ duration: 0.85, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none' }}
          >
            {item.imageUrl
              ? <img src={item.imageUrl} alt="flying" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
              : <span style={{ fontSize: '40px' }}>{item.img}</span>
            }
          </motion.div>
        ))}
      </AnimatePresence>

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50, padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <motion.div whileHover={{ scale: 1.05 }} onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '1px', flexShrink: 0 }}>
            <motion.span style={{ color: '#CF0A0A', fontSize: '24px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #CF0A0A', '0 0 25px #CF0A0A', '0 0 10px #CF0A0A'] }} transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
            <span style={{ color: '#CF0A0A', fontSize: '24px', fontWeight: 900 }}>&</span>
            <motion.span style={{ color: '#B8960C', fontSize: '24px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #B8960C', '0 0 25px #B8960C', '0 0 10px #B8960C'] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
            <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '5px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
          </motion.div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }, { label: 'Track', path: '/track-order' }].map((link, i) => (
              <motion.button key={link.label} onClick={() => navigate(link.path)} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ color: '#CF0A0A', y: -2 }} style={{ color: '#EEEEEE99', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {link.label}
              </motion.button>
            ))}
            <motion.div ref={cartRef} whileHover={{ scale: 1.15 }} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/cart')}>
              <motion.div animate={cartCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
                <ShoppingCart size={20} style={{ color: '#EEEEEE' }} />
              </motion.div>
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span key={cartCount} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#CF0A0A', color: 'white', fontSize: '10px', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' }}>
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* HEADING */}
      <div style={{ padding: '32px 16px 16px', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, marginBottom: '8px' }}>
          All <span style={{ color: '#CF0A0A' }}>Products</span>
        </motion.h1>
        <p style={{ color: '#EEEEEE55', fontSize: '14px' }}>Browse our premium collection</p>
        <div style={{ width: '50px', height: '3px', background: 'linear-gradient(to right, #CF0A0A, #DC5F00)', margin: '12px auto 0', borderRadius: '2px' }} />
      </div>

      {/* PRODUCTS GRID */}
      <div style={{ padding: isMobile ? '12px 10px 60px' : '16px 24px 60px', display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? '12px' : '20px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {fetching ? (
          <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', padding: '60px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid #CF0A0A', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <p style={{ color: '#EEEEEE55', fontSize: '14px' }}>Loading premium catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#EEEEEE44' }}>
            <p style={{ fontSize: '18px', fontWeight: 600 }}>No products found in database.</p>
            <p style={{ fontSize: '13px', marginTop: '5px' }}>Admin panel se products add karein!</p>
          </div>
        ) : (
          products.map((product, i) => {
            // Use the discount calculation
            const priceInfo = calculateDiscountedPrice(product)
            const { currentPrice, oldPrice, discountPct, hasActiveDiscount, discountLabel } = priceInfo

            // Determine badge - prioritize active discount badge
            const displayBadge = hasActiveDiscount 
              ? discountLabel 
              : product.badge

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 150 }}
                style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
              >
                {displayBadge && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    left: '8px', 
                    zIndex: 3, 
                    backgroundColor: hasActiveDiscount ? '#DC5F00' : displayBadge === 'SALE' ? '#DC5F00' : displayBadge === 'NEW' ? '#059669' : '#CF0A0A', 
                    color: 'white', 
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '20px', 
                    letterSpacing: '1px' 
                  }}>
                    {displayBadge}
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id) }} style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 3, backgroundColor: '#00000088', border: 'none', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={13} fill={wishlist.includes(product.id) ? '#CF0A0A' : 'none'} style={{ color: wishlist.includes(product.id) ? '#CF0A0A' : '#EEEEEE' }} />
                </motion.button>

                <div onClick={() => navigate(`/product/${product.id}`)} style={{ height: isMobile ? '150px' : '200px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.imageUrl
                    ? <motion.img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} whileHover={{ scale: 1.08 }} transition={{ duration: 0.3 }} />
                    : <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }} style={{ fontSize: '55px' }}>{product.img || '📦'}</motion.span>
                  }
                </div>

                <div style={{ padding: isMobile ? '10px' : '16px' }}>
                  <p style={{ color: '#EEEEEE55', fontSize: isMobile ? '10px' : '11px', marginBottom: '3px' }}>{product.category || 'General'}</p>
                  <p style={{ fontWeight: 700, fontSize: isMobile ? '13px' : '15px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>

                  {product.colors && Array.isArray(product.colors) && product.colors.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                      {product.colors.slice(0, 4).map((color, ci) => (
                        <div key={ci} title={color} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: colorMap[color] || '#555', border: '1px solid #ffffff33' }} />
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '8px' }}>
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={10} fill={j < Math.floor(product.rating || 5) ? '#B8960C' : 'none'} style={{ color: '#B8960C' }} />
                    ))}
                    <span style={{ color: '#EEEEEE55', fontSize: '10px', marginLeft: '3px' }}>({product.reviews || 0})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <p style={{ color: '#CF0A0A', fontSize: isMobile ? '15px' : '17px', fontWeight: 900 }}>Rs. {currentPrice.toLocaleString()}</p>
                    {oldPrice > currentPrice && (
                      <>
                        <p style={{ color: '#EEEEEE33', fontSize: '11px', textDecoration: 'line-through' }}>Rs. {oldPrice.toLocaleString()}</p>
                        <span style={{ backgroundColor: '#DC5F0022', color: '#DC5F00', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>-{discountPct}%</span>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 20px #CF0A0A66' }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/order/${product.id}`)} style={{ flex: 1, backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '8px', padding: isMobile ? '9px 4px' : '11px 8px', fontWeight: 700, fontSize: isMobile ? '11px' : '13px', cursor: 'pointer' }}>
                      Order Now
                    </motion.button>

                    <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 15px #DC5F0066' }} whileTap={{ scale: 0.95 }} onClick={(e) => handleAddToCart(product, e)} disabled={loadingMap[product.id]} style={{ flex: 1, backgroundColor: 'transparent', color: '#DC5F00', border: '2px solid #DC5F00', borderRadius: '8px', padding: isMobile ? '9px 4px' : '11px 8px', fontWeight: 700, fontSize: isMobile ? '11px' : '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <AnimatePresence mode="wait">
                        {loadingMap[product.id] ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} style={{ width: '12px', height: '12px', border: '2px solid #DC5F00', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            Adding...
                          </motion.div>
                        ) : (
                          <motion.div key="cart" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShoppingCart size={12} /> Cart
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>

                <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, border: '2px solid #CF0A0A44', borderRadius: '14px', pointerEvents: 'none' }} />
              </motion.div>
            )
          })
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #CF0A0A33', padding: '40px 16px 24px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Logo + Tagline */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px', marginBottom: '8px' }}>
              <span style={{ color: '#CF0A0A', fontSize: '28px', fontWeight: 900 }}>M</span>
              <span style={{ color: '#CF0A0A', fontSize: '28px', fontWeight: 900 }}>&</span>
              <span style={{ color: '#B8960C', fontSize: '28px', fontWeight: 900 }}>J</span>
              <span style={{ color: '#EEEEEE', fontSize: '12px', marginLeft: '6px', letterSpacing: '3px', fontWeight: 700 }}>TRADERS</span>
            </div>
            <p style={{ color: '#EEEEEE44', fontSize: '12px', letterSpacing: '1px' }}>Pakistan's Premium Electronics Store</p>
          </div>

          {/* Social Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>

            {/* Facebook */}
            <motion.a href="https://www.facebook.com/mjtraders1129" target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.12, y: -4 }} whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '12px 18px', minWidth: '76px', color: '#EEEEEE66', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1877F2'; e.currentTarget.style.backgroundColor = '#1877F211'; e.currentTarget.style.color = '#1877F2' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.color = '#EEEEEE66' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px' }}>Facebook</span>
            </motion.a>

            {/* Instagram */}
            <motion.a href="https://www.instagram.com/idreesalzeyadi/" target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.12, y: -4 }} whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '12px 18px', minWidth: '76px', color: '#EEEEEE66', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E1306C'; e.currentTarget.style.backgroundColor = '#E1306C11'; e.currentTarget.style.color = '#E1306C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.color = '#EEEEEE66' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px' }}>Instagram</span>
            </motion.a>

            {/* TikTok */}
            <motion.a href="https://www.tiktok.com/@m_j_traders?_r=1&_t=ZS-97EdoFx2A4r" target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.12, y: -4 }} whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '12px 18px', minWidth: '76px', color: '#EEEEEE66', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f2ea'; e.currentTarget.style.backgroundColor = '#00f2ea11'; e.currentTarget.style.color = '#00f2ea' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.color = '#EEEEEE66' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px' }}>TikTok</span>
            </motion.a>

            {/* WhatsApp Group */}
            <motion.a href="https://chat.whatsapp.com/BwtVVtkptoH7N8sH8Z2pV3" target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.12, y: -4 }} whileTap={{ scale: 0.95 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textDecoration: 'none', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '12px 18px', minWidth: '76px', color: '#EEEEEE66', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.backgroundColor = '#25D36611'; e.currentTarget.style.color = '#25D366' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.color = '#EEEEEE66' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px' }}>WA Group</span>
            </motion.a>

          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ color: '#EEEEEE22', fontSize: '11px' }}>© 2026 M&J Trader. All rights reserved.</p>
            <p style={{ color: '#EEEEEE22', fontSize: '11px' }}>
              Developed by <span style={{ color: '#CF0A0A', fontWeight: 600 }}>Idrees Alzeyadi</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Products
