import React from 'react';
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, Mail, MapPin, ShoppingCart, Truck, Shield, Headphones, Zap, Package, Globe } from 'lucide-react'

export default function About() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#EEEEEE', fontFamily: "'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif" }}>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Jameel+Noori+Nastaleeq&family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #CF0A0A22', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(20px)', padding: '14px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ color: '#CF0A0A', fontSize: '24px', fontWeight: 900 }}>M</span>
            <span style={{ color: '#CF0A0A', fontSize: '24px', fontWeight: 900 }}>&</span>
            <span style={{ color: '#B8960C', fontSize: '24px', fontWeight: 900 }}>J</span>
            <span style={{ color: '#EEEEEE', fontSize: '12px', marginLeft: '6px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
          </div>
          <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
            {[{ label: 'Home', path: '/' }, { label: 'Products', path: '/products' }, { label: 'Track', path: '/track-order' }, { label: 'About', path: '/about' }].map(link => (
              <span key={link.path} onClick={() => navigate(link.path)} style={{ cursor: 'pointer', fontSize: '14px', color: link.path === '/about' ? '#CF0A0A' : '#EEEEEE88', fontWeight: link.path === '/about' ? 700 : 500, transition: 'color 0.2s' }}>{link.label}</span>
            ))}
            <ShoppingCart size={18} style={{ color: '#EEEEEE88', cursor: 'pointer' }} onClick={() => navigate('/cart')} />
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>

        {/* HERO SECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '56px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #CF0A0A22 0%, transparent 70%)', pointerEvents: 'none' }} />
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#CF0A0A22', border: '1px solid #CF0A0A55', color: '#CF0A0A', padding: '8px 20px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', marginBottom: '20px' }}>
            ⭐ ہمارے بارے میں
          </motion.div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, marginBottom: '20px', lineHeight: 1.3, direction: 'rtl' }}>
            <span style={{ color: '#CF0A0A' }}>ایم اینڈ جے ٹریڈرز</span>
          </h1>
          <p style={{ color: '#EEEEEE88', fontSize: '18px', maxWidth: '700px', margin: '0 auto', lineHeight: 2, direction: 'rtl' }}>
            ایک قابلِ اعتماد اور جدید کاروباری ادارہ ہے جو اپنے صارفین کو آسان اقساط پر موبائل فونز، الیکٹرانکس، موٹر سائیکلیں اور دیگر ضروری اشیاء فراہم کرتا ہے۔ ہمارا مقصد معیاری مصنوعات کو ہر فرد کی پہنچ میں لانا اور شفاف، آسان اور قابلِ اعتماد مالی سہولیات فراہم کرنا ہے۔
          </p>
        </motion.div>

        {/* STATS */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '56px' }}>
          {[
            { value: '100%', label: 'اصل مصنوعات', icon: <Shield size={22} /> },
            { value: '500+', label: 'مطمئن صارفین', icon: <Headphones size={22} /> },
            { value: '24/7', label: 'براہِ راست سپورٹ', icon: <Phone size={22} /> },
            { value: 'فوری', label: 'پورے پاکستان میں ترسیل', icon: <Truck size={22} /> },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -4, boxShadow: '0 8px 25px #CF0A0A22' }}
              style={{ backgroundColor: '#111111', border: '1px solid #CF0A0A33', borderRadius: '16px', padding: '28px 16px', textAlign: 'center', direction: 'rtl' }}>
              <div style={{ color: '#CF0A0A', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
              <p style={{ color: '#CF0A0A', fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>{stat.value}</p>
              <p style={{ color: '#EEEEEE66', fontSize: '15px', fontWeight: 600 }}>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* VISION & MISSION */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '56px' }}>

          {/* Vision */}
          <div style={{ backgroundColor: '#111111', border: '1px solid #222', borderRadius: '16px', padding: '32px', direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#B8960C22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} style={{ color: '#B8960C' }} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#B8960C', margin: 0 }}>ہمارا وژن</h2>
            </div>
            <p style={{ color: '#EEEEEEaa', fontSize: '17px', lineHeight: 2, margin: 0 }}>
              لوگوں کو آسان اور قابلِ اعتماد مالی سہولیات کے ذریعے ان کی ضروریات پوری کرنے میں مدد فراہم کرنا اور پاکستان کی نمایاں ٹریڈنگ کمپنیوں میں شامل ہونا۔
            </p>
          </div>

          {/* Mission */}
          <div style={{ backgroundColor: '#111111', border: '1px solid #222', borderRadius: '16px', padding: '32px', direction: 'rtl' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#CF0A0A22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={20} style={{ color: '#CF0A0A' }} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#CF0A0A', margin: 0 }}>ہمارا مشن</h2>
            </div>
            <p style={{ color: '#EEEEEEaa', fontSize: '17px', lineHeight: 2, margin: 0 }}>
              معیاری مصنوعات، شفاف معاملات، بروقت سروس اور صارفین کے اعتماد کو اپنی کامیابی کی بنیاد بنانا۔
            </p>
          </div>
        </motion.div>

        {/* SERVICES */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ marginBottom: '56px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '28px', textAlign: 'center', direction: 'rtl' }}>
            ہماری <span style={{ color: '#CF0A0A' }}>خدمات</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              { icon: <Phone size={22} />, title: 'آسان اقساط پر موبائل فونز', desc: 'جدید ترین سمارٹ فونز آسان اقساط پر حاصل کریں۔' },
              { icon: <Zap size={22} />, title: 'الیکٹرانکس اور گھریلو اشیاء', desc: 'فریجز، ایسی، لیپ ٹاپ اور دیگر الیکٹرانکس۔' },
              { icon: <Truck size={22} />, title: 'موٹر سائیکل فنانسنگ', desc: 'اپنی پسندیدہ موٹر سائیکل آسان اقساط پر خریدیں۔' },
              { icon: <Globe size={22} />, title: 'چین سے مصنوعات کی درآمد', desc: 'کاروباری اور ذاتی ضروریات کے لیے چین سے براہِ راست درآمد۔' },
              { icon: <ShoppingCart size={22} />, title: 'خریداری کے حل', desc: 'کاروباری اور ذاتی ضروریات کے لیے مکمل خریداری کے حل۔' },
              { icon: <Shield size={22} />, title: 'قابلِ اعتماد سہولیات', desc: 'شفاف، آسان اور قابلِ اعتماد مالی سہولیات۔' },
            ].map((service, i) => (
              <motion.div key={i} whileHover={{ scale: 1.02, borderColor: '#CF0A0A55' }}
                style={{ backgroundColor: '#111111', border: '1px solid #222', borderRadius: '14px', padding: '24px', direction: 'rtl' }}>
                <div style={{ color: '#CF0A0A', marginBottom: '12px' }}>{service.icon}</div>
                <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px', color: '#EEEEEE' }}>{service.title}</p>
                <p style={{ color: '#EEEEEE66', fontSize: '15px', lineHeight: 1.8 }}>{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* IMPORT SERVICES HIGHLIGHT */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ background: 'linear-gradient(135deg, #1a0000 0%, #0d0000 100%)', border: '1px solid #CF0A0A44', borderRadius: '16px', padding: '32px', marginBottom: '56px', textAlign: 'center', direction: 'rtl' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#CF0A0A22', border: '2px solid #CF0A0A55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={28} style={{ color: '#CF0A0A' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: '#CF0A0A' }}>درآمد کی خدمات</h2>
          <p style={{ color: '#EEEEEEaa', fontSize: '17px', lineHeight: 2, maxWidth: '700px', margin: '0 auto' }}>
            ہم صرف اقساط کی سہولت تک محدود نہیں بلکہ اپنے صارفین کے لیے چین سمیت دیگر ممالک سے مصنوعات درآمد کرنے کی خدمات بھی فراہم کرتے ہیں۔ ہماری کوشش ہے کہ صارفین کو بہترین معیار، مناسب قیمت اور بہترین کسٹمر سروس ایک ہی پلیٹ فارم پر میسر ہو۔
          </p>
        </motion.div>

        {/* TRUST STATEMENT */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ backgroundColor: '#111111', border: '1px solid #B8960C44', borderRadius: '16px', padding: '32px', marginBottom: '48px', textAlign: 'center', direction: 'rtl' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '16px', color: '#B8960C' }}>ایم اینڈ جے ٹریڈرز</h2>
          <p style={{ color: '#EEEEEEaa', fontSize: '20px', lineHeight: 2, fontWeight: 600 }}>
            آپ کے اعتماد کا ساتھی، آپ کی ضروریات کا آسان حل۔
          </p>
        </motion.div>

        {/* CONTACT */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          style={{ backgroundColor: '#111111', border: '1px solid #222', borderRadius: '16px', padding: '32px', marginBottom: '40px', direction: 'rtl' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ color: '#CF0A0A' }}>رابطہ</span> کریں
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#CF0A0A22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={18} style={{ color: '#CF0A0A' }} />
              </div>
              <div>
                <p style={{ color: '#EEEEEE55', fontSize: '12px', marginBottom: '2px' }}>فون</p>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>0348-7085930</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#CF0A0A22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={18} style={{ color: '#CF0A0A' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#CF0A0A22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <MapPin size={18} style={{ color: '#CF0A0A' }} />
  </div>
  <div>
    <p style={{ color: '#EEEEEE55', fontSize: '12px', marginBottom: '2px' }}>پتہ</p>
    <p style={{ fontSize: '15px', fontWeight: '600' }}>پشاور، پاکستان</p>
  </div>
</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          style={{ textAlign: 'center', marginBottom: '40px', direction: 'rtl' }}>
          <p style={{ color: '#EEEEEE55', fontSize: '14px', marginBottom: '16px' }}>Connect with us on social media</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61582145015111', color: '#1877F2' },
              { label: 'Instagram', href: 'https://www.instagram.com/idreesalzeyadi/', color: '#E1306C' },
              { label: 'TikTok', href: 'https://www.tiktok.com/@m_j_traders', color: '#00f2ea' },
              { label: 'WhatsApp', href: 'https://chat.whatsapp.com/BwtVVtkptoH7N8sH8Z2pV3', color: '#25D366' },
            ].map((s, i) => (
              <motion.a key={i} href={s.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.08, y: -2 }}
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px 20px', color: '#EEEEEE88', textDecoration: 'none', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.color = s.color }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#EEEEEE88' }}>
                {s.label}
              </motion.a>
            ))}
          </div>
        </motion.div>

      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#0a0a0a', borderTop: '1px solid #CF0A0A33', padding: '28px 16px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '2px', marginBottom: '8px' }}>
            <span style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }}>M</span>
            <span style={{ color: '#CF0A0A', fontSize: '22px', fontWeight: 900 }}>&</span>
            <span style={{ color: '#B8960C', fontSize: '22px', fontWeight: 900 }}>J</span>
            <span style={{ color: '#EEEEEE', fontSize: '11px', marginLeft: '4px', letterSpacing: '2px', fontWeight: 600 }}>TRADERS</span>
          </div>
          <p style={{ color: '#EEEEEE22', fontSize: '12px' }}>© 2026 ایم اینڈ جے ٹریڈرز۔ جملہ حقوق محفوظ ہیں۔</p>
        </div>
      </footer>

    </div>
  );
}