import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { Plus, X, Edit2, Trash2, Tag, Package, Loader2 } from 'lucide-react'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const colorOptions = ['#CF0A0A', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#DC5F00', '#06b6d4', '#B8960C', '#ec4899']
const iconOptions = ['📱', '❄️', '🌀', '💻', '📺', '🔌', '🎧', '⌚', '🖨️', '📷', '🎮', '🔋']

function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    icon: category?.icon || '📱',
    description: category?.description || '',
    color: category?.color || '#CF0A0A',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({ ...category, ...form })
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
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '20px' }}>
            {category?.id ? 'Edit' : 'New'} <span style={{ color: '#CF0A0A' }}>Category</span>
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
            style={{ backgroundColor: '#CF0A0A22', border: 'none', color: '#CF0A0A', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X size={18} />
          </motion.button>
        </div>

        {/* Preview */}
        <motion.div
          style={{ backgroundColor: '#111', borderRadius: '14px', padding: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${form.color}44` }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: form.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: `1px solid ${form.color}44`, flexShrink: 0 }}>
            {form.icon}
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '16px', color: form.color }}>{form.name || 'Category Name'}</p>
            <p style={{ color: '#EEEEEE44', fontSize: '12px', marginTop: '2px' }}>{form.description || 'Description here'}</p>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Category Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Mobiles"
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Description</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Smartphones & accessories"
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {iconOptions.map(icon => (
                <motion.button
                  key={icon} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  style={{ fontSize: '22px', padding: '8px', borderRadius: '10px', border: form.icon === icon ? `2px solid #CF0A0A` : '2px solid #222', backgroundColor: form.icon === icon ? '#CF0A0A22' : '#111', cursor: 'pointer' }}
                >{icon}</motion.button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {colorOptions.map(color => (
                <motion.button
                  key={color} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setForm(p => ({ ...p, color }))}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: color, border: form.color === color ? '3px solid white' : '3px solid transparent', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', marginTop: '20px', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving...' : category?.id ? '✓ Save Changes' : '+ Add Category'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function DeleteModal({ category, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(category.id)
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
        <h3 style={{ fontWeight: 900, fontSize: '18px', marginBottom: '8px' }}>Delete Category?</h3>
        <p style={{ color: '#EEEEEE55', fontSize: '13px', marginBottom: '24px' }}>
          Are you sure you want to delete <span style={{ color: '#CF0A0A', fontWeight: 700 }}>{category?.name}</span>? This action cannot be undone.
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

function Categories() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')

  // ✅ Fetch real categories from Firestore
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const catsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCategories(catsData)
      setLoading(false)
    }, (error) => {
      console.error('Categories fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ✅ Fetch real products to count per category
  useEffect(() => {
    const q = query(collection(db, 'products'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setProducts(prodsData)
    }, (error) => {
      console.error('Products fetch error:', error)
    })

    return () => unsubscribe()
  }, [])

  // ✅ Calculate real product count per category
  const getProductCount = (categoryName) => {
    return products.filter(p => 
      p.category?.toLowerCase() === categoryName?.toLowerCase() ||
      p.productCategory?.toLowerCase() === categoryName?.toLowerCase()
    ).length
  }

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // ✅ Save category to Firestore (Add or Update)
  const handleSave = async (cat) => {
    try {
      if (cat.id && categories.find(c => c.id === cat.id)) {
        // Update existing
        const catRef = doc(db, 'categories', cat.id)
        await updateDoc(catRef, {
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          color: cat.color,
          updatedAt: serverTimestamp()
        })
      } else {
        // Add new
        await addDoc(collection(db, 'categories'), {
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
          color: cat.color,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Category save error:', error)
      alert('Error saving category. Check console.')
    }
  }

  // ✅ Delete category from Firestore
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id))
    } catch (error) {
      console.error('Category delete error:', error)
      alert('Error deleting category. Check console.')
    }
  }

  const totalProducts = products.length
  const avgPerCategory = categories.length > 0 ? Math.round(totalProducts / categories.length) : 0

  return (
    <AdminLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {showModal && (
          <CategoryModal
            category={editCategory}
            onClose={() => { setShowModal(false); setEditCategory(null) }}
            onSave={handleSave}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            category={deleteTarget}
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
            Manage <span style={{ color: '#CF0A0A' }}>Categories</span>
          </h1>
          <p style={{ color: '#EEEEEE44', fontSize: '12px' }}>{categories.length} categories total</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditCategory(null); setShowModal(true) }}
          style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={17} /> Add Category
        </motion.button>
      </motion.div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search categories..."
          style={{ width: '100%', maxWidth: '340px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', padding: '10px 16px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Total Categories', value: categories.length, color: '#CF0A0A' },
          { label: 'Total Products', value: totalProducts, color: '#B8960C' },
          { label: 'Avg per Category', value: avgPerCategory, color: '#22c55e' },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ backgroundColor: '#111', border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '14px' }}>
            <p style={{ color: '#EEEEEE44', fontSize: '11px', marginBottom: '4px' }}>{s.label}</p>
            <p style={{ color: s.color, fontWeight: 900, fontSize: '20px' }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
          <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
          <p style={{ fontSize: '14px' }}>Loading categories...</p>
        </div>
      ) : (
        /* Categories Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {filtered.map((cat, i) => {
            const productCount = getProductCount(cat.name)
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 180 }}
                whileHover={{ y: -4, boxShadow: `0 8px 25px ${cat.color}22` }}
                style={{ backgroundColor: '#111', border: `1px solid ${cat.color}22`, borderRadius: '16px', padding: '18px', position: 'relative', overflow: 'hidden' }}
              >
                {/* Glow */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: cat.color + '15', filter: 'blur(20px)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                      style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: cat.color + '22', border: `1px solid ${cat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}
                    >
                      {cat.icon}
                    </motion.div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: '15px', marginBottom: '2px' }}>{cat.name}</p>
                      <p style={{ color: '#EEEEEE44', fontSize: '11px' }}>{cat.description}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <motion.button
                      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onClick={() => { setEditCategory(cat); setShowModal(true) }}
                      style={{ backgroundColor: '#3b82f622', border: '1px solid #3b82f633', color: '#3b82f6', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                    >
                      <Edit2 size={13} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setDeleteTarget(cat)}
                      style={{ backgroundColor: '#CF0A0A22', border: '1px solid #CF0A0A33', color: '#CF0A0A', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </motion.button>
                  </div>
                </div>

                {/* Product Count - REAL */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={14} style={{ color: cat.color }} />
                    <span style={{ color: '#EEEEEE77', fontSize: '12px' }}>Products</span>
                  </div>
                  <span style={{ color: cat.color, fontWeight: 900, fontSize: '16px' }}>{productCount}</span>
                </div>

                {/* Color bar */}
                <div style={{ height: '3px', background: `linear-gradient(to right, ${cat.color}, transparent)`, borderRadius: '2px', marginTop: '14px' }} />
              </motion.div>
            )
          })}

          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#EEEEEE33' }}
            >
              <Tag size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: 600 }}>No categories found</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Try a different search or add a new category</p>
            </motion.div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}

export default Categories