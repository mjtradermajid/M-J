import { motion } from 'framer-motion'
import { useState } from 'react'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { adminLogin } from '../firebase/auth'
import { useNavigate } from 'react-router-dom'

function AdminLogin() {
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await adminLogin(form.email, form.password)

    if (result.success) {
      localStorage.setItem('mjAdmin', 'true')
      navigate('/admin/dashboard')
    } else {
      setError('Invalid email or password!')
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>

      {/* Background glow */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, #CF0A0A 0%, transparent 70%)', pointerEvents: 'none' }}
      />

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -80, -160] }}
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
          style={{ position: 'absolute', left: `${8 + i * 7.5}%`, bottom: '10%', width: i % 2 === 0 ? '4px' : '3px', height: i % 2 === 0 ? '4px' : '3px', borderRadius: '50%', backgroundColor: i % 2 === 0 ? '#CF0A0A' : '#B8960C', pointerEvents: 'none' }}
        />
      ))}

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ backgroundColor: '#111111', border: '1px solid #CF0A0A33', borderRadius: '24px', padding: '48px 40px', width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10, boxShadow: '0 0 60px #CF0A0A22' }}
      >
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px' }}>
            <motion.span style={{ color: '#CF0A0A' }}
              animate={{ textShadow: ['0 0 10px #CF0A0A', '0 0 30px #CF0A0A', '0 0 10px #CF0A0A'] }}
              transition={{ duration: 2, repeat: Infinity }}>M</motion.span>
            <motion.span style={{ color: '#B8960C' }}
              animate={{ textShadow: ['0 0 10px #B8960C', '0 0 30px #B8960C', '0 0 10px #B8960C'] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>J</motion.span>
            <span style={{ color: '#EEEEEE', fontSize: '16px', marginLeft: '8px', fontWeight: 400, letterSpacing: '3px' }}>TRADERS</span>
          </div>
          <p style={{ color: '#EEEEEE55', fontSize: '13px', letterSpacing: '2px' }}>ADMIN PANEL</p>
          <div style={{ width: '40px', height: '2px', background: 'linear-gradient(to right, #CF0A0A, #DC5F00)', margin: '10px auto 0', borderRadius: '2px' }} />
        </motion.div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Email */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            style={{ marginBottom: '16px' }}>
            <label style={{ color: '#EEEEEE88', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>EMAIL</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#CF0A0A' }} />
              <input
                type="email"
                placeholder="admin@mjstore.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333333', borderRadius: '12px', padding: '13px 14px 13px 42px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#CF0A0A'}
                onBlur={e => e.target.style.borderColor = '#333333'}
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            style={{ marginBottom: '24px' }}>
            <label style={{ color: '#EEEEEE88', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#CF0A0A' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ width: '100%', backgroundColor: '#1a1a1a', border: '1px solid #333333', borderRadius: '12px', padding: '13px 42px 13px 42px', color: '#EEEEEE', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#CF0A0A'}
                onBlur={e => e.target.style.borderColor = '#333333'}
              />
              <div onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#EEEEEE55' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </div>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ color: '#CF0A0A', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
              ❌ {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03, boxShadow: '0 0 30px #CF0A0A88' }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#CF0A0A', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              <><Lock size={16} /> Login to Admin</>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

export default AdminLogin