import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Trash2, Star, Clock, User, Image as ImageIcon, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, where, serverTimestamp } from 'firebase/firestore'

function timeAgo(timestamp) {
  if (!timestamp) return 'Just now'
  const now = new Date()
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? 's' : ''} ago`
}

// ✅ ALWAYS use 'feedbacks' collection everywhere
const COLLECTION = 'feedbacks'

function AdminReviews() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    // ✅ Always query 'feedbacks', filter client-side to avoid index issues
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      if (filter === 'all') {
        setReviews(all)
      } else {
        setReviews(all.filter(r => (r.status || 'pending') === filter))
      }
      setLoading(false)
    }, (error) => {
      console.error('Reviews listener error:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [filter])

  const handleApprove = async (id) => {
    setProcessing(prev => ({ ...prev, [id]: 'approving' }))
    try {
      await updateDoc(doc(db, COLLECTION, id), {
        status: 'approved',
        approvedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Approve error:', err)
      alert('Failed to approve: ' + err.message)
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }))
    }
  }

  const handleReject = async (id) => {
    setProcessing(prev => ({ ...prev, [id]: 'rejecting' }))
    try {
      await updateDoc(doc(db, COLLECTION, id), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Reject error:', err)
      alert('Failed to reject: ' + err.message)
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this review?')) return
    setProcessing(prev => ({ ...prev, [id]: 'deleting' }))
    try {
      await deleteDoc(doc(db, COLLECTION, id))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete: ' + err.message)
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }))
    }
  }

  // Count from full list — load all then filter
  const [allReviews, setAllReviews] = useState([])
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setAllReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const pendingCount = allReviews.filter(r => (r.status || 'pending') === 'pending').length
  const approvedCount = allReviews.filter(r => r.status === 'approved').length
  const rejectedCount = allReviews.filter(r => r.status === 'rejected').length
  const totalCount = allReviews.length

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#EEEEEE', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '4px' }}>
              Customer <span style={{ color: '#CF0A0A' }}>Reviews</span>
            </h1>
            <p style={{ color: '#EEEEEE55', fontSize: '13px' }}>Manage and approve customer feedback</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/admin/dashboard')}
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#EEEEEE', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            ← Dashboard
          </motion.button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Total', value: totalCount, color: '#CF0A0A', icon: '📊' },
            { label: 'Pending', value: pendingCount, color: '#DC5F00', icon: '⏳' },
            { label: 'Approved', value: approvedCount, color: '#22c55e', icon: '✅' },
            { label: 'Rejected', value: rejectedCount, color: '#EF4444', icon: '❌' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: stat.color + '22', border: `1px solid ${stat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ color: '#EEEEEE55', fontSize: '12px', margin: '0 0 2px' }}>{stat.label}</p>
                <p style={{ color: stat.color, fontSize: '28px', fontWeight: 900, margin: 0 }}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Reviews', count: totalCount },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'approved', label: 'Approved', count: approvedCount },
            { key: 'rejected', label: 'Rejected', count: rejectedCount },
          ].map((tab) => (
            <motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setFilter(tab.key)}
              style={{ padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, backgroundColor: filter === tab.key ? '#CF0A0A' : '#1a1a1a', color: filter === tab.key ? 'white' : '#EEEEEE88', border: filter === tab.key ? '1px solid #CF0A0A' : '1px solid #333', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              {tab.label}
              <span style={{ backgroundColor: filter === tab.key ? 'rgba(255,255,255,0.25)' : '#333', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: '44px', height: '44px', border: '3px solid #CF0A0A', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
            <p style={{ color: '#EEEEEE44' }}>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#EEEEEE33' }}>
            <p style={{ fontSize: '50px', marginBottom: '12px' }}>📭</p>
            <p style={{ fontSize: '18px', fontWeight: 700 }}>No reviews found</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>
              {filter === 'pending' ? 'No pending reviews' : filter === 'approved' ? 'No approved reviews yet' : filter === 'rejected' ? 'No rejected reviews' : 'No reviews submitted yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AnimatePresence>
              {reviews.map((review, i) => (
                <motion.div key={review.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -80, scale: 0.95 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 120 }}
                  style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '18px', padding: '22px', position: 'relative' }}>

                  {/* Status badge */}
                  <div style={{ position: 'absolute', top: '18px', right: '18px', padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', backgroundColor: review.status === 'approved' ? '#22c55e22' : review.status === 'rejected' ? '#EF444422' : '#DC5F0022', color: review.status === 'approved' ? '#22c55e' : review.status === 'rejected' ? '#EF4444' : '#DC5F00', border: `1px solid ${review.status === 'approved' ? '#22c55e44' : review.status === 'rejected' ? '#EF444444' : '#DC5F0044'}` }}>
                    {review.status || 'pending'}
                  </div>

                  {/* User row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#CF0A0A22', border: '2px solid #CF0A0A44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={24} style={{ color: '#CF0A0A' }} />
                    </div>
                    <div>
                      <p style={{ color: '#EEEEEE', fontSize: '17px', fontWeight: 800, margin: '0 0 4px' }}>
                        {review.name || 'Anonymous'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={14} fill={j < (review.rating || 5) ? '#B8960C' : 'none'} style={{ color: '#B8960C' }} />
                          ))}
                        </div>
                        <span style={{ color: '#B8960C', fontSize: '13px', fontWeight: 800 }}>{review.rating || 5}/5</span>
                        <span style={{ color: '#EEEEEE33' }}>|</span>
                        <span style={{ color: '#EEEEEE44', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {timeAgo(review.createdAt)}
                        </span>
                        {review.approvedAt && (
                          <span style={{ color: '#22c55e', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={11} /> Approved {timeAgo(review.approvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review text */}
                  <p style={{ color: '#EEEEEEcc', fontSize: '15px', lineHeight: 1.7, margin: '0 0 14px', padding: '14px 16px', backgroundColor: '#0a0a0a', borderRadius: '10px', border: '1px solid #222' }}>
                    "{review.text || 'No review text'}"
                  </p>

                  {/* Photo */}
                  {review.imageUrl && (
                    <div style={{ width: '200px', height: '150px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', marginBottom: '14px', position: 'relative' }}>
                      <img src={review.imageUrl} alt="Review" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ImageIcon size={11} style={{ color: '#EEEEEE' }} />
                        <span style={{ color: '#EEEEEE', fontSize: '10px', fontWeight: 600 }}>Photo</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(review.status === 'pending' || !review.status) && (
                      <>
                        <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 15px #22c55e44' }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleApprove(review.id)} disabled={!!processing[review.id]}
                          style={{ flex: 1, backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', cursor: processing[review.id] ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: processing[review.id] ? 0.6 : 1 }}>
                          {processing[review.id] === 'approving'
                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            : <ThumbsUp size={16} />}
                          {processing[review.id] === 'approving' ? 'Approving...' : 'Approve'}
                        </motion.button>

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleReject(review.id)} disabled={!!processing[review.id]}
                          style={{ flex: 1, backgroundColor: 'transparent', color: '#EF4444', border: '2px solid #EF4444', borderRadius: '10px', padding: '12px', cursor: processing[review.id] ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: processing[review.id] ? 0.6 : 1 }}>
                          {processing[review.id] === 'rejecting'
                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ width: '16px', height: '16px', border: '2px solid #EF4444', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            : <ThumbsDown size={16} />}
                          {processing[review.id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                        </motion.button>
                      </>
                    )}

                    {review.status === 'approved' && (
                      <>
                        <div style={{ flex: 1, backgroundColor: '#22c55e11', border: '1px solid #22c55e33', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#22c55e', fontSize: '14px', fontWeight: 700 }}>
                          <Check size={16} /> Approved & Live
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDelete(review.id)} disabled={!!processing[review.id]}
                          style={{ backgroundColor: 'transparent', color: '#CF0A0A', border: '1px solid #CF0A0A44', borderRadius: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Trash2 size={15} /> Delete
                        </motion.button>
                      </>
                    )}

                    {review.status === 'rejected' && (
                      <>
                        <div style={{ flex: 1, backgroundColor: '#EF444411', border: '1px solid #EF444433', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#EF4444', fontSize: '14px', fontWeight: 700 }}>
                          <X size={16} /> Rejected
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleApprove(review.id)} disabled={!!processing[review.id]}
                          style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ThumbsUp size={15} /> Approve Instead
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDelete(review.id)} disabled={!!processing[review.id]}
                          style={{ backgroundColor: 'transparent', color: '#CF0A0A', border: '1px solid #CF0A0A44', borderRadius: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Trash2 size={15} /> Delete
                        </motion.button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminReviews