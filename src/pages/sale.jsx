import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Tag, Loader2 } from 'lucide-react'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'

function Sale() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch only ACTIVE discounts
  useEffect(() => {
    const q = query(
      collection(db, 'discounts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDiscounts(data)
      setLoading(false)
    }, (error) => {
      console.error('Sale fetch error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#EEEEEE' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a0000, #CF0A0A)', padding: '20px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.1 }} style={{ color: 'white', cursor: 'pointer' }}>
                <ArrowLeft size={24} />
              </motion.div>
            </Link>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'white' }}>
                🔥 Mega <span style={{ color: '#B8960C' }}>Sale</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Up to 50% OFF on selected items</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '20px' }}>
            <Tag size={16} style={{ color: '#B8960C' }} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{discounts.length} Deals</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
            <Loader2 size={40} style={{ margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite', color: '#CF0A0A' }} />
            <p style={{ fontSize: '14px' }}>Loading deals...</p>
          </div>
        ) : (
          <>
            {discounts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '80px 20px', color: '#EEEEEE33' }}>
                <Tag size={64} style={{ margin: '0 auto 20px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '20px', fontWeight: 700 }}>No Active Sales</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Check back later for amazing deals!</p>
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    style={{ marginTop: '20px', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Back to Home
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {discounts.map((disc, i) => (
                  <motion.div
                    key={disc.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 180 }}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(207,10,10,0.3)' }}
                    style={{
                      backgroundColor: '#111',
                      border: '1px solid #CF0A0A33',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {/* Discount Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#CF0A0A',
                      color: 'white',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 900,
                      zIndex: 10,
                      boxShadow: '0 4px 15px rgba(207,10,10,0.5)'
                    }}>
                      -{disc.discountPercent}% OFF
                    </div>

                    {/* Product Image Placeholder */}
                    <div style={{
                      height: '200px',
                      background: 'linear-gradient(135deg, #1a1a1a, #2a0000)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '80px'
                    }}>
                      📱
                    </div>

                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>{disc.productName}</h3>
                      
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '12px', marginBottom: '8px' }}>
                        <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '24px' }}>
                          Rs. {disc.salePrice?.toLocaleString()}
                        </span>
                        <span style={{ color: '#EEEEEE33', fontSize: '16px', textDecoration: 'line-through' }}>
                          Rs. {disc.originalPrice?.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                        <div style={{ backgroundColor: '#22c55e22', color: '#22c55e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                          You Save Rs. {(disc.originalPrice - disc.salePrice)?.toLocaleString()}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: '0 0 20px #CF0A0A66' }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          width: '100%',
                          backgroundColor: '#CF0A0A',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '14px',
                          fontWeight: 700,
                          fontSize: '15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <ShoppingCart size={18} /> Add to Cart
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Sale