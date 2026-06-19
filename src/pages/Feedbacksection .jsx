import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Send, User, Camera, MessageSquare, Quote } from 'lucide-react'
import { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

// ===== Helper: "x time ago" formatter =====
function timeAgo(timestamp) {
  if (!timestamp) return 'Just now'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

// ===== Helper: convert image file to base64 (Firestore-only, no Storage needed) =====
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function FeedbackCard({ fb }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 150 }}
      style={{
        flex: '0 0 auto',
        width: '260px',
        backgroundColor: '#111111',
        border: '1px solid #222222',
        borderRadius: '16px',
        padding: '16px',
        scrollSnapAlign: 'start',
        position: 'relative',
      }}
    >
      <Quote size={28} style={{ color: '#CF0A0A22', position: 'absolute', top: '12px', right: '12px' }} />

      {/* Header: avatar + name + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#CF0A0A22',
            border: '1px solid #CF0A0A55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#CF0A0A',
            fontWeight: 800,
            fontSize: '15px',
          }}
        >
          {fb.name ? fb.name.charAt(0).toUpperCase() : <User size={16} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              color: '#EEEEEE',
              fontSize: '13px',
              fontWeight: 700,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {fb.name || 'Anonymous'}
          </p>
          <p style={{ color: '#EEEEEE44', fontSize: '10px', margin: '1px 0 0 0' }}>{timeAgo(fb.createdAt)}</p>
        </div>
      </div>

      {/* Photo (optional) */}
      {fb.photoUrl && (
        <div
          style={{
            width: '100%',
            height: '120px',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '10px',
            backgroundColor: '#1a1a1a',
          }}
        >
          <img src={fb.photoUrl} alt="feedback" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Text */}
      <p
        style={{
          color: '#EEEEEE99',
          fontSize: '12.5px',
          lineHeight: 1.5,
          marginBottom: '10px',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {fb.text}
      </p>

      {/* Rating */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={13}
            fill={i < (fb.rating || 0) ? '#B8960C' : 'none'}
            style={{ color: '#B8960C' }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function FeedbackSubmitModal({ open, onClose }) {
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setName('')
    setText('')
    setRating(5)
    setPhotoFile(null)
    setPhotoPreview(null)
    setDone(false)
    setError('')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Photo size 1.5MB se kam honi chahiye')
      return
    }
    setError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) {
      setError('Naam aur feedback likhna zaroori hai')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      let photoUrl = null
      if (photoFile) {
        photoUrl = await fileToBase64(photoFile)
      }
      await addDoc(collection(db, 'feedbacks'), {
        name: name.trim(),
        text: text.trim(),
        rating,
        photoUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setDone(true)
    } catch (err) {
      console.error('Feedback submit error:', err)
      setError('Submit nahi ho saka, dobara try karein')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(resetForm, 300)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#111111',
              border: '1px solid #CF0A0A33',
              borderRadius: '20px',
              padding: '24px',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#EEEEEE', fontSize: '17px', fontWeight: 800, margin: 0 }}>
                {done ? 'Shukriya! 🎉' : 'Apna Feedback Dein'}
              </p>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                style={{
                  background: '#1a1a1a',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#EEEEEE88',
                }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '46px', marginBottom: '10px' }}>✅</p>
                <p style={{ color: '#EEEEEE99', fontSize: '13px', lineHeight: 1.6 }}>
                  Aapka feedback admin review k baad public show hoga. Shukriya!
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClose}
                  style={{
                    marginTop: '16px',
                    backgroundColor: '#CF0A0A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '10px 26px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Theek hai
                </motion.button>
              </div>
            ) : (
              <>
                {/* Name */}
                <label style={{ color: '#EEEEEE66', fontSize: '11px', fontWeight: 600, marginBottom: '5px', display: 'block' }}>
                  Aapka Naam
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmad Khan"
                  style={{
                    width: '100%',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#EEEEEE',
                    fontSize: '13px',
                    outline: 'none',
                    marginBottom: '14px',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Rating */}
                <label style={{ color: '#EEEEEE66', fontSize: '11px', fontWeight: 600, marginBottom: '5px', display: 'block' }}>
                  Rating
                </label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.div
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Star
                        size={26}
                        fill={star <= (hoverRating || rating) ? '#B8960C' : 'none'}
                        style={{ color: '#B8960C' }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Text */}
                <label style={{ color: '#EEEEEE66', fontSize: '11px', fontWeight: 600, marginBottom: '5px', display: 'block' }}>
                  Feedback
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Apna tajurba batayein..."
                  rows={4}
                  style={{
                    width: '100%',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#EEEEEE',
                    fontSize: '13px',
                    outline: 'none',
                    marginBottom: '14px',
                    resize: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />

                {/* Photo upload */}
                <label style={{ color: '#EEEEEE66', fontSize: '11px', fontWeight: 600, marginBottom: '5px', display: 'block' }}>
                  Photo (Optional)
                </label>
                <label
                  htmlFor="feedback-photo-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#1a1a1a',
                    border: '1px dashed #444',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    marginBottom: '16px',
                  }}
                >
                  <Camera size={16} style={{ color: '#CF0A0A' }} />
                  <span style={{ color: '#EEEEEE66', fontSize: '12px' }}>
                    {photoFile ? photoFile.name : 'Photo select karein'}
                  </span>
                  <input
                    id="feedback-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </label>

                {photoPreview && (
                  <div style={{ marginBottom: '16px', position: 'relative', width: 'fit-content' }}>
                    <img
                      src={photoPreview}
                      alt="preview"
                      style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        backgroundColor: '#CF0A0A',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}

                {error && (
                  <p style={{ color: '#DC5F00', fontSize: '12px', marginBottom: '12px' }}>{error}</p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px #CF0A0A66' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    backgroundColor: '#CF0A0A',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {submitting ? 'Submit ho raha hai...' : <>Submit Karein <Send size={15} /></>}
                </motion.button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, 'feedbacks'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setFeedbacks(list)
        setLoading(false)
      },
      (error) => {
        console.error('Feedback fetch error:', error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  return (
    <section className="py-16 px-6" style={{ position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#CF0A0A22',
            border: '1px solid #CF0A0A55',
            color: '#CF0A0A',
            padding: '5px 16px',
            borderRadius: '50px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '2px',
            marginBottom: '14px',
          }}
        >
          <MessageSquare size={12} /> CUSTOMER FEEDBACK
        </motion.div>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, marginBottom: '8px' }}>
          What Our <span style={{ color: '#CF0A0A' }}>Customers</span> Say
        </h2>
        <p style={{ color: '#EEEEEE55', fontSize: '14px', marginBottom: '18px' }}>
          Real reviews from real customers
        </p>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 25px #CF0A0A66' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setModalOpen(true)}
          style={{
            backgroundColor: '#CF0A0A',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '11px 26px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Share Your Feedback <MessageSquare size={14} />
        </motion.button>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '30px',
              height: '30px',
              border: '3px solid #CF0A0A',
              borderTopColor: 'transparent',
              borderRadius: '50%',
            }}
          />
        </div>
      ) : feedbacks.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#EEEEEE33', fontSize: '13px' }}>
          Abhi tak koi feedback nahi — sab se pehle aap dein!
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            padding: '4px 16px 16px',
            scrollSnapType: 'x mandatory',
            maxWidth: '1152px',
            margin: '0 auto',
          }}
          className="hide-scrollbar"
        >
          {feedbacks.map((fb) => (
            <FeedbackCard key={fb.id} fb={fb} />
          ))}
        </div>
      )}

      <FeedbackSubmitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  )
}

export default FeedbackSection