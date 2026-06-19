import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Tag,
  Star, LogOut, Menu, X, ChevronRight, Percent, CreditCard, Receipt
} from 'lucide-react'
import { adminLogout } from '../firebase/auth'

const menuItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: <Package size={20} />, label: 'Products', path: '/admin/products' },
  { icon: <ShoppingCart size={20} />, label: 'Orders', path: '/admin/orders' },
  { icon: <Tag size={20} />, label: 'Categories', path: '/admin/categories' },
  { icon: <Percent size={20} />, label: 'Discounts', path: '/admin/discounts' },
  { icon: <Star size={20} />, label: 'Reviews', path: '/admin/reviews' },
  { icon: <CreditCard size={20} />, label: 'Installments', path: '/admin/installments' },
  { icon: <Receipt size={20} />, label: 'Expenses', path: '/admin/expenses' },
]

function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await adminLogout()
    navigate('/admin')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000000', color: '#EEEEEE' }}>

      {/* ===== SIDEBAR ===== */}
      <motion.aside
        animate={{ width: collapsed ? '70px' : '240px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          backgroundColor: '#0D0D0D',
          borderRight: '1px solid #CF0A0A22',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: '4px 0 20px #CF0A0A11'
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #CF0A0A22', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="font-black text-xl"
              >
                <motion.span style={{ color: '#CF0A0A' }}
                  animate={{ textShadow: ['0 0 10px #CF0A0A', '0 0 20px #CF0A0A', '0 0 10px #CF0A0A'] }}
                  transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
                <motion.span style={{ color: '#B8960C' }}
                  animate={{ textShadow: ['0 0 10px #B8960C', '0 0 20px #B8960C', '0 0 10px #B8960C'] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
                <span style={{ color: '#EEEEEE88', fontSize: '11px', marginLeft: '6px', letterSpacing: '2px' }}>ADMIN</span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.1, color: '#CF0A0A' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed(!collapsed)}
            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#EEEEEE', padding: '4px' }}
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </motion.button>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {menuItems.map((item, i) => {
            const isActive = location.pathname === item.path
            return (
              <motion.button
                key={i}
                onClick={() => navigate(item.path)}
                whileHover={{ x: 4, backgroundColor: '#1a0000' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px', padding: '11px 12px',
                  borderRadius: '10px', cursor: 'pointer',
                  backgroundColor: isActive ? '#CF0A0A22' : 'transparent',
                  border: isActive ? '1px solid #CF0A0A44' : '1px solid transparent',
                  color: isActive ? '#CF0A0A' : '#EEEEEE88',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: '14px', textAlign: 'left',
                  transition: 'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden'
                }}
              >
                <span style={{ flexShrink: 0, color: isActive ? '#CF0A0A' : '#EEEEEE55' }}>{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >{item.label}</motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#CF0A0A' }} />}
              </motion.button>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #CF0A0A22' }}>
          <motion.button
            whileHover={{ x: 4, backgroundColor: '#1a0000' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 12px', borderRadius: '10px',
              cursor: 'pointer', backgroundColor: 'transparent',
              border: '1px solid transparent', color: '#CF0A0A88',
              fontSize: '14px', width: '100%', overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            <LogOut size={20} style={{ flexShrink: 0 }} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Top Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            backgroundColor: '#0D0D0D',
            borderBottom: '1px solid #CF0A0A22',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 40
          }}
        >
          <p style={{ color: '#EEEEEE88', fontSize: '13px' }}>
            Welcome back, <span style={{ color: '#CF0A0A', fontWeight: 700 }}>Admin</span> 👋
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}
            />
            <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>Live</span>
          </div>
        </motion.div>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ padding: '24px' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

export default AdminLayout