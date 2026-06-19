import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { Plus, X, Edit2, Trash2, Tag, Percent, Loader2 } from 'lucide-react'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

function DiscountModal({ discount, onClose, onSave, products }) {
  const [form, setForm] = useState({
    productId: discount?.productId || '',
    productName: discount?.productName || '',
    originalPrice: discount?.originalPrice || '',
    discountPercent: discount?.discountPercent || '',
    salePrice: discount?.salePrice || '',
    startDate: discount?.startDate || new Date().toISOString().split('T')[0],
    endDate: discount?.endDate || '',
    isActive: discount?.isActive !== false,
  })
  const [saving, setSaving] = useState(false)

  // Auto-calculate sale price when product or discount changes
  useEffect(() => {
    if (form.productId && form.discountPercent) {
      const selectedProduct = products.find(p => p.id === form.productId)
      if (selectedProduct) {
        const original = selectedProduct.price || selectedProduct.unitPrice || 0
        const discount = Number(form.discountPercent)
        const sale = original - (original * discount / 100)
        setForm(prev => ({
          ...prev,
          originalPrice: original,
          salePrice: Math.round(sale),
          productName: selectedProduct.name || selectedProduct.productName
        }))
      }
    }
  }, [form.productId, form.discountPercent, products])

  const handleSave = async () => {
    if (!form.productId || !form.discountPercent) return
    setSaving(true)
    await onSave({ ...discount, ...form })
    setSaving(false)
    onClose()
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
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '20px' }}>
            {discount?.id ? 'Edit' : 'New'} <span style={{ color: '#CF0A0A' }}>Discount</span>
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
            style={{ backgroundColor: '#CF0A0A22', border: 'none', color: '#CF0A0A', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X size={18} />
          </motion.button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Product Select */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Product *</label>
            <select
              value={form.productId}
              onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            >
              <option value="">Choose a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name || p.productName} — Rs.{(p.price || p.unitPrice || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Discount % */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Discount % *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={form.discountPercent}
                onChange={e => setForm(p => ({ ...p, discountPercent: e.target.value }))}
                placeholder="e.g. 30"
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #CF0A0A44', borderRadius: '10px', padding: '10px 14px 10px 34px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <Percent size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#CF0A0A' }} />
            </div>
          </div>

          {/* Preview */}
          {form.originalPrice > 0 && form.salePrice > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ backgroundColor: '#111', border: '1px solid #22c55e44', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}
            >
              <div style={{ fontSize: '28px' }}>🏷️</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px' }}>{form.productName}</p>
                <p style={{ color: '#EEEEEE55', fontSize: '12px' }}>
                  <span style={{ textDecoration: 'line-through', color: '#EEEEEE33' }}>Rs. {form.originalPrice.toLocaleString()}</span>
                  <span style={{ color: '#22c55e', fontWeight: 900, marginLeft: '8px' }}>Rs. {form.salePrice.toLocaleString()}</span>
                  <span style={{ color: '#CF0A0A', fontWeight: 700, marginLeft: '8px', backgroundColor: '#CF0A0A22', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>
                    -{form.discountPercent}% OFF
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
              style={{ width: '18px', height: '18px', accentColor: '#CF0A0A', cursor: 'pointer' }}
            />
            <label style={{ color: '#EEEEEE88', fontSize: '13px', cursor: 'pointer' }}>Active Discount (show in sale)</label>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', marginTop: '20px', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving...' : discount?.id ? '✓ Save Changes' : '+ Add Discount'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function DeleteModal({ discount, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(discount.id)
    setDeleting(false)
    onClose()
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
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
        <h3 style={{ fontWeight: 900, fontSize: '18px', marginBottom: '8px' }}>Delete Discount?</h3>
        <p style={{ color: '#EEEEEE55', fontSize: '13px', marginBottom: '24px' }}>
          Remove discount on <span style={{ color: '#CF0A0A', fontWeight: 700 }}>{discount?.productName}</span>?
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button whileHover={{ scale: 1.03 }} onClick={onClose}
            style={{ flex: 1, backgroundColor: '#1a1a1a', color: '#EEEEEE', border: '1px solid #333', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} onClick={handleDelete}
            disabled={deleting}
            style={{ flex: 1, backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
            {deleting ? 'Deleting...' : 'Delete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Discounts() {
  const [discounts, setDiscounts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDiscount, setEditDiscount] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Fetch discounts
  useEffect(() => {
    const q = query(collection(db, 'discounts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDiscounts(data)
      setLoading(false)
    }, (error) => {
      console.error('Discounts fetch error:', error)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Fetch products for dropdown
  useEffect(() => {
    const q = query(collection(db, 'products'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setProducts(data)
    })
    return () => unsubscribe()
  }, [])

  const handleSave = async (disc) => {
    try {
      const data = {
        productId: disc.productId,
        productName: disc.productName,
        originalPrice: disc.originalPrice,
        discountPercent: Number(disc.discountPercent),
        salePrice: disc.salePrice,
        startDate: disc.startDate,
        endDate: disc.endDate || '',
        isActive: disc.isActive,
        updatedAt: serverTimestamp()
      }

      if (disc.id && discounts.find(d => d.id === disc.id)) {
        await updateDoc(doc(db, 'discounts', disc.id), data)
      } else {
        await addDoc(collection(db, 'discounts'), {
          ...data,
          createdAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Discount save error:', error)
      alert('Error saving discount')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'discounts', id))
    } catch (error) {
      console.error('Discount delete error:', error)
      alert('Error deleting discount')
    }
  }

  const activeDiscounts = discounts.filter(d => d.isActive)
  const expiredDiscounts = discounts.filter(d => !d.isActive)

  return (
    <AdminLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {showModal && (
          <DiscountModal
            discount={editDiscount}
            onClose={() => { setShowModal(false); setEditDiscount(null) }}
            onSave={handleSave}
            products={products}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            discount={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDelete={handleDelete}
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
            Manage <span style={{ color: '#CF0A0A' }}>Discounts</span>
          </h1>
          <p style={{ color: '#EEEEEE44', fontSize: '12px' }}>{activeDiscounts.length} active • {expiredDiscounts.length} inactive</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditDiscount(null); setShowModal(true) }}
          style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={17} /> Add Discount
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Total Discounts', value: discounts.length, color: '#CF0A0A' },
          { label: 'Active', value: activeDiscounts.length, color: '#22c55e' },
          { label: 'Inactive', value: expiredDiscounts.length, color: '#EEEEEE44' },
          { label: 'Avg Discount', value: discounts.length > 0 ? Math.round(discounts.reduce((a, d) => a + (d.discountPercent || 0), 0) / discounts.length) + '%' : '0%', color: '#B8960C' },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ backgroundColor: '#111', border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '14px' }}>
            <p style={{ color: '#EEEEEE44', fontSize: '11px', marginBottom: '4px' }}>{s.label}</p>
            <p style={{ color: s.color, fontWeight: 900, fontSize: '20px' }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
          <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
          <p style={{ fontSize: '14px' }}>Loading discounts...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {discounts.map((disc, i) => (
            <motion.div key={disc.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2, borderColor: disc.isActive ? '#22c55e55' : '#EEEEEE22' }}
              style={{ backgroundColor: '#111', border: `1px solid ${disc.isActive ? '#22c55e33' : '#333'}`, borderRadius: '14px', padding: '16px', transition: 'all 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ 
                    backgroundColor: disc.isActive ? '#22c55e22' : '#EEEEEE11', 
                    border: `1px solid ${disc.isActive ? '#22c55e44' : '#333'}`, 
                    width: '52px', height: '52px', borderRadius: '14px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '22px', flexShrink: 0 
                  }}>
                    {disc.isActive ? '🔥' : '💤'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 800, fontSize: '15px' }}>{disc.productName}</p>
                      <span style={{ 
                        backgroundColor: disc.isActive ? '#22c55e22' : '#EEEEEE11', 
                        color: disc.isActive ? '#22c55e' : '#EEEEEE44', 
                        fontSize: '10px', fontWeight: 700, 
                        padding: '2px 8px', borderRadius: '20px' 
                      }}>
                        {disc.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p style={{ color: '#EEEEEE44', fontSize: '12px', marginTop: '2px' }}>
                      <span style={{ textDecoration: 'line-through', color: '#EEEEEE33' }}>Rs. {disc.originalPrice?.toLocaleString()}</span>
                      <span style={{ color: '#22c55e', fontWeight: 700, marginLeft: '6px' }}>Rs. {disc.salePrice?.toLocaleString()}</span>
                      <span style={{ color: '#CF0A0A', fontWeight: 700, marginLeft: '6px', backgroundColor: '#CF0A0A22', padding: '1px 6px', borderRadius: '20px', fontSize: '11px' }}>
                        -{disc.discountPercent}% OFF
                      </span>
                    </p>
                    <p style={{ color: '#EEEEEE33', fontSize: '10px', marginTop: '2px' }}>
                      {disc.startDate} {disc.endDate && `→ ${disc.endDate}`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { setEditDiscount(disc); setShowModal(true) }}
                    style={{ backgroundColor: '#3b82f622', border: '1px solid #3b82f633', color: '#3b82f6', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                  >
                    <Edit2 size={13} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteTarget(disc)}
                    style={{ backgroundColor: '#CF0A0A22', border: '1px solid #CF0A0A33', color: '#CF0A0A', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}

          {discounts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px', color: '#EEEEEE33' }}>
              <Tag size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: 600 }}>No discounts yet</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Add your first discount to show in sale</p>
            </motion.div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

export default Discounts