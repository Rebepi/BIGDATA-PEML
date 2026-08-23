import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail, Lock, ArrowRight, RefreshCw, Loader2,
  Shield, CheckCircle2, ChevronLeft,
  Eye, EyeOff, Clipboard
} from 'lucide-react'
import { loginApi, verificar2FAApi, reenviarCodigoApi } from '../services/api'
import PeruFlag from '../components/PeruFlag'
import { useDashboard } from '../context/DashboardContext'

const MOUNTAIN_PATH = "M0,140 60,90 120,105 200,55 270,80 340,35 410,65 480,20 550,52 620,38 690,68 760,45 800,70 800,140"
const MOUNTAIN_PATH2 = "M0,140 80,110 160,118 240,85 310,100 380,68 440,88 510,50 580,72 650,60 720,80 800,65 800,140"

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${8 + Math.random() * 84}%`,
  top: `${15 + Math.random() * 65}%`,
  delay: `${Math.random() * 5}s`,
  duration: `${5 + Math.random() * 4}s`,
  size: Math.random() > 0.5 ? 2 : 3,
  color: Math.random() > 0.55 ? 'var(--peru-gold)' : 'var(--peru-red)',
}))

function IncaDecor() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 400, height: 400, borderRadius: '50%',
        border: '1px solid rgba(200,0,10,0.1)',
        background: 'radial-gradient(circle, rgba(200,0,10,0.05) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 260, height: 260, borderRadius: '50%',
        border: '1px solid rgba(200,0,10,0.07)',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -100,
        width: 350, height: 350, borderRadius: '50%',
        border: '1px solid rgba(200,150,45,0.08)',
        background: 'radial-gradient(circle, rgba(200,150,45,0.04) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 80, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(200,0,10,0.12), rgba(200,150,45,0.12), transparent)',
      }} />
      <svg
        viewBox="0 0 800 140"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', opacity: 0.12 }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon points={MOUNTAIN_PATH} fill="var(--peru-red)" />
        <polygon points={MOUNTAIN_PATH2} fill="var(--peru-red-deep)" opacity="0.7" />
      </svg>
      {PARTICLES.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            opacity: 0,
            animation: `particleFloat ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const dash = useDashboard()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [sentViaSmtp, setSentViaSmtp] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/')
  }, [navigate])

  useEffect(() => {
    let timer
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(p => p - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await loginApi(email, password)
      setTempToken(data.temp_token)
      setSentViaSmtp(data.sent_via_smtp)
      setStep(2)
      setResendCooldown(45)
      setTimeout(() => inputRefs.current[0]?.focus(), 150)
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas o error al enviar el correo de verificación.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      pasted.forEach((char, i) => { if (index + i < 6) newOtp[index + i] = char })
      setOtp(newOtp)
      const nextIndex = Math.min(index + pasted.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }
    const cleanVal = value.replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[index] = cleanVal
    setOtp(newOtp)
    if (cleanVal && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePasteOtp = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText()
        const cleaned = text.replace(/\D/g, '').slice(0, 6)
        if (cleaned.length > 0) {
          const newOtp = ['', '', '', '', '', '']
          cleaned.split('').forEach((d, i) => { newOtp[i] = d })
          setOtp(newOtp)
          const nextIndex = Math.min(cleaned.length, 5)
          inputRefs.current[nextIndex]?.focus()
        }
      }
    } catch {}
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  const handleVerify2FA = async (e) => {
    e?.preventDefault()
    const codigoCompleto = otp.join('')
    if (codigoCompleto.length !== 6) {
      setError('Ingresa los 6 dígitos del código de verificación.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const data = await verificar2FAApi(tempToken, codigoCompleto)
      setSuccess(true)
      setTimeout(() => {
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('usuario', JSON.stringify(data.usuario))
        navigate('/')
      }, 700)
    } catch (err) {
      setError(err.message || 'Código inválido o expirado. Solicita uno nuevo.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return
    setError(null)
    setLoading(true)
    try {
      const data = await reenviarCodigoApi(tempToken)
      setTempToken(data.temp_token)
      setSentViaSmtp(data.sent_via_smtp)
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Error al reenviar el código.')
    } finally {
      setLoading(false)
    }
  }

  const otpFull = otp.join('').length === 6

  const labelStyle = {
    display: 'block', fontSize: '0.68rem', fontWeight: 800,
    color: 'var(--peru-red)', textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: '0.5rem',
  }

  return (
    <div className="login-page-bg">
      <IncaDecor />

      <div style={{
        position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.5rem 1.25rem', borderRadius: 999,
        background: 'var(--glass-bg)',
        border: '1px solid var(--border-main)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.6s ease both',
        animationDelay: '0.1s',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--shadow-card)',
      }}>
        <PeruFlag width={28} height={19} />
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
          REPÚBLICA DEL PERÚ
        </span>
        <span style={{ width: 1, height: 14, background: 'var(--border-main)' }} />
        <span style={{ fontSize: '0.65rem', color: 'var(--color-gold)', fontWeight: 700 }}>
          Ministerio de Economía y Finanzas
        </span>
      </div>

      <div className="login-card animate-slide-up" style={{ animationDelay: '0.15s' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)',
            letterSpacing: '-0.04em', marginTop: 0, marginBottom: '0.4rem',
            fontFamily: "'Outfit', sans-serif",
          }}>
            {step === 1 ? 'Acceso al Sistema' : 'Verificación de Identidad'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {step === 1 ? 'Monitor de Gasto Público del Perú · MEF' : `Código de seguridad enviado a ${email}`}
          </p>

          {step === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginTop: '0.85rem' }}>
              <div style={{ flex: 1, maxWidth: 60, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,0,10,0.3))' }} />
              <PeruFlag width={34} height={23} />
              <div style={{ flex: 1, maxWidth: 60, height: 1, background: 'linear-gradient(90deg, rgba(200,0,10,0.3), transparent)' }} />
            </div>
          )}
        </div>

        <div className="login-card-inner">
          <div className="login-card-topline" />
          <div className="login-card-glow" />

          <div style={{ padding: '2rem' }}>
            {error && (
              <div
                className="animate-fade-in"
                style={{
                  marginBottom: '1.25rem', padding: '0.85rem 1rem',
                  borderRadius: 14, display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  background: 'rgba(200,0,10,0.07)', border: '1px solid rgba(200,0,10,0.25)',
                }}
              >
                <Shield size={16} style={{ color: 'var(--peru-red)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: 'var(--color-error-text)', fontSize: '0.82rem', lineHeight: 1.5, fontWeight: 600 }}>{error}</p>
              </div>
            )}

            {success && (
              <div
                className="animate-fade-in"
                style={{
                  marginBottom: '1.25rem', padding: '0.85rem 1rem',
                  borderRadius: 14, display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                <p style={{ color: 'var(--color-success)', fontSize: '0.82rem', fontWeight: 600 }}>
                  Acceso concedido. Redirigiendo al sistema...
                </p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={labelStyle}>Correo Institucional</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@correo.com" className="input-field" style={{ paddingLeft: 42 }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" style={{ paddingLeft: 42, paddingRight: 42 }} />
                    <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ paddingTop: '0.25rem' }}>
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Ingresar al Sistema</span><ArrowRight size={16} /></>}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}>
                  <div className="icon-box-peru icon-box" style={{ width: 34, height: 34, flexShrink: 0 }}>
                    <Mail size={14} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Código enviado a</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{email}</p>
                  </div>
                </div>

                <div style={{ padding: '0.9rem 1rem', borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                    <Shield size={13} style={{ color: '#818cf8' }} />
                    <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Verificación en 2 Pasos (2FA Real)
                    </p>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Hemos enviado un correo institucional desde <strong style={{ color: 'var(--text-primary)' }}>gastope.monitor@gmail.com</strong>. Revisa tu bandeja de entrada o spam para obtener tu código de 6 dígitos.
                  </p>
                </div>

                <div>
                  <label style={{ ...labelStyle, textAlign: 'center', marginBottom: '0.85rem' }}>Ingresa el código de 6 dígitos</label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(4px, 1.5vw, 8px)' }}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleKeyDown(idx, e)}
                        style={{
                          width: 'clamp(36px, 12vw, 46px)',
                          height: 'clamp(46px, 14vw, 56px)',
                          textAlign: 'center',
                          fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
                          fontWeight: 900,
                          borderRadius: 12,
                          fontFamily: 'JetBrains Mono, monospace',
                          transition: 'all 0.2s ease',
                          background: digit ? 'rgba(200,0,10,0.1)' : 'var(--input-bg)',
                          border: digit ? '2px solid rgba(200,0,10,0.5)' : '1px solid var(--border-main)',
                          color: digit ? 'var(--peru-red)' : 'var(--text-primary)',
                          outline: 'none',
                          boxShadow: digit ? '0 0 14px rgba(200,0,10,0.15)' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handlePasteOtp}
                      className="btn-ghost"
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        color: 'var(--color-gold)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Clipboard size={12} />
                      <span>Pegar código copiado</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button type="submit" disabled={loading || !otpFull || success} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : success ? <><CheckCircle2 size={18} /><span>Acceso concedido</span></> : <><Shield size={18} /><span>Verificar y Acceder</span></>}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                    <button type="button" onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <ChevronLeft size={13} />
                      Cambiar correo
                    </button>
                    <button type="button" disabled={resendCooldown > 0 || loading} onClick={handleResend} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--peru-red)', background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer', opacity: resendCooldown > 0 ? 0.5 : 1 }}>
                      <RefreshCw size={12} />
                      {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <Shield size={11} style={{ color: 'var(--text-faint)' }} />
          <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textAlign: 'center', fontWeight: 600 }}>
            Sistema protegido · Autenticación en dos factores habilitada
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          {[{ label: 'Datos MEF', color: 'var(--peru-red)' }, { label: 'ML Predictivo', color: 'var(--color-gold)' }, { label: '25 Regiones', color: 'var(--color-success)' }].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
