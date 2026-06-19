import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, ShoppingBag } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [removingId, setRemovingId] = useState(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cart') || '[]')
      setCart(saved)
    } catch {
      setCart([])
    }
  }, [])

  // Save to localStorage on every change
  const saveCart = (newCart) => {
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const updateQty = (id, delta) => {
    const updated = cart.map(item =>
      item.id === id
        ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) }
        : item
    )
    saveCart(updated)
  }

  const removeItem = (id) => {
    setRemovingId(id)
    setTimeout(() => {
      const updated = cart.filter(item => item.id !== id)
      saveCart(updated)
      setRemovingId(null)
    }, 350)
  }

  const clearCart = () => {
    saveCart([])
    localStorage.removeItem('cart')
  }

  const getPrice = (item) => Number(item.price || item.sellPrice || 0)
  const subtotal = cart.reduce((sum, item) => sum + getPrice(item) * (item.qty || 1), 0)
  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0)
  const isMobile = windowWidth < 768

  const handleOrderNow = (item) => {
    navigate('/order', { state: { product: item, fromHome: true } })
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50, padding: '12px 16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '1px' }}>
            <motion.span style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #CF0A0A', '0 0 25px #CF0A0A', '0 0 10px #CF0A0A'] }} transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
            <span style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }}>&</span>
            <motion.span style={{ color: '#B8960C', fontSize: '22px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #B8960C', '0 0 25px #B8960C', '0 0 10px #B8960C'] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
            <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '5px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            {[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }, { label: 'Track', path: '/track-order' }].map(link => (
              <span key={link.label} onClick={() => navigate(link.path)} style={{ cursor: 'pointer', fontSize: '12px', color: '#EEEEEE88', fontWeight: 500 }}>{link.label}</span>
            ))}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/cart')}>
              <ShoppingCart size={20} style={{ color: '#CF0A0A' }} />
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#CF0A0A', color: 'white', fontSize: '9px', fontWeight: 800, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* MAIN */}
      <div style={{ flex: 1, maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '20px 12px' : '32px 24px', width: '100%', boxSizing: 'border-box' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, marginBottom: '4px' }}>
              My <span style={{ color: '#CF0A0A' }}>Cart</span>
            </h1>
            <p style={{ color: '#EEEEEE55', fontSize: '13px' }}>{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button whileHover={{ x: -3 }} onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', border: '1px solid #333', color: '#EEEEEE88', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '8px 14px', borderRadius: '8px' }}>
              ← Continue Shopping
            </motion.button>
            {cart.length > 0 && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={clearCart}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', border: '1px solid #CF0A0A44', color: '#CF0A0A', cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '8px 14px', borderRadius: '8px' }}>
                <Trash2 size={13} /> Clear All
              </motion.button>
            )}
          </div>
        </div>

        {/* EMPTY */}
        {cart.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 20px' }}>
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <ShoppingBag size={80} style={{ color: '#EEEEEE11', marginBottom: '20px' }} />
            </motion.div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#EEEEEE44', marginBottom: '10px' }}>Your cart is empty</h2>
            <p style={{ color: '#EEEEEE22', fontSize: '14px', marginBottom: '28px' }}>Add some products to get started!</p>
            <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 25px #CF0A0A55' }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/products')}
              style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '50px', padding: '14px 36px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} /> Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 320px', gap: '20px', alignItems: 'start' }}>

            {/* LEFT: Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {cart.map((item, i) => {
                  const price = getPrice(item)
                  const qty = item.qty || 1
                  const isRemoving = removingId === item.id

                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: isRemoving ? 0 : 1, x: isRemoving ? 60 : 0, scale: isRemoving ? 0.95 : 1 }}
                      exit={{ opacity: 0, x: 60, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: isRemoving ? 0 : i * 0.04 }}
                      style={{ backgroundColor: '#111111', border: '1px solid #222', borderRadius: '14px', padding: isMobile ? '12px' : '16px', display: 'flex', gap: isMobile ? '10px' : '14px', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
                    >
                      {/* Hover border */}
                      <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                        style={{ position: 'absolute', inset: 0, border: '1px solid #CF0A0A33', borderRadius: '14px', pointerEvents: 'none' }} />

                      {/* Image */}
                      <div onClick={() => navigate(`/product/${item.id}`)}
                        style={{ width: isMobile ? '70px' : '85px', height: isMobile ? '70px' : '85px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#1a1a1a', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2a2a2a' }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                          : <span style={{ fontSize: '32px' }}>📦</span>
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#EEEEEE44', fontSize: '10px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.category || 'General'}</p>
                        <p onClick={() => navigate(`/product/${item.id}`)}
                          style={{ fontWeight: 700, fontSize: isMobile ? '13px' : '15px', marginBottom: '6px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </p>

                        {/* Options badges */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {item.selectedColor && <span style={{ fontSize: '10px', color: '#EEEEEE55', backgroundColor: '#1a1a1a', padding: '2px 8px', borderRadius: '20px', border: '1px solid #333' }}>🎨 {item.selectedColor}</span>}
                          {item.selectedRam && <span style={{ fontSize: '10px', color: '#EEEEEE55', backgroundColor: '#1a1a1a', padding: '2px 8px', borderRadius: '20px', border: '1px solid #333' }}>RAM {item.selectedRam}GB</span>}
                          {item.selectedStorage && <span style={{ fontSize: '10px', color: '#EEEEEE55', backgroundColor: '#1a1a1a', padding: '2px 8px', borderRadius: '20px', border: '1px solid #333' }}>💾 {item.selectedStorage}GB</span>}
                        </div>

                        <p style={{ color: '#CF0A0A', fontSize: isMobile ? '15px' : '17px', fontWeight: 900 }}>Rs. {price.toLocaleString()}</p>
                      </div>

                      {/* Right controls */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                        {/* Qty */}
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQty(item.id, -1)}
                            style={{ padding: '6px 10px', border: 'none', background: 'none', color: qty <= 1 ? '#EEEEEE22' : '#EEEEEE', cursor: qty <= 1 ? 'not-allowed' : 'pointer' }}>
                            <Minus size={13} />
                          </motion.button>
                          <span style={{ padding: '0 12px', fontSize: '14px', fontWeight: 800 }}>{qty}</span>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateQty(item.id, 1)}
                            style={{ padding: '6px 10px', border: 'none', background: 'none', color: '#EEEEEE', cursor: 'pointer' }}>
                            <Plus size={13} />
                          </motion.button>
                        </div>

                        {/* Subtotal */}
                        <p style={{ color: '#EEEEEE77', fontSize: '12px', fontWeight: 700 }}>Rs. {(price * qty).toLocaleString()}</p>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => handleOrderNow(item)}
                            style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '8px', padding: isMobile ? '7px 10px' : '8px 14px', fontWeight: 700, fontSize: isMobile ? '11px' : '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShoppingCart size={11} /> Order
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1, backgroundColor: '#CF0A0A22' }} whileTap={{ scale: 0.9 }} onClick={() => removeItem(item.id)}
                            style={{ backgroundColor: 'transparent', color: '#CF0A0A', border: '1px solid #CF0A0A33', borderRadius: '8px', padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={13} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* RIGHT: Summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              style={{ backgroundColor: '#111111', border: '1px solid #222', borderRadius: '16px', padding: '20px', position: isMobile ? 'static' : 'sticky', top: '80px' }}>

              <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '18px' }}>Order Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <p style={{ color: '#EEEEEE55', fontSize: '12px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name} <span style={{ color: '#EEEEEE33' }}>×{item.qty || 1}</span>
                    </p>
                    <p style={{ color: '#EEEEEE', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>Rs. {(getPrice(item) * (item.qty || 1)).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #222', paddingTop: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#EEEEEE55', fontSize: '13px' }}>Subtotal ({totalItems} items)</span>
                  <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700 }}>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ color: '#EEEEEE55', fontSize: '13px' }}>Delivery</span>
                  <span style={{ color: '#059669', fontSize: '13px', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#CF0A0A11', border: '1px solid #CF0A0A22', borderRadius: '10px' }}>
                  <span style={{ color: '#EEEEEE', fontSize: '14px', fontWeight: 700 }}>Total</span>
                  <span style={{ color: '#CF0A0A', fontSize: '20px', fontWeight: 900 }}>Rs. {subtotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#05966911', border: '1px solid #05966933', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={14} style={{ color: '#059669', flexShrink: 0 }} />
                <div>
                  <p style={{ color: '#059669', fontSize: '11px', fontWeight: 700 }}>Free Delivery Nationwide</p>
                  <p style={{ color: '#EEEEEE44', fontSize: '10px', marginTop: '2px' }}>Estimated: 1-3 business days</p>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px #CF0A0A44' }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/products')}
                style={{ width: '100%', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ShoppingBag size={16} /> Add More Products <ArrowRight size={15} />
              </motion.button>

              <p style={{ color: '#EEEEEE33', fontSize: '11px', textAlign: 'center', marginTop: '10px' }}>
                Click "Order" on any item to place order
              </p>
            </motion.div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #CF0A0A33', padding: '40px 16px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Logo + Tagline */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px', marginBottom: '8px' }}>
              <span style={{ color: '#CF0A0A', fontSize: '26px', fontWeight: 900 }}>M</span>
              <span style={{ color: '#CF0A0A', fontSize: '26px', fontWeight: 900 }}>&</span>
              <span style={{ color: '#B8960C', fontSize: '26px', fontWeight: 900 }}>J</span>
              <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '6px', letterSpacing: '3px', fontWeight: 700 }}>TRADER</span>
            </div>
            <p style={{ color: '#EEEEEE44', fontSize: '12px', letterSpacing: '1px' }}>Pakistan's Premium Electronics Store</p>
          </div>

          {/* Social Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[
              { href: 'https://www.facebook.com/mjtraders1129', label: 'Facebook', hoverColor: '#1877F2', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
              { href: 'https://www.instagram.com/idreesalzeyadi/', label: 'Instagram', hoverColor: '#E1306C', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
              { href: 'https://www.tiktok.com/@m_j_traders?_r=1&_t=ZS-97EdoFx2A4r', label: 'TikTok', hoverColor: '#00f2ea', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> },
              { href: 'https://chat.whatsapp.com/BwtVVtkptoH7N8sH8Z2pV3', label: 'WA Group', hoverColor: '#25D366', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
            ].map((s, i) => (
              <motion.a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                whileHover={{ scale: 1.12, y: -4 }} whileTap={{ scale: 0.95 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textDecoration: 'none', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '12px 18px', minWidth: '74px', color: '#EEEEEE66', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.hoverColor; e.currentTarget.style.backgroundColor = s.hoverColor + '15'; e.currentTarget.style.color = s.hoverColor }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.color = '#EEEEEE66' }}
              >
                {s.svg}
                <span style={{ fontSize: '10px', fontWeight: 700 }}>{s.label}</span>
              </motion.a>
            ))}
          </div>

          {/* Bottom */}
          <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: '#EEEEEE22', fontSize: '11px' }}>© 2026 M&J Trader. All rights reserved.</p>
            <p style={{ color: '#EEEEEE22', fontSize: '11px' }}>Developed by <span style={{ color: '#CF0A0A', fontWeight: 600 }}>Idrees Alzeyadi</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Cart