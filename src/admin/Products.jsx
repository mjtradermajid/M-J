import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { Plus, X, Edit2, Trash2, Search, Package, TrendingUp, Loader2 } from 'lucide-react'
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'

const categories = ['All',
  'Mobiles',
  'Laptops',
  'Tablets',
  'Smart Watches',
  'TVs & Monitors',
  'ACs',
  'Fridges & Freezers',
  'Washing Machines',
  'Microwaves & Ovens',
  'Water Dispensers',
  'Air Coolers',
  'Cameras & Drones',
  'Audio & Speakers',
  'Gaming Consoles',
  'Computer Accessories',
  'Mobile Accessories',
  'Home Appliances',
  'Kitchen Appliances',
  'Power Banks & Chargers']
const badges = ['', 'PTA APPROVED', 'Non-PTA', 'CPID']
const badgeColors = { PTA: '#22c55e', 'Non-PTA': '#CF0A0A', CPID: '#f59e0b' }

function getCategoryIcon(cat) {
  const icons = { Mobiles: '📱', Fridges: '❄️', ACs: '🌀', Laptops: '💻', TVs: '📺', Accessories: '🔌' }
  return icons[cat] || '📦'
}

const categorySpecs = {
  Mobiles: {
    fields: [
      { key: 'ramOptions', label: 'RAM Options (comma separated)', placeholder: 'e.g. 8, 12, 16', type: 'text', isArray: true },
      { key: 'storageOptions', label: 'Storage Options (comma separated)', placeholder: 'e.g. 128, 256, 512', type: 'text', isArray: true },
      { key: 'displaySize', label: 'Display Size', placeholder: 'e.g. 6.7"', type: 'text' },
      { key: 'camera', label: 'Camera', placeholder: 'e.g. 48MP + 12MP + 12MP', type: 'text' },
      { key: 'battery', label: 'Battery (mAh)', placeholder: 'e.g. 4500', type: 'text' },
      { key: 'processor', label: 'Processor', placeholder: 'e.g. Snapdragon 8 Gen 2', type: 'text' },
    ]
  },
  Laptops: {
    fields: [
      { key: 'ramOptions', label: 'RAM Options (comma separated)', placeholder: 'e.g. 8, 16, 32', type: 'text', isArray: true },
      { key: 'storageOptions', label: 'Storage Options (comma separated)', placeholder: 'e.g. 512GB SSD, 1TB SSD', type: 'text', isArray: true },
      { key: 'processor', label: 'Processor', placeholder: 'e.g. Intel i7-13700H', type: 'text' },
      { key: 'displaySize', label: 'Display Size', placeholder: 'e.g. 15.6"', type: 'text' },
      { key: 'graphics', label: 'Graphics Card', placeholder: 'e.g. RTX 4060', type: 'text' },
    ]
  },
  TVs: {
    fields: [
      { key: 'screenSize', label: 'Screen Size', placeholder: 'e.g. 55"', type: 'text' },
      { key: 'resolution', label: 'Resolution', placeholder: 'e.g. 4K UHD', type: 'text' },
      { key: 'smartTv', label: 'Smart TV', placeholder: 'e.g. Android TV, Tizen', type: 'text' },
      { key: 'hdr', label: 'HDR Support', placeholder: 'e.g. HDR10+, Dolby Vision', type: 'text' },
      { key: 'refreshRate', label: 'Refresh Rate', placeholder: 'e.g. 120Hz', type: 'text' },
    ]
  },
  Fridges: {
    fields: [
      { key: 'capacity', label: 'Capacity (Liters)', placeholder: 'e.g. 350', type: 'text' },
      { key: 'fridgeType', label: 'Type', placeholder: 'e.g. Double Door, Side by Side', type: 'text' },
      { key: 'energyRating', label: 'Energy Rating', placeholder: 'e.g. 5 Star', type: 'text' },
      { key: 'compressor', label: 'Compressor Type', placeholder: 'e.g. Inverter', type: 'text' },
    ]
  },
  ACs: {
    fields: [
      { key: 'tonCapacity', label: 'Ton Capacity', placeholder: 'e.g. 1.5 Ton', type: 'text' },
      { key: 'inverter', label: 'Inverter', placeholder: 'e.g. Yes, 5-in-1', type: 'text' },
      { key: 'starRating', label: 'Star Rating', placeholder: 'e.g. 5 Star', type: 'text' },
      { key: 'coolingCapacity', label: 'Cooling Capacity', placeholder: 'e.g. 5200W', type: 'text' },
    ]
  },
  Accessories: {
    fields: [
      { key: 'accessoryType', label: 'Accessory Type', placeholder: 'e.g. Charger, Case, Cable', type: 'text' },
      { key: 'compatibility', label: 'Compatibility', placeholder: 'e.g. iPhone 14, Universal', type: 'text' },
    ]
  }
}

function ProductModal({ product, onClose, onSave, saving }) {
  const [profitType, setProfitType] = useState(product?.profitType || 'amount')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(product?.imageUrl || null)

  const getInitialSpecs = () => {
    const specs = {}
    const cat = product?.category || 'Mobiles'
    const fields = categorySpecs[cat]?.fields || []
    fields.forEach(f => {
      if (f.isArray && product?.[f.key]) {
        specs[f.key] = Array.isArray(product[f.key]) ? product[f.key].join(', ') : product[f.key]
      } else {
        specs[f.key] = product?.[f.key] || ''
      }
    })
    return specs
  }

  const [specs, setSpecs] = useState(getInitialSpecs())

  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || 'Mobiles',
    buyPrice: product?.buyPrice || '',
    profitAmount: product?.profitAmount || '',
    profitPct: product?.profitPct || '',
    oldPrice: product?.oldPrice || '',
    discount: product?.discount || 0,
    stock: product?.stock || '',
    badge: product?.badge || '',
    description: product?.description || '',
    status: product?.status || 'Active',
    colors: product?.colors || [],
    rating: product?.rating || 5,
    reviews: product?.reviews || 0,
  })

  useEffect(() => {
    const fields = categorySpecs[form.category]?.fields || []
    const newSpecs = {}
    fields.forEach(f => {
      if (product?.category === form.category && product?.[f.key]) {
        if (f.isArray && Array.isArray(product[f.key])) {
          newSpecs[f.key] = product[f.key].join(', ')
        } else {
          newSpecs[f.key] = product[f.key]
        }
      } else {
        newSpecs[f.key] = ''
      }
    })
    setSpecs(newSpecs)
    if (form.category !== 'Mobiles') {
      setForm(p => ({ ...p, badge: '' }))
    }
  }, [form.category])

  const buyPrice = Number(form.buyPrice) || 0

  const sellPrice =
    profitType === 'amount'
      ? buyPrice + (Number(form.profitAmount) || 0)
      : Math.round(buyPrice * (1 + (Number(form.profitPct) || 0) / 100))

  const profitAmount =
    profitType === 'amount'
      ? Number(form.profitAmount) || 0
      : Math.round(buyPrice * (Number(form.profitPct) || 0) / 100)

  const profitPct =
    profitType === 'pct'
      ? Number(form.profitPct) || 0
      : buyPrice > 0
      ? Math.round((profitAmount / buyPrice) * 100)
      : 0

  const discountedPrice =
    form.discount > 0 ? Math.round(sellPrice * (1 - Number(form.discount) / 100)) : sellPrice

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.buyPrice) return

    let imageUrl = product?.imageUrl || ''

    if (imageFile) {
      try {
        const formData = new FormData()
        formData.append('image', imageFile)
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.success) {
          imageUrl = data.data.url
        }
      } catch (err) {
        console.error('Image upload error:', err)
      }
    }

    const cleanSpecs = {}
    const fields = categorySpecs[form.category]?.fields || []

    fields.forEach(f => {
      const value = specs[f.key]
      if (!value || !value.trim()) return
      if (f.isArray) {
        cleanSpecs[f.key] = value.split(',').map(s => s.trim()).filter(Boolean)
        if (f.key === 'ramOptions') cleanSpecs.ram = cleanSpecs[f.key][0] || ''
        if (f.key === 'storageOptions') cleanSpecs.storage = cleanSpecs[f.key][0] || ''
      } else {
        cleanSpecs[f.key] = value.trim()
      }
    })

    onSave({
      ...(product?.firestoreId ? { firestoreId: product.firestoreId } : {}),
      ...form,
      ...cleanSpecs,
      buyPrice,
      profitAmount,
      profitPct,
      profitType,
      sellPrice,
      price: sellPrice,
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      discount: Number(form.discount) || 0,
      stock: Number(form.stock),
      img: getCategoryIcon(form.category),
      imageUrl,
    })
  }

  const inputStyle = (borderColor = '#333') => ({
    width: '100%',
    backgroundColor: '#111',
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#EEEEEE',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  })

  const currentSpecs = categorySpecs[form.category]?.fields || []

  const getArrayPreview = (key) => {
    const value = specs[key]
    if (!value) return []
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '20px' }}>
            {product?.firestoreId ? 'Edit' : 'Add'}{' '}<span style={{ color: '#CF0A0A' }}>Product</span>
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
            style={{ backgroundColor: '#CF0A0A22', border: 'none', color: '#CF0A0A', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X size={18} />
          </motion.button>
        </div>

        {/* Live Preview */}
        <div style={{ backgroundColor: '#111', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px solid #CF0A0A22' }}>
          <p style={{ color: '#EEEEEE33', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>LIVE PREVIEW</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', backgroundColor: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
              {imagePreview ? <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getCategoryIcon(form.category)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px' }}>{form.name || 'Product Name'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {form.discount > 0 ? (
                  <>
                    <span style={{ color: '#EEEEEE33', fontSize: '12px', textDecoration: 'line-through' }}>Rs. {sellPrice.toLocaleString()}</span>
                    <span style={{ color: '#CF0A0A', fontWeight: 900, fontSize: '15px' }}>Rs. {discountedPrice.toLocaleString()}</span>
                    <span style={{ backgroundColor: '#DC5F0022', color: '#DC5F00', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>-{form.discount}% OFF</span>
                  </>
                ) : (
                  <span style={{ color: '#CF0A0A', fontWeight: 900, fontSize: '15px' }}>Rs. {sellPrice.toLocaleString()}</span>
                )}
                {form.badge && (
                  <span style={{ backgroundColor: badgeColors[form.badge] + '33', color: badgeColors[form.badge], fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>{form.badge}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profit Summary */}
        {buyPrice > 0 && profitAmount > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ backgroundColor: '#22c55e11', border: '1px solid #22c55e33', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ color: '#22c55e', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>💰 PROFIT CALCULATION</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { label: 'Buy Price', value: `Rs. ${buyPrice.toLocaleString()}`, color: '#EEEEEE' },
                { label: 'Profit', value: `Rs. ${profitAmount.toLocaleString()} (${profitPct}%)`, color: '#22c55e' },
                { label: 'Sell Price', value: `Rs. ${sellPrice.toLocaleString()}`, color: '#CF0A0A' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <p style={{ color: '#EEEEEE33', fontSize: '10px', marginBottom: '3px' }}>{label}</p>
                  <p style={{ color, fontWeight: 700, fontSize: '11px' }}>{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Image Upload */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Product Image</label>
            {imagePreview && (
              <div style={{ marginBottom: '10px', position: 'relative', width: '100px', height: '100px' }}>
                <img src={imagePreview} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #CF0A0A44' }} />
                <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#CF0A0A', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#111', border: '2px dashed #333', borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#CF0A0A'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#333'}>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              <span style={{ fontSize: '28px' }}>📸</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '13px', color: '#EEEEEE' }}>{imageFile ? imageFile.name : imagePreview ? 'Change image' : 'Click to upload product image'}</p>
                <p style={{ color: '#EEEEEE33', fontSize: '11px', marginTop: '2px' }}>PNG, JPG — max 5MB</p>
              </div>
            </label>
          </div>

          {/* Name */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Product Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. iPhone 14 Pro Max" style={inputStyle()} />
          </div>

          {/* Category */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Category *</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle()}>
              {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Dynamic Category Specs */}
          {currentSpecs.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ backgroundColor: '#111', border: '1px solid #CF0A0A33', borderRadius: '14px', padding: '16px', marginTop: '4px' }}>
              <p style={{ color: '#CF0A0A', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', marginBottom: '12px', textTransform: 'uppercase' }}>⚙️ {form.category} Specifications</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentSpecs.map((field) => (
                  <div key={field.key}>
                    <label style={{ color: '#EEEEEE66', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      {field.label}
                      {field.isArray && <span style={{ color: '#CF0A0A', marginLeft: '4px' }}>● Multiple</span>}
                    </label>
                    <input type={field.type} value={specs[field.key] || ''} onChange={e => setSpecs(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} style={inputStyle(field.isArray ? '#CF0A0A55' : '#333')} />
                    {field.isArray && getArrayPreview(field.key).length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {getArrayPreview(field.key).map((val, i) => (
                          <span key={i} style={{ fontSize: '11px', color: '#EEEEEE', backgroundColor: field.key.includes('ram') ? '#CF0A0A33' : '#3b82f633', border: `1px solid ${field.key.includes('ram') ? '#CF0A0A55' : '#3b82f655'}`, padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                            {field.key.includes('ram') ? '💾' : '💿'} {val}{field.key.includes('ram') ? 'GB' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Colors */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              Available Colors <span style={{ color: '#EEEEEE33', fontWeight: 400 }}>(comma separated)</span>
            </label>
            <input
              value={typeof form.colors === 'string' ? form.colors : (Array.isArray(form.colors) ? form.colors.join(', ') : '')}
              onChange={e => setForm(p => ({ ...p, colors: e.target.value }))}
              placeholder="e.g. Black, White, Red"
              style={inputStyle()}
            />
            {form.colors && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {(typeof form.colors === 'string' ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : Array.isArray(form.colors) ? form.colors : []).map((color, i) => (
                  <span key={i} style={{ fontSize: '11px', color: '#EEEEEE88', backgroundColor: '#1a1a1a', padding: '4px 12px', borderRadius: '20px', border: '1px solid #333' }}>{color}</span>
                ))}
              </div>
            )}
          </div>

          {/* Rating & Reviews */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Rating (1-5)</label>
              <input type="number" min="1" max="5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: Number(e.target.value) }))} style={inputStyle()} />
            </div>
            <div>
              <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Reviews Count</label>
              <input type="number" value={form.reviews} onChange={e => setForm(p => ({ ...p, reviews: Number(e.target.value) }))} style={inputStyle()} />
            </div>
          </div>

          {/* Buy Price */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
              Buy Price / Cost (Rs.) * <span style={{ color: '#EEEEEE33', fontWeight: 400 }}>— kitne mein liya</span>
            </label>
            <input type="number" value={form.buyPrice} onChange={e => setForm(p => ({ ...p, buyPrice: e.target.value }))} placeholder="e.g. 135000" style={inputStyle('#3b82f655')} />
          </div>

          {/* Profit */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Profit — kitna lena hai</label>
            <div style={{ display: 'flex', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', width: 'fit-content' }}>
              {[{ key: 'amount', label: 'Rs. Amount' }, { key: 'pct', label: '% Percentage' }].map(opt => (
                <button key={opt.key} onClick={() => setProfitType(opt.key)}
                  style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', backgroundColor: profitType === opt.key ? '#22c55e' : 'transparent', color: profitType === opt.key ? 'white' : '#EEEEEE55', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {profitType === 'amount' ? (
              <input type="number" value={form.profitAmount} onChange={e => setForm(p => ({ ...p, profitAmount: e.target.value }))} placeholder="e.g. 5000" style={inputStyle('#22c55e55')} />
            ) : (
              <input type="number" value={form.profitPct} min="0" max="100" onChange={e => setForm(p => ({ ...p, profitPct: e.target.value }))} placeholder="e.g. 10" style={inputStyle('#22c55e55')} />
            )}
            {buyPrice > 0 && profitAmount > 0 && (
              <p style={{ color: '#22c55e', fontSize: '11px', marginTop: '6px' }}>✓ Sell Price auto set: <strong>Rs. {sellPrice.toLocaleString()}</strong></p>
            )}
          </div>

          {/* Old Price */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
              Old Price (Rs.) <span style={{ color: '#EEEEEE33', fontWeight: 400 }}>— optional</span>
            </label>
            <input type="number" value={form.oldPrice} onChange={e => setForm(p => ({ ...p, oldPrice: e.target.value }))} placeholder="e.g. 160000" style={inputStyle()} />
          </div>

          {/* Discount */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
              Discount % <span style={{ color: '#DC5F00', fontWeight: 400 }}>(0 = no discount)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input type="number" min="0" max="100" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} placeholder="e.g. 10" style={inputStyle(form.discount > 0 ? '#DC5F0066' : '#333')} />
              {form.discount > 0 && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#DC5F0022', color: '#DC5F00', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                  Save Rs. {(sellPrice - discountedPrice).toLocaleString()}
                </div>
              )}
            </div>
            {form.discount > 0 && (
              <p style={{ color: '#22c55e', fontSize: '11px', marginTop: '5px' }}>✓ Final price after discount: Rs. {discountedPrice.toLocaleString()}</p>
            )}
          </div>

          {/* Stock + Badge */}
          <div style={{ display: 'grid', gridTemplateColumns: form.category === 'Mobiles' ? '1fr 1fr' : '1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} placeholder="10" style={inputStyle()} />
            </div>
            {form.category === 'Mobiles' && (
              <div>
                <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>
                  PTA Status <span style={{ color: '#EEEEEE33', fontWeight: 400 }}>— sirf Mobiles ke liye</span>
                </label>
                <select value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={inputStyle()}>
                  {badges.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Product description..." rows={3} style={{ ...inputStyle(), resize: 'vertical' }} />
          </div>

          {/* Status */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={inputStyle()}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
          style={{ width: '100%', marginTop: '20px', backgroundColor: saving ? '#7a0606' : '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : product?.firestoreId ? '✓ Save Changes' : '+ Add Product'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function DeleteModal({ product, onClose, onDelete }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, backgroundColor: '#000000cc', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
        <h3 style={{ fontWeight: 900, fontSize: '18px', marginBottom: '8px' }}>Delete Product?</h3>
        <p style={{ color: '#EEEEEE55', fontSize: '13px', marginBottom: '24px' }}>Delete <span style={{ color: '#CF0A0A', fontWeight: 700 }}>{product?.name}</span>? This cannot be undone.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button whileHover={{ scale: 1.03 }} onClick={onClose}
            style={{ flex: 1, backgroundColor: '#1a1a1a', color: '#EEEEEE', border: '1px solid #333', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer' }}>Cancel</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => { onDelete(product.firestoreId); onClose() }}
            style={{ flex: 1, backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer' }}>Delete</motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ firestoreId: d.id, ...d.data() }))
      setProducts(data)
      setLoading(false)
    }, (err) => {
      console.error('Firestore error:', err)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat
  })

  const handleSave = async (prod) => {
    setSaving(true)
    try {
      if (prod.firestoreId) {
        const ref = doc(db, 'products', prod.firestoreId)
        const { firestoreId, ...data } = prod
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
      } else {
        await addDoc(collection(db, 'products'), { ...prod, createdAt: serverTimestamp() })
      }
      setShowModal(false)
      setEditProduct(null)
    } catch (err) {
      console.error('Save error:', err)
      alert('Error saving product. Check console.')
    }
    setSaving(false)
  }

  const handleDelete = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, 'products', firestoreId))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Error deleting product.')
    }
  }

  // ✅ FIXED: Stock se multiply karo — sahi calculation
  const totalProfit = products.reduce((acc, p) => acc + ((p.profitAmount || 0) * (p.stock || 0)), 0)
  const totalCost   = products.reduce((acc, p) => acc + ((p.buyPrice || 0) * (p.stock || 0)), 0)

  return (
    <AdminLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {showModal && (
          <ProductModal product={editProduct} onClose={() => { setShowModal(false); setEditProduct(null) }} onSave={handleSave} saving={saving} />
        )}
        {deleteTarget && (
          <DeleteModal product={deleteTarget} onClose={() => setDeleteTarget(null)} onDelete={handleDelete} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, marginBottom: '2px' }}>
            Manage <span style={{ color: '#CF0A0A' }}>Products</span>
          </h1>
          <p style={{ color: '#EEEEEE44', fontSize: '12px' }}>{products.length} products total</p>
        </div>
        <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditProduct(null); setShowModal(true) }}
          style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={17} /> List Product
        </motion.button>
      </motion.div>

      {/* ✅ FIXED STATS — stock × price/profit */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total Products', value: products.length,                                                                          color: '#CF0A0A', isNum: true  },
          { label: 'Total Stock',    value: products.reduce((a, p) => a + (p.stock || 0), 0),                                         color: '#22c55e', isNum: true  },
          { label: 'Low Stock',      value: products.filter(p => (p.stock || 0) <= 5).length,                                         color: '#f59e0b', isNum: true  },
          { label: 'On Discount',    value: products.filter(p => p.discount > 0).length,                                              color: '#DC5F00', isNum: true  },
          // ✅ FIXED: buyPrice × stock
          { label: 'Total Cost',     value: `Rs.${totalCost >= 1_000_000 ? (totalCost / 1_000_000).toFixed(1) + 'M' : (totalCost / 1000).toFixed(0) + 'k'}`,   color: '#3b82f6', isNum: false },
          // ✅ FIXED: profitAmount × stock
          { label: 'Total Profit',   value: `Rs.${totalProfit >= 1_000_000 ? (totalProfit / 1_000_000).toFixed(1) + 'M' : (totalProfit / 1000).toFixed(0) + 'k'}`, color: '#22c55e', isNum: false },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ backgroundColor: '#111', border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '13px' }}>
            <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '4px' }}>{s.label}</p>
            <p style={{ color: s.color, fontWeight: 900, fontSize: '18px' }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + View Toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#EEEEEE44' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px 10px 36px', color: '#EEEEEE', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', overflow: 'hidden' }}>
          {['grid', 'list'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              style={{ padding: '8px 14px', border: 'none', cursor: 'pointer', backgroundColor: viewMode === mode ? '#CF0A0A' : 'transparent', color: viewMode === mode ? 'white' : '#EEEEEE55', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
              {mode === 'grid' ? '⊞ Grid' : '☰ List'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <motion.button key={cat} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat)}
            style={{ padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, backgroundColor: activeCategory === cat ? '#CF0A0A' : '#111', color: activeCategory === cat ? 'white' : '#EEEEEE55', border: activeCategory === cat ? '1px solid #CF0A0A' : '1px solid #333', transition: 'all 0.2s' }}>
            {cat} {cat !== 'All' && `(${products.filter(p => p.category === cat).length})`}
          </motion.button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
          <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
          <p style={{ fontSize: '14px' }}>Loading products from Firebase...</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {filtered.map((product, i) => {
            const finalPrice = product.discount > 0
              ? Math.round((product.sellPrice || product.price) * (1 - product.discount / 100))
              : (product.sellPrice || product.price)
            return (
              <motion.div key={product.firestoreId}
                initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 180 }}
                whileHover={{ y: -4, boxShadow: '0 8px 25px #CF0A0A15' }}
                style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '14px', overflow: 'hidden', position: 'relative' }}>
                {product.badge && (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, backgroundColor: badgeColors[product.badge], color: 'white', fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px' }}>{product.badge}</div>
                )}
                {product.discount > 0 && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, backgroundColor: '#DC5F0022', color: '#DC5F00', fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px', border: '1px solid #DC5F0044' }}>-{product.discount}% OFF</div>
                )}
                {product.stock <= 5 && product.discount === 0 && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, backgroundColor: '#f59e0b22', color: '#f59e0b', fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '20px', border: '1px solid #f59e0b44' }}>Low Stock</div>
                )}
                <div style={{ height: '110px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '48px' }}>{product.img}</span>}
                </div>
                <div style={{ padding: '14px' }}>
                  <p style={{ color: '#EEEEEE44', fontSize: '10px', marginBottom: '3px' }}>{product.category}</p>
                  <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', lineHeight: 1.3 }}>{product.name}</p>
                  {product.ramOptions && product.ramOptions.length > 0 && <p style={{ color: '#EEEEEE55', fontSize: '10px', marginBottom: '4px' }}>💾 {product.ramOptions.join(', ')}GB RAM</p>}
                  {product.storageOptions && product.storageOptions.length > 0 && <p style={{ color: '#EEEEEE55', fontSize: '10px', marginBottom: '4px' }}>💿 {product.storageOptions.join(', ')}GB Storage</p>}
                  {product.ram && !product.ramOptions && <p style={{ color: '#EEEEEE55', fontSize: '10px', marginBottom: '4px' }}>📱 {product.ram}GB RAM · {product.storage || 'N/A'} Storage</p>}
                  {product.screenSize && <p style={{ color: '#EEEEEE55', fontSize: '10px', marginBottom: '4px' }}>📺 {product.screenSize} · {product.resolution || 'N/A'}</p>}
                  {product.capacity && <p style={{ color: '#EEEEEE55', fontSize: '10px', marginBottom: '4px' }}>❄️ {product.capacity}L · {product.fridgeType || 'N/A'}</p>}
                  {product.profitAmount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <TrendingUp size={11} style={{ color: '#22c55e' }} />
                      <span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 600 }}>Profit: Rs. {(product.profitAmount || 0).toLocaleString()} ({product.profitPct || 0}%)</span>
                    </div>
                  )}
                  <div style={{ marginBottom: '10px' }}>
                    {product.discount > 0 ? (
                      <div>
                        <span style={{ color: '#EEEEEE33', fontSize: '11px', textDecoration: 'line-through' }}>Rs. {(product.sellPrice || product.price || 0).toLocaleString()}</span>
                        <span style={{ color: '#CF0A0A', fontWeight: 900, fontSize: '15px', marginLeft: '6px' }}>Rs. {finalPrice.toLocaleString()}</span>
                      </div>
                    ) : (
                      <p style={{ color: '#CF0A0A', fontWeight: 900, fontSize: '15px' }}>Rs. {(product.sellPrice || product.price || 0).toLocaleString()}</p>
                    )}
                    <span style={{ color: product.stock <= 5 ? '#f59e0b' : '#22c55e', fontSize: '11px', fontWeight: 600 }}>Stock: {product.stock}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setEditProduct(product); setShowModal(true) }}
                      style={{ flex: 1, backgroundColor: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f633', borderRadius: '8px', padding: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Edit2 size={12} /> Edit
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteTarget(product)}
                      style={{ flex: 1, backgroundColor: '#CF0A0A22', color: '#CF0A0A', border: '1px solid #CF0A0A33', borderRadius: '8px', padding: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Trash2 size={12} /> Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '10px', padding: '10px 16px', backgroundColor: '#111', borderRadius: '10px', fontSize: '11px', color: '#EEEEEE44', fontWeight: 700 }}>
            <span>PRODUCT</span><span>CATEGORY</span><span>BUY PRICE</span><span>SELL PRICE</span><span>PROFIT</span><span>STOCK</span><span>ACTIONS</span>
          </div>
          {filtered.map((product, i) => {
            const finalPrice = product.discount > 0
              ? Math.round((product.sellPrice || product.price) * (1 - product.discount / 100))
              : (product.sellPrice || product.price)
            return (
              <motion.div key={product.firestoreId}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ backgroundColor: '#1a1a1a' }}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto', gap: '10px', padding: '12px 16px', backgroundColor: '#111', borderRadius: '10px', border: '1px solid #222', alignItems: 'center', transition: 'background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} /> : <span style={{ fontSize: '18px' }}>{product.img}</span>}
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '12px' }}>{product.name}</p>
                    {product.ramOptions && <p style={{ color: '#EEEEEE44', fontSize: '10px' }}>💾 {product.ramOptions.join('/')}GB · 💿 {product.storageOptions?.join('/') || 'N/A'}GB</p>}
                    {product.ram && !product.ramOptions && <p style={{ color: '#EEEEEE44', fontSize: '10px' }}>{product.ram}GB · {product.storage}</p>}
                  </div>
                </div>
                <span style={{ color: '#EEEEEE55', fontSize: '11px' }}>{product.category}</span>
                <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '12px' }}>Rs.{((product.buyPrice || 0) / 1000).toFixed(0)}k</span>
                <div>
                  {product.discount > 0 ? (
                    <>
                      <p style={{ color: '#EEEEEE33', fontSize: '10px', textDecoration: 'line-through' }}>Rs.{((product.sellPrice || product.price || 0) / 1000).toFixed(0)}k</p>
                      <p style={{ color: '#CF0A0A', fontWeight: 700, fontSize: '12px' }}>Rs.{(finalPrice / 1000).toFixed(0)}k</p>
                    </>
                  ) : (
                    <p style={{ color: '#CF0A0A', fontWeight: 700, fontSize: '12px' }}>Rs.{((product.sellPrice || product.price || 0) / 1000).toFixed(0)}k</p>
                  )}
                </div>
                <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '11px' }}>Rs.{((product.profitAmount || 0) / 1000).toFixed(1)}k ({product.profitPct || 0}%)</span>
                <span style={{ color: product.stock <= 5 ? '#f59e0b' : '#22c55e', fontWeight: 600, fontSize: '12px' }}>{product.stock}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setEditProduct(product); setShowModal(true) }}
                    style={{ backgroundColor: '#3b82f622', border: '1px solid #3b82f633', color: '#3b82f6', borderRadius: '7px', padding: '6px', cursor: 'pointer' }}>
                    <Edit2 size={13} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => setDeleteTarget(product)}
                    style={{ backgroundColor: '#CF0A0A22', border: '1px solid #CF0A0A33', color: '#CF0A0A', borderRadius: '7px', padding: '6px', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px', color: '#EEEEEE33' }}>
          <Package size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', fontWeight: 600 }}>{products.length === 0 ? 'No products yet' : 'No products found'}</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>{products.length === 0 ? 'Click "+ Add Product" to add your first product' : 'Try different filters'}</p>
        </motion.div>
      )}
    </AdminLayout>
  )
}

export default AdminProducts