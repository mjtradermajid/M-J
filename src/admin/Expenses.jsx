import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { Plus, X, Edit2, Trash2, Search, TrendingDown, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

const expenseCategories = [
  'Marketing & Ads',
  'Packaging',
  'Delivery & Shipping',
  'Rent & Utilities',
  'Salaries',
  'Equipment',
  'Miscellaneous'
]

const categoryColors = {
  'Marketing & Ads': '#CF0A0A',
  'Packaging': '#DC5F00',
  'Delivery & Shipping': '#B8960C',
  'Rent & Utilities': '#3b82f6',
  'Salaries': '#8b5cf6',
  'Equipment': '#22c55e',
  'Miscellaneous': '#EEEEEE44'
}

const categoryIcons = {
  'Marketing & Ads': '📢',
  'Packaging': '📦',
  'Delivery & Shipping': '🚚',
  'Rent & Utilities': '🏠',
  'Salaries': '👥',
  'Equipment': '🔧',
  'Miscellaneous': '📝'
}

function ExpenseModal({ expense, onClose, onSave }) {
  const [form, setForm] = useState({
    title: expense?.title || '',
    category: expense?.category || 'Marketing & Ads',
    amount: expense?.amount || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    note: expense?.note || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) return
    setSaving(true)
    await onSave({
      ...expense,
      ...form,
      amount: Number(form.amount),
    })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '20px' }}>
            {expense?.id ? 'Edit' : 'Add'} <span style={{ color: '#CF0A0A' }}>Expense</span>
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} onClick={onClose}
            style={{ backgroundColor: '#CF0A0A22', border: 'none', color: '#CF0A0A', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X size={18} />
          </motion.button>
        </div>

        {/* Live Preview */}
        <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '14px', marginBottom: '20px', border: '1px solid #CF0A0A22', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px', width: '48px', height: '48px', backgroundColor: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {categoryIcons[form.category]}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>{form.title || 'Expense Title'}</p>
            <p style={{ color: categoryColors[form.category], fontSize: '12px', marginTop: '2px' }}>{form.category}</p>
            <p style={{ color: '#CF0A0A', fontWeight: 900, fontSize: '16px', marginTop: '2px' }}>
              Rs. {Number(form.amount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Title */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Expense Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Facebook Ads"
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Category */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Category *</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
              {expenseCategories.map(c => <option key={c} value={c}>{categoryIcons[c]} {c}</option>)}
            </select>
          </div>

          {/* Amount + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Amount (Rs.) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="5000"
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #CF0A0A44', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={{ color: '#EEEEEE66', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Note (Optional)</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Additional details..." rows={2}
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '10px 14px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'none' }} />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', marginTop: '20px', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : expense?.id ? '✓ Save Changes' : '+ Add Expense'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function DeleteModal({ expense, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(expense.id)
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
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #CF0A0A44', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '360px', textAlign: 'center' }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
        <h3 style={{ fontWeight: 900, fontSize: '18px', marginBottom: '8px' }}>Delete Expense?</h3>
        <p style={{ color: '#EEEEEE55', fontSize: '13px', marginBottom: '24px' }}>
          Delete <span style={{ color: '#CF0A0A', fontWeight: 700 }}>{expense?.title}</span>? This cannot be undone.
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

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // ✅ Fetch real expenses from Firestore
  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }))
      setExpenses(expensesData)
      setLoading(false)
    }, (error) => {
      console.error('Expenses fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filtered = expenses.filter(e => {
    const matchSearch = (e.title || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || e.category === activeCategory
    return matchSearch && matchCat
  })

  // ✅ Save expense to Firestore (Add or Update)
  const handleSave = async (exp) => {
    try {
      const expenseData = {
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        note: exp.note || '',
        updatedAt: serverTimestamp()
      }

      if (exp.id && expenses.find(e => e.id === exp.id)) {
        // Update existing
        const expRef = doc(db, 'expenses', exp.id)
        await updateDoc(expRef, expenseData)
      } else {
        // Add new
        await addDoc(collection(db, 'expenses'), {
          ...expenseData,
          createdAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Expense save error:', error)
      alert('Error saving expense. Check console.')
    }
  }

  // ✅ Delete expense from Firestore
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'expenses', id))
    } catch (error) {
      console.error('Expense delete error:', error)
      alert('Error deleting expense. Check console.')
    }
  }

  // Calculations from real data
  const totalExpenses = expenses.reduce((a, e) => a + (e.amount || 0), 0)
  
  // This month expenses
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonth = expenses.filter(e => e.date && e.date.startsWith(currentMonth)).reduce((a, e) => a + (e.amount || 0), 0)

  // Biggest category
  const biggestCategory = expenseCategories.reduce((max, cat) => {
    const total = expenses.filter(e => e.category === cat).reduce((a, e) => a + (e.amount || 0), 0)
    return total > (max.total || 0) ? { cat, total } : max
  }, {})

  // Pie chart data
  const pieData = expenseCategories.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((a, e) => a + (e.amount || 0), 0),
    color: categoryColors[cat]
  })).filter(d => d.value > 0)

  // Bar chart - by category
  const barData = expenseCategories.map(cat => ({
    name: cat.split(' ')[0],
    amount: expenses.filter(e => e.category === cat).reduce((a, e) => a + (e.amount || 0), 0),
  })).filter(d => d.amount > 0)

  return (
    <AdminLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <AnimatePresence>
        {showModal && (
          <ExpenseModal
            expense={editExpense}
            onClose={() => { setShowModal(false); setEditExpense(null) }}
            onSave={handleSave}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            expense={deleteTarget}
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
            Business <span style={{ color: '#CF0A0A' }}>Expenses</span>
          </h1>
          <p style={{ color: '#EEEEEE44', fontSize: '12px' }}>Track all your business costs</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #CF0A0A55' }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditExpense(null); setShowModal(true) }}
          style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '11px 22px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={17} /> Add Expense
        </motion.button>
      </motion.div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
          <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
          <p style={{ fontSize: '14px' }}>Loading expenses...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Expenses', value: `Rs. ${totalExpenses.toLocaleString()}`, color: '#CF0A0A', icon: '💸' },
              { label: 'This Month', value: `Rs. ${thisMonth.toLocaleString()}`, color: '#f59e0b', icon: '📅' },
              { label: 'Total Entries', value: expenses.length, color: '#3b82f6', icon: '📋' },
              { label: 'Biggest Category', value: biggestCategory.cat?.split(' ')[0] || '—', color: '#8b5cf6', icon: '📊' },
            ].map((card, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3, boxShadow: `0 8px 20px ${card.color}22` }}
                style={{ backgroundColor: '#111', border: `1px solid ${card.color}22`, borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '50px', height: '50px', borderRadius: '50%', backgroundColor: card.color + '15', filter: 'blur(12px)' }} />
                <p style={{ fontSize: '22px', marginBottom: '6px' }}>{card.icon}</p>
                <p style={{ color: card.color, fontWeight: 900, fontSize: '16px', marginBottom: '3px' }}>{card.value}</p>
                <p style={{ color: '#EEEEEE44', fontSize: '11px' }}>{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>

            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              style={{ backgroundColor: '#111', border: '1px solid #CF0A0A22', borderRadius: '14px', padding: '18px' }}
            >
              <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Category Breakdown</p>
              <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '14px' }}>Expenses by category</p>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #33333344', borderRadius: '8px', color: '#EEEEEE', fontSize: '11px' }}
                        formatter={(val) => [`Rs. ${val.toLocaleString()}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '8px' }}>
                    {pieData.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 6px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                        <span style={{ color: '#EEEEEE66', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name.split(' ')[0]}</span>
                        <span style={{ color: item.color, fontSize: '10px', fontWeight: 700, marginLeft: 'auto' }}>
                          {totalExpenses > 0 ? Math.round((item.value / totalExpenses) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#EEEEEE33' }}>
                  <p style={{ fontSize: '13px' }}>No data available</p>
                </div>
              )}
            </motion.div>

            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              style={{ backgroundColor: '#111', border: '1px solid #DC5F0022', borderRadius: '14px', padding: '18px' }}
            >
              <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Amount by Category</p>
              <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '14px' }}>Rs. spent per category</p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE0A" />
                    <XAxis dataKey="name" stroke="#EEEEEE22" tick={{ fill: '#EEEEEE44', fontSize: 10 }} />
                    <YAxis stroke="#EEEEEE22" tick={{ fill: '#EEEEEE44', fontSize: 10 }} width={40} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #DC5F0033', borderRadius: '8px', color: '#EEEEEE', fontSize: '11px' }}
                      formatter={(val) => [`Rs. ${val.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={Object.values(categoryColors)[i] || '#CF0A0A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#EEEEEE33' }}>
                  <p style={{ fontSize: '13px' }}>No data available</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Search + Filter */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#EEEEEE44' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search expenses..."
                style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', borderRadius: '10px', padding: '9px 14px 9px 34px', color: '#EEEEEE', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['All', ...expenseCategories].map(cat => (
              <motion.button key={cat} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                style={{ padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, backgroundColor: activeCategory === cat ? '#CF0A0A' : '#111', color: activeCategory === cat ? 'white' : '#EEEEEE55', border: activeCategory === cat ? '1px solid #CF0A0A' : '1px solid #333', transition: 'all 0.2s' }}>
                {cat !== 'All' && categoryIcons[cat]} {cat === 'All' ? 'All' : cat.split(' ')[0]}
                {cat !== 'All' && ` (${expenses.filter(e => e.category === cat).length})`}
              </motion.button>
            ))}
          </div>

          {/* Expense List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((expense, i) => (
              <motion.div key={expense.id}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2, borderColor: '#CF0A0A33' }}
                style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}
              >
                {/* Icon */}
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: (categoryColors[expense.category] || '#CF0A0A') + '22', border: `1px solid ${categoryColors[expense.category] || '#CF0A0A'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {categoryIcons[expense.category] || '📝'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, fontSize: '14px' }}>{expense.title}</p>
                    <span style={{ backgroundColor: (categoryColors[expense.category] || '#CF0A0A') + '22', color: categoryColors[expense.category] || '#CF0A0A', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                      {expense.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#EEEEEE44', fontSize: '11px' }}>📅 {expense.date}</span>
                    {expense.note && <span style={{ color: '#EEEEEE33', fontSize: '11px' }}>📝 {expense.note}</span>}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: '#CF0A0A', fontWeight: 900, fontSize: '16px' }}>
                    Rs. {(expense.amount || 0).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setEditExpense(expense); setShowModal(true) }}
                    style={{ backgroundColor: '#3b82f622', border: '1px solid #3b82f633', color: '#3b82f6', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}>
                    <Edit2 size={13} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => setDeleteTarget(expense)}
                    style={{ backgroundColor: '#CF0A0A22', border: '1px solid #CF0A0A33', color: '#CF0A0A', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty */}
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px', color: '#EEEEEE33' }}>
              <TrendingDown size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: 600 }}>No expenses found</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Add your first expense to start tracking</p>
            </motion.div>
          )}
        </>
      )}
    </AdminLayout>
  )
}

export default Expenses