import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import {
  ShoppingCart, Package, Truck, CheckCircle,
  XCircle, DollarSign, TrendingUp, Users, Loader2,
  Boxes, PiggyBank, BarChart3
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

const statusColor = {
  Pending: { bg: '#f59e0b22', color: '#f59e0b' },
  Approved: { bg: '#3b82f622', color: '#3b82f6' },
  Dispatched: { bg: '#DC5F0022', color: '#DC5F00' },
  Delivered: { bg: '#22c55e22', color: '#22c55e' },
  Cancelled: { bg: '#CF0A0A22', color: '#CF0A0A' },
}

function AnimatedCounter({ target, prefix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 80
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 15)
    return () => clearInterval(timer)
  }, [target])
  return <span>{prefix}{count.toLocaleString()}</span>
}

function Dashboard() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ Fetch real orders from Firestore
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }))
      setOrders(ordersData)
      setLoading(false)
    }, (error) => {
      console.error('Dashboard orders fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ✅ Fetch real products from Firestore
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }))
      setProducts(productsData)
    }, (error) => {
      console.error('Dashboard products fetch error:', error)
    })

    return () => unsubscribe()
  }, [])

  // ✅ ORDERS STATS
  const totalOrders = orders.length
  const pendingCount = orders.filter(o => o.status === 'Pending').length
  const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length
  const cancelledCount = orders.filter(o => o.status === 'Cancelled').length
  const approvedCount = orders.filter(o => o.status === 'Approved').length
  const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((a, o) => a + (o.totalPrice || 0), 0)
  
  const now = new Date()
  const thisMonthRevenue = orders
    .filter(o => o.status === 'Delivered' && o.createdAt && new Date(o.createdAt).getMonth() === now.getMonth() && new Date(o.createdAt).getFullYear() === now.getFullYear())
    .reduce((a, o) => a + (o.totalPrice || 0), 0)

  const uniqueCustomers = new Set(orders.map(o => o.phone || o.customerName)).size

  // ✅ PRODUCTS STATS
  const totalProducts = products.length
  const totalStock = products.reduce((a, p) => a + (p.stock || 0), 0)
  const totalInventoryValue = products.reduce((a, p) => a + ((p.price || p.unitPrice || 0) * (p.stock || 0)), 0)
  
  // Calculate potential profit (assuming profit is stored or using a default margin)
  const totalPotentialProfit = products.reduce((a, p) => {
    const price = p.price || p.unitPrice || 0
    const stock = p.stock || 0
    // If product has profitPct field, use it; otherwise assume 20% margin
    const profitMargin = (p.profitPct || p.profitPercentage || 20) / 100
    return a + (price * stock * profitMargin)
  }, 0)

  const stats = [
    // ORDERS ROW
    { icon: <ShoppingCart size={20} />, label: 'Total Orders', value: totalOrders, prefix: '', color: '#3b82f6', bg: '#3b82f615' },
    { icon: <Package size={20} />, label: 'Pending', value: pendingCount, prefix: '', color: '#f59e0b', bg: '#f59e0b15' },
    { icon: <Truck size={20} />, label: 'Dispatched', value: dispatchedCount, prefix: '', color: '#DC5F00', bg: '#DC5F0015' },
    { icon: <CheckCircle size={20} />, label: 'Delivered', value: deliveredCount, prefix: '', color: '#22c55e', bg: '#22c55e15' },
    { icon: <XCircle size={20} />, label: 'Cancelled', value: cancelledCount, prefix: '', color: '#CF0A0A', bg: '#CF0A0A15' },
    { icon: <DollarSign size={20} />, label: 'Revenue', value: totalRevenue, prefix: 'Rs.', color: '#B8960C', bg: '#B8960C15' },
    { icon: <TrendingUp size={20} />, label: 'This Month', value: thisMonthRevenue, prefix: 'Rs.', color: '#CF0A0A', bg: '#CF0A0A15' },
    { icon: <Users size={20} />, label: 'Customers', value: uniqueCustomers, prefix: '', color: '#8b5cf6', bg: '#8b5cf615' },
    
    // PRODUCTS ROW (NEW)
    { icon: <Boxes size={20} />, label: 'Total Products', value: totalProducts, prefix: '', color: '#06b6d4', bg: '#06b6d415' },
    { icon: <Package size={20} />, label: 'Total Stock', value: totalStock, prefix: '', color: '#ec4899', bg: '#ec489915' },
    { icon: <BarChart3 size={20} />, label: 'Inventory Value', value: totalInventoryValue, prefix: 'Rs.', color: '#14b8a6', bg: '#14b8a615' },
    { icon: <PiggyBank size={20} />, label: 'Potential Profit', value: totalPotentialProfit, prefix: 'Rs.', color: '#f97316', bg: '#f9731615' },
  ]

  // Order status pie chart
  const orderStatusData = [
    { name: 'Delivered', value: deliveredCount, color: '#22c55e' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Approved', value: approvedCount, color: '#3b82f6' },
    { name: 'Dispatched', value: dispatchedCount, color: '#DC5F00' },
    { name: 'Cancelled', value: cancelledCount, color: '#CF0A0A' },
  ].filter(item => item.value > 0)

  // Product categories pie chart (NEW)
  const getProductCategories = () => {
    const cats = {}
    products.forEach(p => {
      const cat = p.category || p.productCategory || 'Uncategorized'
      if (!cats[cat]) cats[cat] = 0
      cats[cat] += (p.price || p.unitPrice || 0) * (p.stock || 0)
    })
    const colors = ['#CF0A0A', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#DC5F00', '#06b6d4', '#B8960C']
    return Object.entries(cats).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    })).filter(d => d.value > 0)
  }

  const productCategoryData = getProductCategories()

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData = months.map((month, idx) => {
      const monthOrders = orders.filter(o => 
        o.status === 'Delivered' && 
        o.createdAt && 
        new Date(o.createdAt).getMonth() === idx &&
        new Date(o.createdAt).getFullYear() === now.getFullYear()
      )
      const revenue = monthOrders.reduce((a, o) => a + (o.totalPrice || 0), 0)
      const orderCount = orders.filter(o => 
        o.createdAt && 
        new Date(o.createdAt).getMonth() === idx &&
        new Date(o.createdAt).getFullYear() === now.getFullYear()
      ).length
      return { month, revenue, orders: orderCount }
    })
    return monthlyData
  }

  const revenueData = getMonthlyData()
  const recentOrders = orders.slice(0, 5)

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A'
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput)
    return date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
  }

  return (
    <AdminLayout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: '1400px', width: '100%' }}>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '20px' }}
        >
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 900, marginBottom: '2px' }}>
            Admin <span style={{ color: '#CF0A0A' }}>Dashboard</span>
          </h1>
          <p style={{ color: '#EEEEEE44', fontSize: '12px' }}>Store performance overview</p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
            <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
            <p style={{ fontSize: '14px' }}>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* ===== ORDERS STATS ROW ===== */}
            <div style={{ marginBottom: '8px' }}>
              <p style={{ color: '#EEEEEE33', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>ORDERS OVERVIEW</p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px',
              marginBottom: '20px'
            }}>
              {stats.slice(0, 8).map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 180 }}
                  whileHover={{ y: -3, boxShadow: `0 6px 20px ${stat.color}25` }}
                  style={{
                    backgroundColor: '#111111',
                    border: `1px solid ${stat.color}25`,
                    borderRadius: '12px',
                    padding: '14px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '-10px', right: '-10px',
                    width: '50px', height: '50px', borderRadius: '50%',
                    backgroundColor: stat.bg, filter: 'blur(12px)'
                  }} />
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '10px'
                  }}>
                    <div style={{
                      backgroundColor: stat.bg, padding: '7px',
                      borderRadius: '8px', color: stat.color
                    }}>
                      {stat.icon}
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: stat.color }}
                    />
                  </div>
                  <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 900, color: stat.color, marginBottom: '2px' }}>
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} />
                  </p>
                  <p style={{ color: '#EEEEEE44', fontSize: '11px' }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* ===== PRODUCTS STATS ROW (NEW) ===== */}
            <div style={{ marginBottom: '8px', marginTop: '24px' }}>
              <p style={{ color: '#EEEEEE33', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '10px' }}>INVENTORY OVERVIEW</p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px',
              marginBottom: '20px'
            }}>
              {stats.slice(8, 12).map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: (i + 8) * 0.06, type: 'spring', stiffness: 180 }}
                  whileHover={{ y: -3, boxShadow: `0 6px 20px ${stat.color}25` }}
                  style={{
                    backgroundColor: '#111111',
                    border: `1px solid ${stat.color}25`,
                    borderRadius: '12px',
                    padding: '14px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '-10px', right: '-10px',
                    width: '50px', height: '50px', borderRadius: '50%',
                    backgroundColor: stat.bg, filter: 'blur(12px)'
                  }} />
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '10px'
                  }}>
                    <div style={{
                      backgroundColor: stat.bg, padding: '7px',
                      borderRadius: '8px', color: stat.color
                    }}>
                      {stat.icon}
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: (i + 8) * 0.2 }}
                      style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: stat.color }}
                    />
                  </div>
                  <p style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 900, color: stat.color, marginBottom: '2px' }}>
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} />
                  </p>
                  <p style={{ color: '#EEEEEE44', fontSize: '11px' }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px',
              marginBottom: '14px'
            }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #CF0A0A22',
                  borderRadius: '14px', padding: '16px'
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Revenue Trend</p>
                <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '14px' }}>Monthly overview</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#CF0A0A" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#CF0A0A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE0A" />
                    <XAxis dataKey="month" stroke="#EEEEEE22" tick={{ fill: '#EEEEEE44', fontSize: 10 }} />
                    <YAxis stroke="#EEEEEE22" tick={{ fill: '#EEEEEE44', fontSize: 10 }} width={45} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #CF0A0A33', borderRadius: '8px', color: '#EEEEEE', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#CF0A0A" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #DC5F0022',
                  borderRadius: '14px', padding: '16px'
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Monthly Orders</p>
                <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '14px' }}>Order count per month</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE0A" />
                    <XAxis dataKey="month" stroke="#EEEEEE22" tick={{ fill: '#EEEEEE44', fontSize: 10 }} />
                    <YAxis stroke="#EEEEEE22" tick={{ fill: '#EEEEEE44', fontSize: 10 }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #DC5F0033', borderRadius: '8px', color: '#EEEEEE', fontSize: '12px' }} />
                    <Bar dataKey="orders" fill="#DC5F00" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Bottom Row - Order Status + Product Categories + Recent Orders */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '14px'
            }}>
              {/* Order Status Donut */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #B8960C22',
                  borderRadius: '14px', padding: '16px'
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Order Status</p>
                <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '8px' }}>Breakdown</p>
                {orderStatusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%" cy="50%"
                          innerRadius={45} outerRadius={68}
                          paddingAngle={4} dataKey="value"
                        >
                          {orderStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #33333344', borderRadius: '8px', color: '#EEEEEE', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                      {orderStatusData.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '6px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                            <span style={{ color: '#EEEEEE77', fontSize: '11px' }}>{item.name}</span>
                          </div>
                          <span style={{ color: item.color, fontSize: '11px', fontWeight: 700 }}>{item.value}</span>
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

              {/* Product Categories Donut (NEW) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #14b8a622',
                  borderRadius: '14px', padding: '16px'
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Inventory by Category</p>
                <p style={{ color: '#EEEEEE33', fontSize: '11px', marginBottom: '8px' }}>Value distribution</p>
                {productCategoryData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={productCategoryData}
                          cx="50%" cy="50%"
                          innerRadius={45} outerRadius={68}
                          paddingAngle={4} dataKey="value"
                        >
                          {productCategoryData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #33333344', borderRadius: '8px', color: '#EEEEEE', fontSize: '12px' }}
                          formatter={(val) => [`Rs. ${val.toLocaleString()}`, 'Value']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                      {productCategoryData.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '6px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                            <span style={{ color: '#EEEEEE77', fontSize: '11px' }}>{item.name}</span>
                          </div>
                          <span style={{ color: item.color, fontSize: '11px', fontWeight: 700 }}>Rs.{(item.value / 1000).toFixed(0)}k</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#EEEEEE33' }}>
                    <p style={{ fontSize: '13px' }}>No products available</p>
                  </div>
                )}
              </motion.div>

              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #CF0A0A22',
                  borderRadius: '14px', padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Recent Orders</p>
                    <p style={{ color: '#EEEEEE33', fontSize: '11px' }}>Latest incoming</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    style={{ backgroundColor: '#CF0A0A22', color: '#CF0A0A', border: '1px solid #CF0A0A33', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                  >View All</motion.button>
                </div>

                {recentOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentOrders.map((order, i) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.07 }}
                        whileHover={{ backgroundColor: '#1a1a1a' }}
                        style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px', borderRadius: '10px',
                          border: '1px solid #EEEEEE08',
                          cursor: 'pointer', transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div style={{
                            backgroundColor: '#CF0A0A22', color: '#CF0A0A',
                            padding: '6px 8px', borderRadius: '7px',
                            fontSize: '10px', fontWeight: 700, flexShrink: 0
                          }}>
                            #{order.id.slice(-6).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customerName || 'Unknown'}</p>
                            <p style={{ color: '#EEEEEE44', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.productName || 'Unknown Product'}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                          <p style={{ color: '#B8960C', fontWeight: 700, fontSize: '12px' }}>Rs.{(order.totalPrice || 0).toLocaleString()}</p>
                          <span style={{
                            backgroundColor: statusColor[order.status]?.bg,
                            color: statusColor[order.status]?.color,
                            fontSize: '9px', fontWeight: 700,
                            padding: '2px 7px', borderRadius: '20px',
                            display: 'inline-block', marginTop: '2px'
                          }}>{order.status || 'Pending'}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#EEEEEE33' }}>
                    <p style={{ fontSize: '13px' }}>No recent orders</p>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default Dashboard