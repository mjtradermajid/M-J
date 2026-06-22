import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowRight, Truck, Shield, Headphones, ChevronRight, Zap, Heart, Star, Search, X, MessageCircle, Send, ImagePlus, Clock, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase/config'
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'

import junaidDp from '../assets/junaiddp.png'
import majidDp from '../assets/majiddp.png'

// ===== HERO CAROUSEL IMAGES =====
import heroPc from '../assets/pc.jpg'
import heroPhones from '../assets/phones.jpg'
import heroPix from '../assets/pix.jpg'
import heroPods from '../assets/pods.jpg'
import heroPower from '../assets/power.jpg'
import heroWatch from '../assets/watch.jpg'

const carouselSlides = [
  { img: heroPhones, label: ' IPhones',      accent: '#CF0A0A' },
  { img: heroPc,     label: 'Laptops & PCs',accent: '#3b82f6' },
  { img: heroWatch,  label: 'Smart Watches', accent: '#B8960C' },
  { img: heroPods,   label: 'Audio & Pods',  accent: '#8b5cf6' },
  { img: heroPower,  label: 'Power Banks',   accent: '#22c55e' },
  { img: heroPix,    label: 'Google Pixels',   accent: '#DC5F00' },
]

const SLIDE_INTERVAL = 3500

const features = [
  { icon: <Truck size={28} />,     title: 'Fast Delivery', desc: '1-3 days nationwide' },
  { icon: <Shield size={28} />,    title: '100% Original', desc: 'Genuine products only' },
  { icon: <Headphones size={28} />,title: '24/7 Support',  desc: 'Always here for you' },
  { icon: <Zap size={28} />,       title: 'Best Prices',   desc: 'Unbeatable deals daily' },
]

const heroWords = ['Electronics', 'Appliances', 'Mobiles', 'Laptops']

const supportNumbers = [
  { name: 'Junaid Ahmad', number: '923487085930', label: 'Sales Support',  role: 'Sales Manager',   avatar: junaidDp },
  { name: 'Abdul Majid',  number: '923259364309', label: 'Order Help',     role: 'Support Manager', avatar: majidDp  },
]

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 20)
    return () => clearInterval(timer)
  }, [target])
  return <span>{count}{suffix}</span>
}

function timeAgo(timestamp) {
  if (!timestamp) return 'Just now'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const seconds = Math.floor((Date.now() - date) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}

// ===== 3D COVERFLOW HERO CAROUSEL =====
function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const total = carouselSlides.length

  const startTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % total)
    }, SLIDE_INTERVAL)
  }

  useEffect(() => {
    startTimer()
    return () => clearInterval(timerRef.current)
  }, [])

  const goTo = (idx) => {
    setCurrent((idx + total) % total)
    startTimer()
  }

  const getRelPos = (idx) => {
    let diff = idx - current
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return diff
  }

  const slide = carouselSlides[current]

  const getCardStyle = (relPos) => {
    const abs = Math.abs(relPos)
    if (abs > 2) return null
    const xPct   = relPos * 48
    const scale  = abs === 0 ? 1 : abs === 1 ? 0.70 : 0.50
    const zIndex = 10 - abs
    const opacity= abs === 0 ? 1 : abs === 1 ? 0.65 : 0.35
    const rotateY= relPos * -20
    const blur   = abs >= 2 ? 2 : 0
    return {
      position: 'absolute',
      left: '50%', top: '50%',
      width: '280px', height: '340px',
      transform: `translate(-50%,-50%) translateX(${xPct}%) scale(${scale}) rotateY(${rotateY}deg)`,
      zIndex, opacity,
      filter: blur > 0 ? `blur(${blur}px)` : 'none',
      transition: 'all 0.55s cubic-bezier(0.32,0.72,0,1)',
      cursor: relPos !== 0 ? 'pointer' : 'default',
      borderRadius: '20px',
      overflow: 'hidden',
    }
  }

  return (
    <div style={{
      flex: '1 1 300px',
      position: 'relative',
      height: '420px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '1100px',
      perspectiveOrigin: '50% 50%',
    }}>
      {/* Dynamic glow */}
      <motion.div
        key={`glow-${current}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'absolute',
          width: '360px', height: '360px', borderRadius: '50%',
          background: `radial-gradient(circle, ${slide.accent}66 0%, transparent 70%)`,
          filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* Cards */}
      <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
        {carouselSlides.map((s, idx) => {
          const relPos = getRelPos(idx)
          const cardStyle = getCardStyle(relPos)
          if (!cardStyle) return null
          return (
            <div key={idx} style={cardStyle} onClick={() => relPos !== 0 && goTo(idx)}>
              <img src={s.img} alt={s.label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', display: 'block' }}
              />
              {relPos === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: s.accent + 'cc', backdropFilter: 'blur(10px)',
                    color: 'white', padding: '6px 20px', borderRadius: '50px',
                    fontSize: '13px', fontWeight: 800, letterSpacing: '1px',
                    whiteSpace: 'nowrap', border: `1px solid ${s.accent}`,
                  }}
                >
                  {s.label}
                </motion.div>
              )}
              {relPos !== 0 && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: '20px' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Arrows */}
      <motion.button
        whileHover={{ scale: 1.15, backgroundColor: slide.accent }} whileTap={{ scale: 0.9 }}
        onClick={() => goTo(current - 1)}
        style={{
          position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#1a1a1acc', border: `1px solid ${slide.accent}55`,
          color: '#EEEEEE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.15, backgroundColor: slide.accent }} whileTap={{ scale: 0.9 }}
        onClick={() => goTo(current + 1)}
        style={{
          position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#1a1a1acc', border: `1px solid ${slide.accent}55`,
          color: '#EEEEEE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <ChevronRight size={18} />
      </motion.button>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '7px', zIndex: 20 }}>
        {carouselSlides.map((s, i) => (
          <motion.button key={i} onClick={() => goTo(i)}
            animate={{ width: i === current ? 22 : 7, backgroundColor: i === current ? s.accent : '#EEEEEE33' }}
            transition={{ duration: 0.3 }}
            style={{ height: '7px', borderRadius: '50px', border: 'none', cursor: 'pointer', padding: 0 }}
          />
        ))}
      </div>

      {/* Progress bar */}
      
    </div>
  )
}

// ===== MAIN HOME COMPONENT =====
function Home() {
  const [currentWord, setCurrentWord]         = useState(0)
  const [cartCount, setCartCount]             = useState(0)
  const [wishlist, setWishlist]               = useState([])
  const [allProducts, setAllProducts]         = useState([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [activeCategory, setActiveCategory]   = useState('All')
  const [showHelp, setShowHelp]               = useState(false)
  const [windowWidth, setWindowWidth]         = useState(window.innerWidth)

  const [feedbacks, setFeedbacks]             = useState([])
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackName, setFeedbackName]       = useState('')
  const [feedbackText, setFeedbackText]       = useState('')
  const [feedbackRating, setFeedbackRating]   = useState(5)
  const [feedbackImage, setFeedbackImage]     = useState(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const navigate = useNavigate()
  const feedbackScrollRef = useRef(null)

  const scrollFeedbacks = (dir) => {
    if (!feedbackScrollRef.current) return
    feedbackScrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  useEffect(() => {
    const interval = setInterval(() => setCurrentWord(p => (p + 1) % heroWords.length), 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(c.reduce((s, i) => s + (i.qty || 1), 0))
    } catch { setCartCount(0) }
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const approved = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(f => f.status === 'approved')
        .sort((a, b) => {
          const ta = a.approvedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0)
          const tb = b.approvedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0)
          return tb - ta
        })
      setFeedbacks(approved)
    }, err => console.error('Feedback listener error:', err))
    return () => unsub()
  }, [])

  const toggleWishlist = id => setWishlist(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleOrderNow = (product, e) => {
    e.stopPropagation()
    navigate('/order', { state: { product, fromHome: true } })
  }

  const handleAddToCart = (product, e) => {
    e.stopPropagation()
    try {
      const existing = JSON.parse(localStorage.getItem('cart') || '[]')
      const idx = existing.findIndex(x => x.id === product.id)
      if (idx > -1) existing[idx].qty = (existing[idx].qty || 1) + 1
      else existing.push({ ...product, qty: 1 })
      localStorage.setItem('cart', JSON.stringify(existing))
      setCartCount(existing.reduce((s, i) => s + (i.qty || 1), 0))
    } catch (err) { console.error('Cart error:', err) }
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackName.trim() || !feedbackText.trim()) return
    setSubmittingFeedback(true)
    try {
      await addDoc(collection(db, 'feedbacks'), {
        name: feedbackName.trim(), text: feedbackText.trim(),
        rating: feedbackRating, imageUrl: feedbackImage || null,
        status: 'pending', createdAt: serverTimestamp(),
      })
      setFeedbackName(''); setFeedbackText(''); setFeedbackRating(5); setFeedbackImage(null)
      setShowFeedbackForm(false)
      alert('Thank you! Your feedback has been submitted for review.')
    } catch (err) {
      console.error('Feedback submit error:', err)
      alert('Failed to submit feedback. Please try again.')
    } finally { setSubmittingFeedback(false) }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be less than 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => setFeedbackImage(reader.result)
    reader.readAsDataURL(file)
  }

  const openWhatsApp = number => window.open(`https://wa.me/${number}`, '_blank')

  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
  const filteredProducts = allProducts.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
    const matchCat    = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat
  })
  const isFiltering    = search.trim() !== '' || activeCategory !== 'All'
  const displayProducts= isFiltering ? filteredProducts : allProducts.slice(0, 6)
  const gridCols       = windowWidth >= 1024 ? 'repeat(3,1fr)' : windowWidth >= 768 ? 'repeat(3,1fr)' : 'repeat(2,1fr)'
  const isMobile       = windowWidth < 768

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', overflowX: 'hidden' }}>

      {/* ===== NAVBAR ===== */}
      <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        style={{ borderBottom: '1px solid #CF0A0A44', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', boxShadow: '0 2px 30px #CF0A0A22', position: 'sticky', top: 0, zIndex: 50, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
          <motion.div whileHover={{ scale: 1.05 }} onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '2px', flexShrink: 0 }}>
            <motion.span style={{ color: '#CF0A0A', fontSize: '26px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #CF0A0A','0 0 30px #CF0A0A','0 0 10px #CF0A0A'] }} transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
            <span style={{ color: '#CF0A0A', fontSize: '26px', fontWeight: 900 }}>&</span>
            <motion.span style={{ color: '#B8960C', fontSize: '26px', fontWeight: 900 }} animate={{ textShadow: ['0 0 10px #B8960C','0 0 30px #B8960C','0 0 10px #B8960C'] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
            <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '6px', fontWeight: 600, letterSpacing: '2px' }}>TRADERS</span>
          </motion.div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }, { label: 'Track', path: '/track-order' }, { label: 'About', path: '/about' }].map((link, i) => (
              <motion.button key={link.label} onClick={() => navigate(link.path)} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} whileHover={{ color: '#CF0A0A', y: -2 }} style={{ color: '#EEEEEE', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{link.label}</motion.button>
            ))}
            <motion.div whileHover={{ scale: 1.2 }} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/cart')}>
              <ShoppingCart size={20} style={{ color: '#EEEEEE' }} />
              <motion.span style={{ backgroundColor: '#CF0A0A', position: 'absolute', top: '-8px', right: '-8px', color: 'white', fontSize: '9px', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>{cartCount}</motion.span>
            </motion.div>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#CF0A0A' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products... (e.g. iPhone, Fridge, Laptop)"
            style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '50px', padding: '9px 38px', color: '#EEEEEE', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#CF0A0A'} onBlur={e => e.target.style.borderColor = '#333'} />
          {search && <motion.div whileHover={{ scale: 1.2 }} onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#EEEEEE55' }}><X size={16} /></motion.div>}
        </div>
      </motion.nav>

      {/* ===== CATEGORY FILTER ===== */}
      {categories.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #CF0A0A22', position: 'sticky', top: '96px', zIndex: 40, display: 'flex', gap: '10px', padding: '10px 16px', overflowX: 'auto', whiteSpace: 'nowrap' }}
          className="hide-scrollbar">
          {['All', ...categories].map(cat => (
            <motion.button key={cat} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat)}
              style={{ padding: '7px 16px', borderRadius: '50px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, backgroundColor: activeCategory === cat ? '#CF0A0A' : '#1a1a1a', color: activeCategory === cat ? 'white' : '#EEEEEE88', border: activeCategory === cat ? '1px solid #CF0A0A' : '1px solid #333', transition: 'all 0.2s' }}>
              {cat} {cat !== 'All' && `(${allProducts.filter(p => p.category === cat).length})`}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* ===== HERO ===== */}
      {!isFiltering && (
        <section style={{
          minHeight: '90vh', display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #0a0000 0%, #180000 20%, #0d0000 55%, #000000 100%)',
        }}>
          {/* Particles */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <motion.div animate={{ scale: [1,1.3,1], opacity: [0.2,0.4,0.2] }} transition={{ duration: 5, repeat: Infinity }}
              style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translate(-50%,-50%)', width: '900px', height: '900px', borderRadius: '50%', background: 'radial-gradient(circle, #CF0A0A44 0%, transparent 65%)' }} />
            {[...Array(14)].map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0,1,0], scale: [0,1.5,0] }} transition={{ duration: 2.5+i*0.2, repeat: Infinity, delay: i*0.35 }}
                style={{ position: 'absolute', left: `${5+i*6.5}%`, top: `${10+(i%5)*18}%`, width: i%3===0?'4px':'2px', height: i%3===0?'4px':'2px', borderRadius: '50%', backgroundColor: i%2===0?'#CF0A0A':'#B8960C' }} />
            ))}
          </div>

          {/* LEFT — text */}
          <div style={{ flex: '1 1 320px', padding: 'clamp(24px,5vw,80px)', paddingTop: '60px', paddingBottom: '60px', position: 'relative', zIndex: 10 }}>
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: 'spring' }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#CF0A0A22', border: '1px solid #CF0A0A66', color: '#CF0A0A', padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: 700, marginBottom: '20px' }}>
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>⭐</motion.span>
              Pakistan's #1 Premium Store
            </motion.div>
            <div style={{ marginBottom: '16px' }}>
              <motion.p initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} style={{ fontSize: 'clamp(32px,5vw,68px)', fontWeight: 900, lineHeight: 1.1, color: '#EEEEEE' }}>Premium</motion.p>
              <AnimatePresence mode="wait">
                <motion.p key={currentWord} initial={{ opacity: 0, y: 25, rotateX: -80 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -25, rotateX: 80 }} transition={{ duration: 0.35 }} style={{ fontSize: 'clamp(32px,5vw,68px)', fontWeight: 900, lineHeight: 1.1, color: '#CF0A0A' }}>{heroWords[currentWord]}</motion.p>
              </AnimatePresence>
              <motion.p initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} style={{ fontSize: 'clamp(32px,5vw,68px)', fontWeight: 900, lineHeight: 1.1, color: '#EEEEEE' }}>At Best Prices</motion.p>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ color: '#EEEEEE88', fontSize: '15px', maxWidth: '420px', marginBottom: '28px', lineHeight: 1.6 }}>Fridges, ACs, Mobiles, Laptops & more — all in one place with fast delivery across Pakistan!</motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <motion.button whileHover={{ scale: 1.06, boxShadow: '0 0 35px #CF0A0A99' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/products')} style={{ backgroundColor: '#CF0A0A', padding: '12px 28px', borderRadius: '50px', fontWeight: 700, fontSize: '15px', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>Shop Now <ArrowRight size={17} /></motion.button>
              <motion.button whileHover={{ scale: 1.06, boxShadow: '0 0 25px #DC5F0066' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/track-order')} style={{ border: '2px solid #DC5F00', color: '#DC5F00', padding: '12px 28px', borderRadius: '50px', fontWeight: 700, fontSize: '15px', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>Track Order <ChevronRight size={17} /></motion.button>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[{ icon: '🤝', value: 1000, suffix: '+', label: 'Happy Customers' }, { icon: '📦', value: 150, suffix: '+', label: 'Products' }, { icon: '⚡', value: 3, suffix: ' Days', label: 'Fast Delivery' }].map((stat, i) => (
                <div key={i}>
                  <p style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }}>{stat.icon} <AnimatedCounter target={stat.value} suffix={stat.suffix} /></p>
                  <p style={{ color: '#EEEEEE44', fontSize: '11px', marginTop: '2px' }}>{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — 3D carousel */}
          <motion.div initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8, type: 'spring', stiffness: 80 }} style={{ flex: '1 1 300px', position: 'relative', zIndex: 10 }}>
            <HeroCarousel />
          </motion.div>
        </section>
      )}

      {/* ===== FEATURES BAR ===== */}
      {!isFiltering && (
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{ backgroundColor: '#0D0D0D', borderTop: '1px solid #CF0A0A33', borderBottom: '1px solid #CF0A0A33', padding: '32px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '16px' }}>
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05, backgroundColor: '#1a1a1a' }} transition={{ delay: i * 0.1 }} style={{ borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <motion.div style={{ color: '#CF0A0A', flexShrink: 0 }} animate={{ rotate: [0,10,-10,0] }} transition={{ duration: 2, repeat: Infinity, delay: i*0.3 }}>{f.icon}</motion.div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px', margin: 0 }}>{f.title}</p>
                  <p style={{ color: '#EEEEEE55', fontSize: '11px', margin: 0 }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== PRODUCTS GRID ===== */}
      <section style={{ padding: '60px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '48px' }}>
          {isFiltering ? (
            <>
              <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, marginBottom: '8px' }}>
                {search ? <>Search results for "<span style={{ color: '#CF0A0A' }}>{search}</span>"</> : <>Showing <span style={{ color: '#CF0A0A' }}>{activeCategory}</span></>}
              </h2>
              <p style={{ color: '#EEEEEE55', fontSize: '14px' }}>{filteredProducts.length} product(s) found</p>
            </>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#B8960C22', border: '1px solid #B8960C55', color: '#B8960C', padding: '5px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '14px' }}>🏆 PREMIUM SELECTION</motion.div>
              <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, marginBottom: '8px' }}>Our <span style={{ color: '#CF0A0A' }}>Top Picks</span> For You</h2>
              <p style={{ color: '#EEEEEE55', fontSize: '14px' }}>Carefully selected products, best quality at unbeatable prices</p>
            </>
          )}
          <div style={{ width: '50px', height: '3px', background: 'linear-gradient(to right, #CF0A0A, #DC5F00)', margin: '12px auto 0', borderRadius: '2px' }} />
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? '12px' : '24px', maxWidth: '1152px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '35px', height: '35px', border: '3px solid #CF0A0A', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <p style={{ color: '#EEEEEE44', fontSize: '13px' }}>Loading products...</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#EEEEEE33' }}>
              <p style={{ fontSize: '50px', marginBottom: '12px' }}>🔍</p>
              <p style={{ fontSize: '16px', fontWeight: 600 }}>No products found</p>
            </div>
          ) : displayProducts.map((product, i) => {
            const currentPrice = Number(product.price || product.sellPrice || 0)
            const oldPrice = Number(product.oldPrice || 0)
            const discountPct = oldPrice > currentPrice ? Math.round((1 - currentPrice / oldPrice) * 100) : 0
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -6 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 150 }}
                style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                {product.badge && <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 3, backgroundColor: product.badge === 'Non-PTA' ? '#CF0A0A' : product.badge === 'PTA' ? '#22c55e' : product.badge === 'CPID' ? '#f59e0b' : '#CF0A0A', color: 'white', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>{product.badge}</div>}
                <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={e => { e.stopPropagation(); toggleWishlist(product.id) }}
                  style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 3, backgroundColor: '#00000088', border: 'none', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={13} fill={wishlist.includes(product.id) ? '#CF0A0A' : 'none'} style={{ color: wishlist.includes(product.id) ? '#CF0A0A' : '#EEEEEE' }} />
                </motion.button>
                <div onClick={() => navigate(`/product/${product.id}`)} style={{ height: isMobile ? '150px' : '200px', overflow: 'hidden', backgroundColor: '#1a1a1a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.imageUrl && product.imageUrl.trim() !== '' ? (
                    <motion.img src={product.imageUrl} alt={product.name} whileHover={{ scale: 1.08 }} transition={{ duration: 0.4 }} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', filter: 'brightness(0.9)' }} />
                  ) : <span style={{ fontSize: '50px' }}>{product.img || '📦'}</span>}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, #111111 100%)', pointerEvents: 'none' }} />
                </div>
                <div style={{ padding: isMobile ? '10px' : '16px' }}>
                  <p style={{ color: '#EEEEEE55', fontSize: isMobile ? '10px' : '11px', marginBottom: '3px' }}>{product.category || 'General'}</p>
                  <p style={{ fontWeight: 700, fontSize: isMobile ? '13px' : '15px', marginBottom: '6px', color: '#EEEEEE', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '8px' }}>
                    {[...Array(5)].map((_, j) => <Star key={j} size={10} fill={j < Math.floor(product.rating || 5) ? '#B8960C' : 'none'} style={{ color: '#B8960C' }} />)}
                    <span style={{ color: '#EEEEEE55', fontSize: '10px', marginLeft: '3px' }}>({product.reviews || 0})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <p style={{ color: '#CF0A0A', fontSize: isMobile ? '15px' : '18px', fontWeight: 900 }}>Rs. {currentPrice.toLocaleString()}</p>
                    {oldPrice > currentPrice && <>
                      <p style={{ color: '#EEEEEE33', fontSize: '11px', textDecoration: 'line-through' }}>Rs. {oldPrice.toLocaleString()}</p>
                      <span style={{ backgroundColor: '#DC5F0022', color: '#DC5F00', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>-{discountPct}%</span>
                    </>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', position: 'relative', zIndex: 5 }}>
                    <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 20px #CF0A0A66' }} whileTap={{ scale: 0.97 }} onClick={e => handleOrderNow(product, e)}
                      style={{ flex: 1, backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '8px', padding: isMobile ? '9px 4px' : '11px 4px', fontWeight: 700, fontSize: isMobile ? '11px' : '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <ShoppingCart size={12} /> Order
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 15px #DC5F0066' }} whileTap={{ scale: 0.97 }} onClick={e => handleAddToCart(product, e)}
                      style={{ flex: 1, backgroundColor: 'transparent', color: '#DC5F00', border: '2px solid #DC5F00', borderRadius: '8px', padding: isMobile ? '9px 4px' : '11px 4px', fontWeight: 700, fontSize: isMobile ? '11px' : '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <ShoppingCart size={12} /> Cart
                    </motion.button>
                  </div>
                </div>
                <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, border: '2px solid #CF0A0A44', borderRadius: '16px', pointerEvents: 'none' }} />
              </motion.div>
            )
          })}
        </div>

        {!isFiltering && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginTop: '40px' }}>
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 30px #CF0A0A66' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/products')}
              style={{ border: '2px solid #CF0A0A', color: '#CF0A0A', backgroundColor: 'transparent', padding: '13px 40px', borderRadius: '50px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              View All Products <ArrowRight size={17} />
            </motion.button>
          </motion.div>
        )}
      </section>

      {/* ===== SALE BANNER ===== */}
      {!isFiltering && (
        <motion.section initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          style={{ background: 'linear-gradient(135deg, #CF0A0A 0%, #DC5F00 100%)', margin: '0 16px 60px 16px', borderRadius: '20px', padding: '40px 24px', textAlign: 'center' }}>
          <motion.p animate={{ scale: [1,1.04,1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, color: 'white' }}>🔥 Mega Sale — Up to 30% OFF!</motion.p>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px', fontSize: '14px' }}>Limited time offer on selected products</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/sale')}
            style={{ marginTop: '18px', backgroundColor: 'black', color: 'white', padding: '11px 28px', borderRadius: '50px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Shop Sale →
          </motion.button>
        </motion.section>
      )}

      {/* ===== CUSTOMER FEEDBACKS ===== */}
      {!isFiltering && (
        <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #CF0A0A22', borderBottom: '1px solid #CF0A0A22', padding: '60px 0', marginBottom: '40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#CF0A0A22', border: '1px solid #CF0A0A55', color: '#CF0A0A', padding: '6px 18px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', marginBottom: '14px' }}>
                💬 CUSTOMER LOVE
              </motion.div>
              <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, marginBottom: '8px' }}>What Our <span style={{ color: '#CF0A0A' }}>Customers</span> Say</h2>
              <p style={{ color: '#EEEEEE55', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>Real feedback from real people who trusted M&J Traders</p>
            </div>

            {feedbacks.length > 0 ? (
              <div style={{ position: 'relative' }}>
                {!isMobile && (
                  <motion.button whileHover={{ scale: 1.1, backgroundColor: '#CF0A0A' }} whileTap={{ scale: 0.95 }} onClick={() => scrollFeedbacks('left')}
                    style={{ position: 'absolute', left: '-18px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1a1a1a', border: '1px solid #CF0A0A55', color: '#EEEEEE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                    <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                  </motion.button>
                )}
                <div ref={feedbackScrollRef} style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '8px 4px 20px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
                  {feedbacks.map((feedback, i) => (
                    <motion.div key={feedback.id} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4, scale: 1.02 }}
                      style={{ flex: '0 0 300px', scrollSnapAlign: 'start', backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '18px', padding: '20px', position: 'relative', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '16px', fontSize: '48px', color: '#CF0A0A11', fontFamily: 'serif', lineHeight: 1 }}>"</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#CF0A0A22', border: '2px solid #CF0A0A44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={20} style={{ color: '#CF0A0A' }} />
                        </div>
                        <div>
                          <p style={{ color: '#EEEEEE', fontSize: '15px', fontWeight: 700, margin: 0 }}>{feedback.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[...Array(5)].map((_, j) => <Star key={j} size={12} fill={j < (feedback.rating || 5) ? '#B8960C' : 'none'} style={{ color: '#B8960C' }} />)}
                            </div>
                            <span style={{ color: '#B8960C', fontSize: '12px', fontWeight: 700 }}>{feedback.rating}/5</span>
                          </div>
                        </div>
                      </div>
                      {feedback.imageUrl && (
                        <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', border: '1px solid #333' }}>
                          <img src={feedback.imageUrl} alt="Feedback" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <p style={{ color: '#EEEEEEaa', fontSize: '14px', lineHeight: 1.6, flex: 1, margin: 0 }}>{feedback.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #222' }}>
                        <Clock size={12} style={{ color: '#EEEEEE44' }} />
                        <span style={{ color: '#EEEEEE44', fontSize: '11px' }}>{timeAgo(feedback.approvedAt || feedback.createdAt)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {!isMobile && (
                  <motion.button whileHover={{ scale: 1.1, backgroundColor: '#CF0A0A' }} whileTap={{ scale: 0.95 }} onClick={() => scrollFeedbacks('right')}
                    style={{ position: 'absolute', right: '-18px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1a1a1a', border: '1px solid #CF0A0A55', color: '#EEEEEE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                    <ChevronRight size={20} />
                  </motion.button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#EEEEEE33' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>💬</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>No feedbacks yet</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Be the first to share your experience!</p>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 25px #CF0A0A55' }} whileTap={{ scale: 0.95 }} onClick={() => setShowFeedbackForm(true)}
                style={{ backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '50px', padding: '14px 32px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} /> Share Your Feedback
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {/* ===== FEEDBACK MODAL ===== */}
      <AnimatePresence>
        {showFeedbackForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setShowFeedbackForm(false)}>
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ color: '#EEEEEE', fontSize: '20px', fontWeight: 800, margin: 0 }}>Share Your Experience</h3>
                  <p style={{ color: '#EEEEEE55', fontSize: '13px', margin: '4px 0 0' }}>Your feedback helps us improve</p>
                </div>
                <button onClick={() => setShowFeedbackForm(false)} style={{ background: 'none', border: 'none', color: '#EEEEEE55', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmitFeedback}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#EEEEEE88', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Your Name *</label>
                  <input type="text" value={feedbackName} onChange={e => setFeedbackName(e.target.value)} placeholder="Enter your name" required
                    style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '12px 16px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#CF0A0A'} onBlur={e => e.target.style.borderColor = '#333'} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#EEEEEE88', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Your Rating *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {[1,2,3,4,5].map(star => (
                      <motion.button key={star} type="button" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => setFeedbackRating(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <Star size={28} fill={star <= feedbackRating ? '#B8960C' : 'none'} style={{ color: star <= feedbackRating ? '#B8960C' : '#EEEEEE33' }} />
                      </motion.button>
                    ))}
                    <span style={{ color: '#B8960C', fontSize: '14px', fontWeight: 700, marginLeft: '8px' }}>{feedbackRating}/5</span>
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#EEEEEE88', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Your Feedback *</label>
                  <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Tell us about your experience..." required rows={4}
                    style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '12px 16px', color: '#EEEEEE', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#CF0A0A'} onBlur={e => e.target.style.borderColor = '#333'} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ color: '#EEEEEE88', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Add Photo (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="feedback-image" />
                  <label htmlFor="feedback-image"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px dashed #333', borderRadius: '10px', cursor: 'pointer', color: '#EEEEEE55', fontSize: '14px', boxSizing: 'border-box' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#CF0A0A'; e.currentTarget.style.color='#CF0A0A' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.color='#EEEEEE55' }}>
                    <ImagePlus size={18} />{feedbackImage ? 'Photo selected ✓' : 'Click to upload photo'}
                  </label>
                  {feedbackImage && (
                    <div style={{ marginTop: '10px', position: 'relative' }}>
                      <img src={feedbackImage} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #333' }} />
                      <button type="button" onClick={() => setFeedbackImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#CF0A0A', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={14} /></button>
                    </div>
                  )}
                </div>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={submittingFeedback}
                  style={{ width: '100%', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '15px', cursor: submittingFeedback ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submittingFeedback ? 0.7 : 1 }}>
                  {submittingFeedback
                    ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />Submitting...</>
                    : <><Send size={16} /> Submit Feedback</>}
                </motion.button>
                <p style={{ color: '#EEEEEE33', fontSize: '11px', textAlign: 'center', marginTop: '12px' }}>Your feedback will be reviewed before appearing publicly</p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FOOTER ===== */}
      <footer style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #CF0A0A33', padding: '40px 16px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px', marginBottom: '8px' }}>
              <span style={{ color: '#CF0A0A', fontSize: '28px', fontWeight: 900 }}>M</span>
              <span style={{ color: '#CF0A0A', fontSize: '28px', fontWeight: 900 }}>&</span>
              <span style={{ color: '#B8960C', fontSize: '28px', fontWeight: 900 }}>J</span>
              <span style={{ color: '#EEEEEE', fontSize: '12px', marginLeft: '6px', letterSpacing: '3px', fontWeight: 700 }}>TRADERS</span>
            </div>
            <p style={{ color: '#EEEEEE44', fontSize: '12px', letterSpacing: '1px' }}>Pakistan's Premium Electronics Store</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[
              { href: 'https://www.facebook.com/profile.php?id=61582145015111', label: 'Facebook', hoverColor: '#1877F2', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
              { href: 'https://www.instagram.com/idreesalzeyadi/', label: 'Instagram', hoverColor: '#E1306C', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
              { href: 'https://www.tiktok.com/@m_j_traders', label: 'TikTok', hoverColor: '#00f2ea', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> },
              { href: 'https://chat.whatsapp.com/BwtVVtkptoH7N8sH8Z2pV3', label: 'WA Group', hoverColor: '#25D366', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
            ].map((s, i) => (
              <motion.a key={i} href={s.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.12, y: -4 }} whileTap={{ scale: 0.95 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textDecoration: 'none', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '12px 18px', minWidth: '74px', color: '#EEEEEE66', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=s.hoverColor; e.currentTarget.style.backgroundColor=s.hoverColor+'15'; e.currentTarget.style.color=s.hoverColor }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#2a2a2a'; e.currentTarget.style.backgroundColor='#1a1a1a'; e.currentTarget.style.color='#EEEEEE66' }}>
                {s.svg}
                <span style={{ fontSize: '10px', fontWeight: 700 }}>{s.label}</span>
              </motion.a>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: '#EEEEEE22', fontSize: '11px' }}>© 2026 M&J Trader. All rights reserved.</p>
            <p style={{ color: '#EEEEEE22', fontSize: '11px' }}>Developed by <span style={{ color: '#CF0A0A', fontWeight: 600 }}>Idrees Alzeyadi</span></p>
          </div>
        </div>
      </footer>

      {/* ===== HELP BUTTON ===== */}
      <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, type: 'spring' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        onClick={() => setShowHelp(!showHelp)}
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, width: '58px', height: '58px', borderRadius: '50%', backgroundColor: '#25D366', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(37,211,102,0.5)' }}>
        <motion.div animate={{ rotate: showHelp ? 45 : 0 }} transition={{ duration: 0.3 }}>
          {showHelp ? <X size={26} color="white" /> : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          )}
        </motion.div>
        {!showHelp && <motion.div animate={{ scale: [1,1.5,1], opacity: [0.6,0,0.6] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#25D366', zIndex: -1 }} />}
      </motion.button>

      {/* ===== HELP POPUP ===== */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ position: 'fixed', bottom: '94px', right: '24px', zIndex: 998, backgroundColor: '#111', border: '1px solid #25D36644', borderRadius: '20px', padding: '20px', width: '290px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#25D36622', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={18} style={{ color: '#25D366' }} />
              </div>
              <div>
                <p style={{ color: '#EEEEEE', fontSize: '15px', fontWeight: 800, margin: 0 }}>Help Center</p>
                <p style={{ color: '#25D366', fontSize: '11px', margin: 0 }}>● Online — We reply instantly</p>
              </div>
            </div>
            <p style={{ color: '#EEEEEE55', fontSize: '12px', marginBottom: '16px', paddingLeft: '4px' }}>Select a team member to chat on WhatsApp</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {supportNumbers.map((support, idx) => (
                <motion.button key={idx} whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.97 }} onClick={() => openWhatsApp(support.number)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#1a1a1a', border: '1px solid #25D36622', borderRadius: '14px', padding: '12px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor='#25D36611'; e.currentTarget.style.borderColor='#25D36644' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor='#1a1a1a'; e.currentTarget.style.borderColor='#25D36622' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #25D36644', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    <img src={support.avatar} alt={support.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#EEEEEE', fontSize: '13px', fontWeight: 700, margin: 0 }}>{support.name}</p>
                    <p style={{ color: '#EEEEEE55', fontSize: '11px', margin: '1px 0 0' }}>{support.role}</p>
                    <span style={{ display: 'inline-block', backgroundColor: '#25D36622', color: '#25D366', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', marginTop: '4px' }}>{support.label}</span>
                  </div>
                  <motion.div animate={{ x: [0,4,0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <MessageCircle size={16} style={{ color: '#25D366' }} />
                  </motion.div>
                </motion.button>
              ))}
            </div>
            <div style={{ backgroundColor: '#25D36611', border: '1px solid #25D36622', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ color: '#25D366', fontSize: '11px', fontWeight: 600, margin: 0 }}>🕐 Available 24/7 for your support</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  )
}

export default Home