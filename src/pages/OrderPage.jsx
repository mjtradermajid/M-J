import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, ShoppingCart, ChevronRight } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const colorMap = {
  'Space Black': '#1a1a1a', 'Silver': '#C0C0C0', 'Gold': '#B8960C',
  'Deep Purple': '#4B0082', 'Phantom Black': '#0a0a0a', 'White': '#EEEEEE',
  'Green': '#166534', 'Burgundy': '#800020', 'Black': '#111111', 'Blue': '#1d4ed8',
}

// Specs display config
const specsConfig = {
  Mobiles: [
    { key: 'ram', label: 'RAM', suffix: 'GB' },
    { key: 'storage', label: 'Storage', suffix: 'GB' },
    { key: 'displaySize', label: 'Display', suffix: '' },
    { key: 'camera', label: 'Camera', suffix: '' },
    { key: 'battery', label: 'Battery', suffix: 'mAh' },
    { key: 'processor', label: 'Processor', suffix: '' },
  ],
  Laptops: [
    { key: 'ram', label: 'RAM', suffix: 'GB' },
    { key: 'storage', label: 'Storage', suffix: '' },
    { key: 'processor', label: 'Processor', suffix: '' },
    { key: 'displaySize', label: 'Display', suffix: '' },
    { key: 'graphics', label: 'Graphics', suffix: '' },
  ],
  TVs: [
    { key: 'screenSize', label: 'Screen Size', suffix: '' },
    { key: 'resolution', label: 'Resolution', suffix: '' },
    { key: 'smartTv', label: 'Smart TV', suffix: '' },
    { key: 'hdr', label: 'HDR', suffix: '' },
    { key: 'refreshRate', label: 'Refresh Rate', suffix: '' },
  ],
  Fridges: [
    { key: 'capacity', label: 'Capacity', suffix: 'L' },
    { key: 'fridgeType', label: 'Type', suffix: '' },
    { key: 'energyRating', label: 'Energy Rating', suffix: '' },
    { key: 'compressor', label: 'Compressor', suffix: '' },
  ],
  ACs: [
    { key: 'tonCapacity', label: 'Capacity', suffix: 'Ton' },
    { key: 'inverter', label: 'Inverter', suffix: '' },
    { key: 'starRating', label: 'Star Rating', suffix: '' },
    { key: 'coolingCapacity', label: 'Cooling', suffix: '' },
  ],
  Accessories: [
    { key: 'accessoryType', label: 'Type', suffix: '' },
    { key: 'compatibility', label: 'Compatibility', suffix: '' },
  ],
}

function OrderPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [product, setProduct] = useState(state?.product || null)
  const [loading, setLoading] = useState(!state?.product)

  // Configuration States — ONLY product selection
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedRam, setSelectedRam] = useState('')
  const [selectedStorage, setSelectedStorage] = useState('')

  // Firestore se fetch agar state mein nahi hai
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
      if (product) {
        initSelections(product)
      }
    }
  }, [id, product])

  const initSelections = (data) => {
    // Safe handling for colors array
    const colorOpts = data.colors && Array.isArray(data.colors) ? data.colors : (data.colors ? [data.colors] : [])
    setSelectedColor(colorOpts[0] || '')
    
    const ramOpts = data.ramOptions || (data.ram ? [data.ram] : [])
    setSelectedRam(ramOpts[0] || data.ram || '')
    const storageOpts = data.storageOptions || (data.storage ? [data.storage] : [])
    setSelectedStorage(storageOpts[0] || data.storage || '')
  }

  // ✅ PROCEED TO CHECKOUT — Navigate to CheckoutPage with selections
  const handleProceedToCheckout = () => {
    navigate('/checkout', {
      state: {
        product,
        selectedColor,
        selectedRam,
        selectedStorage,
        quantity,
        totalPrice: getCurrentPrice() * quantity
      }
    })
  }

  const getCurrentPrice = () => {
    if (product?.variants?.length > 0) {
      const variant = product.variants.find(v => v.ram === selectedRam && v.storage === selectedStorage)
      return variant ? Number(variant.price) : Number(product.price || product.sellPrice || 0)
    }
    return Number(product?.price || product?.sellPrice || 0)
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '40px', height: '40px', border: '3px solid #CF0A0A', borderTopColor: 'transparent', borderRadius: '50%' }}
        />
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: '#EEEEEE55' }}>Product not found or no longer available.</p>
        <button onClick={() => navigate('/products')} style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
          Go to Products
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
  
  // Safe validation for colors looping
  const validColors = product.colors && Array.isArray(product.colors) ? product.colors : (product.colors ? [product.colors] : [])

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', padding: '40px 24px', fontFamily: 'sans-serif' }}>
      
      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, marginBottom: '30px' }}>
        <motion.div whileHover={{ scale: 1.05 }} style={{ fontSize: '24px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '1px' }} onClick={() => navigate('/')}>
          <span style={{ color: '#CF0A0A' }}>M</span><span style={{ color: '#CF0A0A' }}>&</span>
          <span style={{ color: '#B8960C' }}>J</span>
          <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '5px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
        </motion.div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
        
        {/* LEFT: Product Summary */}
        <div style={{ backgroundColor: '#111111', border: '1px solid #222222', padding: '28px', borderRadius: '20px', height: 'fit-content' }}>
          
          <span style={{ fontSize: '11px', color: '#CF0A0A', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>
              {product.category === 'Mobiles' ? '📱' : 
               product.category === 'Laptops' ? '💻' :
               product.category === 'TVs' ? '📺' :
               product.category === 'Fridges' ? '❄️' :
               product.category === 'ACs' ? '🌀' :
               product.category === 'Accessories' ? '🔌' : '📦'}
            </span>
            {product.category}
          </span>

          <h2 style={{ fontSize: '26px', fontWeight: 900, marginTop: '4px', marginBottom: '16px' }}>{product.name}</h2>
          
          <div style={{ height: '220px', backgroundColor: '#1a1a1a', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '20px' }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '80px' }}>{product.img || '📦'}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            {[...Array(5)].map((_, j) => (
              <Star key={j} size={14} fill={j < Math.floor(product.rating || 5) ? '#B8960C' : 'none'} style={{ color: '#B8960C' }} />
            ))}
            <span style={{ color: '#EEEEEE55', fontSize: '12px', marginLeft: '4px' }}>({product.reviews || 0} reviews)</span>
          </div>

          <p style={{ color: '#EEEEEE66', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>{product.description}</p>

          {/* Specifications */}
          {productSpecs.length > 0 && (
            <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #333333', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <p style={{ color: '#CF0A0A', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', marginBottom: '12px', textTransform: 'uppercase' }}>
                ⚙️ Specifications
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {productSpecs.map((spec) => {
                  const value = product[spec.key]
                  if (!value) return null
                  return (
                    <div key={spec.key} style={{ backgroundColor: '#111111', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ color: '#EEEEEE44', fontSize: '10px', marginBottom: '3px', textTransform: 'uppercase' }}>{spec.label}</p>
                      <p style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700 }}>
                        {value}{spec.suffix && ` ${spec.suffix}`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* RAM Selection */}
          {ramOptions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#EEEEEE55', marginBottom: '10px', fontWeight: 600 }}>
                <span style={{ color: '#CF0A0A' }}>●</span> SELECT RAM:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ramOptions.map((ram) => (
                  <button key={ram} type="button" onClick={() => setSelectedRam(ram)}
                    style={{ backgroundColor: selectedRam === ram ? '#CF0A0A' : '#1e1e1e', color: 'white', border: selectedRam === ram ? '2px solid #CF0A0A' : '2px solid #333', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedRam === ram ? '0 0 15px #CF0A0A44' : 'none' }}>
                    {ram} GB
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Storage Selection */}
          {storageOptions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#EEEEEE55', marginBottom: '10px', fontWeight: 600 }}>
                <span style={{ color: '#CF0A0A' }}>●</span> SELECT STORAGE:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {storageOptions.map((st) => (
                  <button key={st} type="button" onClick={() => setSelectedStorage(st)}
                    style={{ backgroundColor: selectedStorage === st ? '#CF0A0A' : '#1e1e1e', color: 'white', border: selectedStorage === st ? '2px solid #CF0A0A' : '2px solid #333', padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedStorage === st ? '0 0 15px #CF0A0A44' : 'none' }}>
                    {st} GB
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {validColors.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: '#EEEEEE55', marginBottom: '10px', fontWeight: 600 }}>
                <span style={{ color: '#CF0A0A' }}>●</span> SELECT COLOR:
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {validColors.map((c) => (
                  <button key={c} type="button" onClick={() => setSelectedColor(c)}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: colorMap[c] || '#555', border: selectedColor === c ? '3px solid #CF0A0A' : '2px solid transparent', cursor: 'pointer', transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.2s', boxShadow: selectedColor === c ? '0 0 10px #CF0A0A66' : 'none' }} title={c} />
                ))}
              </div>
              <p style={{ color: '#EEEEEE55', fontSize: '11px', marginTop: '8px' }}>Selected: <span style={{ color: '#EEEEEE', fontWeight: 600 }}>{selectedColor || 'None'}</span></p>
            </div>
          )}

          {/* Price & Quantity */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #222222' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#EEEEEE55' }}>UNIT PRICE</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#CF0A0A' }}>Rs. {currentPrice.toLocaleString()}</p>
                {oldPrice > currentPrice && (
                  <>
                    <p style={{ color: '#EEEEEE33', fontSize: '14px', textDecoration: 'line-through' }}>Rs. {oldPrice.toLocaleString()}</p>
                    <span style={{ backgroundColor: '#DC5F0022', color: '#DC5F00', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>-{discountPct}%</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
              <button type="button" onClick={() => quantity > 1 && setQuantity(q => q - 1)} style={{ padding: '10px 16px', border: 'none', background: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}>-</button>
              <span style={{ padding: '0 12px', fontSize: '15px', fontWeight: 800 }}>{quantity}</span>
              <button type="button" onClick={() => setQuantity(q => q + 1)} style={{ padding: '10px 16px', border: 'none', background: 'none', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}>+</button>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#CF0A0A11', border: '1px solid #CF0A0A33', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#EEEEEE88' }}>Total ({quantity} item{quantity > 1 ? 's' : ''}):</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#CF0A0A' }}>Rs. {(currentPrice * quantity).toLocaleString()}</span>
          </div>
        </div>

        {/* RIGHT: Order Summary & Proceed Button */}
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222222', padding: '32px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
          
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '6px' }}>Order Summary</h3>
            <p style={{ color: '#EEEEEE44', fontSize: '13px' }}>Review your selected options</p>
          </div>

          {/* Selected Options Summary */}
          <div style={{ backgroundColor: '#111111', border: '1px solid #333333', padding: '20px', borderRadius: '12px' }}>
            <p style={{ color: '#EEEEEE44', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '16px' }}>SELECTED OPTIONS</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '60px', height: '60px', backgroundColor: '#1a1a1a', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{product.img || '📦'}</span>
                )}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{product.name}</p>
                <p style={{ color: '#EEEEEE55', fontSize: '12px' }}>{product.category}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedRam && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
                  <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>RAM</span>
                  <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700 }}>{selectedRam} GB</span>
                </div>
              )}
              {selectedStorage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
                  <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Storage</span>
                  <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700 }}>{selectedStorage} GB</span>
                </div>
              )}
              {selectedColor && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
                  <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Color</span>
                  <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700 }}>{selectedColor}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
                <span style={{ color: '#EEEEEE55', fontSize: '12px' }}>Quantity</span>
                <span style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700 }}>{quantity}</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#EEEEEE55', fontSize: '13px' }}>Unit Price</span>
              <span style={{ color: '#EEEEEE', fontSize: '14px' }}>Rs. {currentPrice.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#EEEEEE55', fontSize: '13px' }}>Quantity</span>
              <span style={{ color: '#EEEEEE', fontSize: '14px' }}>× {quantity}</span>
            </div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#EEEEEE88', fontSize: '15px', fontWeight: 700 }}>Total Amount</span>
              <span style={{ color: '#CF0A0A', fontSize: '24px', fontWeight: 900 }}>Rs. {(currentPrice * quantity).toLocaleString()}</span>
            </div>
          </div>

          {/* ✅ PROCEED TO CHECKOUT BUTTON */}
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px #CF0A0A55' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleProceedToCheckout}
            style={{ width: '100%', backgroundColor: '#CF0A0A', color: 'white', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <ShoppingCart size={20} /> Proceed to Checkout <ChevronRight size={20} />
          </motion.button>

          <p style={{ color: '#EEEEEE44', fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
            You will enter your delivery details on the next step
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderPage