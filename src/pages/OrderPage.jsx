import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, ShoppingCart, ChevronRight, Shield, Truck, RotateCcw, Zap, Check } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

// ===== EXPANDED COLOR MAP =====
const colorMap = {
  'Black': '#111111', 'Space Black': '#1a1a1a', 'Phantom Black': '#0d0d0d',
  'Graphite': '#4a4a4a', 'Titanium': '#8a8a8a', 'Charcoal': '#333333',
  'Midnight': '#191970', 'Jet Black': '#0a0a0a', 'Matte Black': '#1a1a1a',
  'White': '#f5f5f5', 'Pearl White': '#f8f8ff', 'Silver': '#C0C0C0',
  'Platinum': '#E5E4E2', 'Starlight': '#f2ede4', 'Alpine White': '#f0f0f0',
  'Gold': '#B8960C', 'Rose Gold': '#b76e79', 'Champagne Gold': '#f7e7ce',
  'Yellow': '#FFD700', 'Cream': '#FFFDD0',
  'Blue': '#1d4ed8', 'Sky Blue': '#87ceeb', 'Navy Blue': '#001f5b',
  'Midnight Blue': '#003153', 'Ocean Blue': '#006994', 'Sierra Blue': '#4a90d9',
  'Pacific Blue': '#1ca9c9', 'Alpine Blue': '#4682b4', 'Royal Blue': '#4169e1',
  'Deep Blue': '#00008b', 'Light Blue': '#add8e6',
  'Green': '#22c55e', 'Dark Green': '#166534', 'Sage Green': '#8fbc8f',
  'Midnight Green': '#004953', 'Alpine Green': '#2e5235', 'Forest Green': '#228b22',
  'Mint Green': '#98FF98', 'Olive': '#808000',
  'Deep Purple': '#4B0082', 'Purple': '#7e22ce', 'Lavender': '#967BB6',
  'Violet': '#7F00FF', 'Pink': '#FF69B4', 'Light Pink': '#FFB6C1',
  'Rose': '#FF007F', 'Coral': '#FF7F50',
  'Red': '#CF0A0A', 'Crimson': '#DC143C', 'Burgundy': '#800020',
  'Maroon': '#800000', 'Orange': '#FF6600',
  'Brown': '#8B4513', 'Tan': '#D2B48C', 'Copper': '#b87333',
  'Teal': '#008080', 'Cyan': '#00BCD4',
  'Sand': '#C2B280', 'Desert Titanium': '#c8b8a2', 'Natural Titanium': '#b0a090',
  'Black Titanium': '#2a2a2a', 'White Titanium': '#e8e8e8',
}

function resolveColor(colorName) {
  if (!colorName) return '#555'
  if (colorMap[colorName]) return colorMap[colorName]
  return colorName.toLowerCase()
}

function needsDarkBorder(hex) {
  if (!hex || !hex.startsWith('#')) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7
}

const specsConfig = {
  Mobiles: [
    { key: 'ram', label: 'RAM', suffix: 'GB', icon: '💾' },
    { key: 'storage', label: 'Storage', suffix: 'GB', icon: '💿' },
    { key: 'displaySize', label: 'Display', suffix: '', icon: '📱' },
    { key: 'camera', label: 'Camera', suffix: '', icon: '📷' },
    { key: 'battery', label: 'Battery', suffix: 'mAh', icon: '🔋' },
    { key: 'processor', label: 'Processor', suffix: '', icon: '⚡' },
  ],
  Laptops: [
    { key: 'ram', label: 'RAM', suffix: 'GB', icon: '💾' },
    { key: 'storage', label: 'Storage', suffix: '', icon: '💿' },
    { key: 'processor', label: 'Processor', suffix: '', icon: '⚡' },
    { key: 'displaySize', label: 'Display', suffix: '', icon: '🖥️' },
    { key: 'graphics', label: 'Graphics', suffix: '', icon: '🎮' },
  ],
  'TVs & Monitors': [
    { key: 'screenSize', label: 'Screen Size', suffix: '', icon: '📺' },
    { key: 'resolution', label: 'Resolution', suffix: '', icon: '🔍' },
    { key: 'smartTv', label: 'Smart TV', suffix: '', icon: '🌐' },
    { key: 'hdr', label: 'HDR', suffix: '', icon: '✨' },
    { key: 'refreshRate', label: 'Refresh Rate', suffix: '', icon: '⚡' },
  ],
  'Fridges & Freezers': [
    { key: 'capacity', label: 'Capacity', suffix: 'L', icon: '❄️' },
    { key: 'fridgeType', label: 'Type', suffix: '', icon: '🏠' },
    { key: 'energyRating', label: 'Energy Rating', suffix: '', icon: '⭐' },
    { key: 'compressor', label: 'Compressor', suffix: '', icon: '🔧' },
  ],
  ACs: [
    { key: 'tonCapacity', label: 'Capacity', suffix: 'Ton', icon: '❄️' },
    { key: 'inverter', label: 'Inverter', suffix: '', icon: '⚡' },
    { key: 'starRating', label: 'Star Rating', suffix: '', icon: '⭐' },
    { key: 'coolingCapacity', label: 'Cooling', suffix: '', icon: '🌀' },
  ],
}

const trustBadges = [
  { icon: <Shield size={16} />, label: '100% Original', color: '#22c55e' },
  { icon: <Truck size={16} />, label: '1-3 Day Delivery', color: '#3b82f6' },
  { icon: <RotateCcw size={16} />, label: 'Easy Returns', color: '#B8960C' },
  { icon: <Zap size={16} />, label: 'Best Price', color: '#CF0A0A' },
]

function OrderPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [product, setProduct] = useState(state?.product || null)
  const [loading, setLoading] = useState(!state?.product)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedRam, setSelectedRam] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!product && id) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, 'products', id)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() }
            setProduct(data)
            initSelections(data)
          }
        } catch (error) {
          console.error('Error fetching product:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchProduct()
    } else {
      setLoading(false)
      if (product) initSelections(product)
    }
  }, [id])

  const initSelections = (data) => {
    const colorOpts = Array.isArray(data.colors) ? data.colors : (data.colors ? [data.colors] : [])
    setSelectedColor(colorOpts[0] || '')
    const ramOpts = data.ramOptions || (data.ram ? [data.ram] : [])
    setSelectedRam(ramOpts[0] || data.ram || '')
    const storageOpts = data.storageOptions || (data.storage ? [data.storage] : [])
    setSelectedStorage(storageOpts[0] || data.storage || '')
  }

  const getCurrentPrice = () => {
    if (product?.variants?.length > 0) {
      const variant = product.variants.find(v => v.ram === selectedRam && v.storage === selectedStorage)
      return variant ? Number(variant.price) : Number(product.price || product.sellPrice || 0)
    }
    return Number(product?.price || product?.sellPrice || 0)
  }

  const handleProceedToCheckout = () => {
    navigate('/checkout', {
      state: { product, selectedColor, selectedRam, selectedStorage, quantity, totalPrice: getCurrentPrice() * quantity }
    })
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '44px', height: '44px', border: '3px solid #CF0A0A', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#EEEEEE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ fontSize: '40px' }}>😕</p>
        <p style={{ color: '#EEEEEE55' }}>Product not found</p>
        <button onClick={() => navigate('/products')} style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>
          Browse Products
        </button>
      </div>
    )
  }

  const currentPrice = getCurrentPrice()
  const oldPrice = Number(product.oldPrice || 0)
  const discountPct = oldPrice > currentPrice ? Math.round((1 - currentPrice / oldPrice) * 100) : 0
  const productSpecs = specsConfig[product.category] || []
  const ramOptions = product.ramOptions || (product.ram ? [product.ram] : [])
  const storageOptions = product.storageOptions || (product.storage ? [product.storage] : [])
  const validColors = Array.isArray(product.colors) ? product.colors : (product.colors ? [product.colors] : [])

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', fontFamily: 'sans-serif' }}>

      {/* ===== NAVBAR ===== */}
      <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.div whileHover={{ scale: 1.05 }} onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '1px' }}>
          <motion.span style={{ color: '#CF0A0A', fontSize: '24px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #CF0A0A', '0 0 25px #CF0A0A', '0 0 10px #CF0A0A'] }} transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
          <span style={{ color: '#CF0A0A', fontSize: '24px', fontWeight: 900 }}>&</span>
          <motion.span style={{ color: '#B8960C', fontSize: '24px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #B8960C', '0 0 25px #B8960C', '0 0 10px #B8960C'] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
          <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '6px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
        </motion.div>
        <motion.button whileHover={{ x: -3 }} onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#EEEEEE', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <ArrowLeft size={15} /> Back
        </motion.button>
      </motion.nav>

      {/* ===== BREADCRUMB ===== */}
      <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#EEEEEE44', maxWidth: '1200px', margin: '0 auto' }}>
        <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#CF0A0A' }}>Home</span>
        <ChevronRight size={12} />
        <span onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>Products</span>
        <ChevronRight size={12} />
        <span style={{ color: '#EEEEEE88' }}>{product.category}</span>
        <ChevronRight size={12} />
        <span style={{ color: '#EEEEEE', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{product.name}</span>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>

        {/* ===== LEFT — IMAGE + INFO ===== */}
        <div>
          {/* Product Image Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '24px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>

            {/* Badge */}
            {product.badge && (
              <div style={{
                position: 'absolute', top: '16px', left: '16px', zIndex: 3,
                backgroundColor: product.badge === 'PTA' ? '#22c55e' : product.badge === 'Non-PTA' ? '#CF0A0A' : product.badge === 'CPID' ? '#f59e0b' : '#CF0A0A',
                color: 'white', fontSize: '11px', fontWeight: 800, padding: '5px 14px', borderRadius: '50px', letterSpacing: '1px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}>
                {product.badge}
              </div>
            )}

            {/* Discount badge */}
            {discountPct > 0 && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 3, backgroundColor: '#DC5F00', color: 'white', fontSize: '12px', fontWeight: 800, padding: '5px 12px', borderRadius: '50px' }}>
                -{discountPct}% OFF
              </div>
            )}

            {/* Main image */}
            <div style={{ height: '340px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, #CF0A0A22 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              {product.imageUrl ? (
                <motion.img src={product.imageUrl} alt={product.name}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '24px', position: 'relative', zIndex: 1 }} />
              ) : (
                <motion.span animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: '100px', position: 'relative', zIndex: 1 }}>{product.img || '📦'}</motion.span>
              )}
            </div>

            {/* Trust badges strip */}
            <div style={{ backgroundColor: '#0d0d0d', borderTop: '1px solid #222', padding: '14px 20px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '8px' }}>
              {trustBadges.map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: b.color }}>
                  {b.icon}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#EEEEEE88' }}>{b.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Product Info Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '20px', padding: '24px' }}>

            {/* Category pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#CF0A0A15', border: '1px solid #CF0A0A44', color: '#CF0A0A', padding: '5px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', marginBottom: '12px' }}>
              {product.category === 'Mobiles' ? '📱' : product.category === 'Laptops' ? '💻' : product.category?.includes('TV') ? '📺' : product.category?.includes('Fridge') ? '❄️' : product.category === 'ACs' ? '🌀' : '📦'}
              {' '}{product.category}
            </div>

            <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, marginBottom: '10px', lineHeight: 1.2 }}>{product.name}</h1>

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} fill={j < Math.floor(product.rating || 5) ? '#B8960C' : 'none'} style={{ color: '#B8960C' }} />
                ))}
              </div>
              <span style={{ color: '#B8960C', fontSize: '13px', fontWeight: 700 }}>{product.rating || 5}.0</span>
              <span style={{ color: '#EEEEEE33', fontSize: '13px' }}>({product.reviews || 0} reviews)</span>
            </div>

            {product.description && (
              <p style={{ color: '#EEEEEE66', fontSize: '13px', lineHeight: 1.7, marginBottom: '0' }}>{product.description}</p>
            )}
          </motion.div>

          {/* Specs Card */}
          {productSpecs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '20px', padding: '24px', marginTop: '16px' }}>
              <p style={{ color: '#CF0A0A', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>⚙️ Specifications</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {productSpecs.map((spec) => {
                  const value = product[spec.key]
                  if (!value) return null
                  return (
                    <div key={spec.key} style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', padding: '12px 14px', borderRadius: '12px' }}>
                      <p style={{ color: '#EEEEEE33', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{spec.icon} {spec.label}</p>
                      <p style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700 }}>{value}{spec.suffix && ` ${spec.suffix}`}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* ===== RIGHT — CONFIGURATOR + ORDER ===== */}
        <div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ backgroundColor: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '24px', padding: '28px', position: 'sticky', top: '80px' }}>

            {/* Price Section */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '6px' }}>
                <motion.p key={currentPrice} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900, color: '#CF0A0A', lineHeight: 1 }}>
                  Rs. {currentPrice.toLocaleString()}
                </motion.p>
                {oldPrice > currentPrice && (
                  <p style={{ color: '#EEEEEE33', fontSize: '16px', textDecoration: 'line-through', marginBottom: '4px' }}>
                    Rs. {oldPrice.toLocaleString()}
                  </p>
                )}
              </div>
              {oldPrice > currentPrice && (
                <span style={{ backgroundColor: '#DC5F022', border: '1px solid #DC5F0055', color: '#DC5F00', fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '50px' }}>
                  🔥 You save Rs. {(oldPrice - currentPrice).toLocaleString()} ({discountPct}% OFF)
                </span>
              )}
            </div>

            {/* RAM Selection */}
            {ramOptions.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#EEEEEE55', marginBottom: '10px', fontWeight: 700, letterSpacing: '1px' }}>💾 SELECT RAM</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ramOptions.map((ram) => (
                    <motion.button key={ram} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedRam(ram)} type="button"
                      style={{
                        backgroundColor: selectedRam === ram ? '#CF0A0A' : '#1a1a1a',
                        color: selectedRam === ram ? 'white' : '#EEEEEE88',
                        border: selectedRam === ram ? '2px solid #CF0A0A' : '2px solid #2a2a2a',
                        padding: '9px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: selectedRam === ram ? '0 0 16px #CF0A0A44' : 'none',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                      {selectedRam === ram && <Check size={12} />}
                      {ram} GB
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage Selection */}
            {storageOptions.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#EEEEEE55', marginBottom: '10px', fontWeight: 700, letterSpacing: '1px' }}>💿 SELECT STORAGE</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {storageOptions.map((st) => (
                    <motion.button key={st} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedStorage(st)} type="button"
                      style={{
                        backgroundColor: selectedStorage === st ? '#CF0A0A' : '#1a1a1a',
                        color: selectedStorage === st ? 'white' : '#EEEEEE88',
                        border: selectedStorage === st ? '2px solid #CF0A0A' : '2px solid #2a2a2a',
                        padding: '9px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: selectedStorage === st ? '0 0 16px #CF0A0A44' : 'none',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                      {selectedStorage === st && <Check size={12} />}
                      {st} GB
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {validColors.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: '#EEEEEE55', marginBottom: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                  🎨 SELECT COLOR — <span style={{ color: '#EEEEEE', fontWeight: 800 }}>{selectedColor}</span>
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {validColors.map((color) => {
                    const hex = resolveColor(color)
                    const isLight = needsDarkBorder(hex)
                    const isSelected = selectedColor === color
                    return (
                      <motion.button key={color} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedColor(color)} type="button" title={color}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          backgroundColor: hex,
                          border: isSelected ? '3px solid #CF0A0A' : isLight ? '2px solid #555' : '2px solid #3a3a3a',
                          cursor: 'pointer',
                          boxShadow: isSelected ? `0 0 14px #CF0A0A88, 0 0 0 2px #CF0A0A22` : `0 2px 8px ${hex}66`,
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}>
                        {isSelected && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={14} color={isLight ? '#333' : 'white'} strokeWidth={3} />
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: '#EEEEEE55', marginBottom: '10px', fontWeight: 700, letterSpacing: '1px' }}>📦 QUANTITY</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0', backgroundColor: '#1a1a1a', border: '2px solid #2a2a2a', borderRadius: '14px', overflow: 'hidden', width: 'fit-content' }}>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => quantity > 1 && setQuantity(q => q - 1)} type="button"
                  style={{ padding: '12px 20px', border: 'none', background: 'none', color: quantity > 1 ? '#CF0A0A' : '#444', cursor: quantity > 1 ? 'pointer' : 'not-allowed', fontWeight: 900, fontSize: '18px', lineHeight: 1 }}>
                  −
                </motion.button>
                <span style={{ padding: '12px 20px', fontSize: '16px', fontWeight: 800, borderLeft: '1px solid #2a2a2a', borderRight: '1px solid #2a2a2a', minWidth: '50px', textAlign: 'center' }}>{quantity}</span>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQuantity(q => q + 1)} type="button"
                  style={{ padding: '12px 20px', border: 'none', background: 'none', color: '#CF0A0A', cursor: 'pointer', fontWeight: 900, fontSize: '18px', lineHeight: 1 }}>
                  +
                </motion.button>
              </div>
            </div>

            {/* Total */}
            <div style={{ backgroundColor: '#CF0A0A0d', border: '1px solid #CF0A0A22', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#EEEEEE55', fontSize: '12px', marginBottom: '2px' }}>Total Amount</p>
                <p style={{ color: '#EEEEEE44', fontSize: '11px' }}>{quantity} × Rs. {currentPrice.toLocaleString()}</p>
              </div>
              <motion.p key={currentPrice * quantity} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                style={{ color: '#CF0A0A', fontSize: '28px', fontWeight: 900 }}>
                Rs. {(currentPrice * quantity).toLocaleString()}
              </motion.p>
            </div>

            {/* CTA Button */}
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 40px #CF0A0A66' }} whileTap={{ scale: 0.97 }}
              onClick={handleProceedToCheckout}
              style={{ width: '100%', background: 'linear-gradient(135deg, #CF0A0A 0%, #dc1414 100%)', color: 'white', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 24px #CF0A0A44', letterSpacing: '0.5px' }}>
              <ShoppingCart size={20} /> Proceed to Checkout <ChevronRight size={20} />
            </motion.button>

            <p style={{ color: '#EEEEEE33', fontSize: '11px', textAlign: 'center', marginTop: '12px' }}>
              🔒 Secure checkout — delivery details on next step
            </p>

            {/* Mini trust row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
              {trustBadges.map((b, i) => (
                <div key={i} style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: b.color }}>{b.icon}</span>
                  <span style={{ color: '#EEEEEE66', fontSize: '11px', fontWeight: 600 }}>{b.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default OrderPage