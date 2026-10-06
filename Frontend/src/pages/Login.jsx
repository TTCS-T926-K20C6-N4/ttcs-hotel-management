import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import hotelBg from '../assets/hotel-bg.jpg'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  // ==========================================
  // STATE
  // ==========================================

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loginError, setLoginError] = useState('')

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })

  // ==========================================
  // KIỂM TRA SESSION
  // Nếu đã đăng nhập thì chuyển về Home
  // ==========================================

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const response = await fetch(
          'http://localhost:5097/api/auth/me',
          {
            method: 'GET',
            credentials: 'include',
          }
        )

        if (response.ok) {
          navigate('/', {
            replace: true,
          })
          return
        }
      } catch (error) {
        console.log(
          'Chưa có phiên đăng nhập.',
          error
        )
      } finally {
        setCheckingSession(false)
      }
    }

    checkExistingSession()
  }, [navigate])

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
    }

    // EMAIL
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập Email'
    } else {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Email không hợp lệ'
      }
    }

    // PASSWORD
    if (!password) {
      newErrors.password =
        'Vui lòng nhập mật khẩu'
    }

    setErrors(newErrors)

    return (
      !newErrors.email &&
      !newErrors.password
    )
  }

  // ==========================================
  // ĐĂNG NHẬP
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoginError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5097/api/auth/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          // Cho phép Backend tạo Session Cookie
          credentials: 'include',

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      )

      let data = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

      // ======================================
      // ĐĂNG NHẬP THẤT BẠI
      // ======================================

      if (!response.ok) {
        setLoginError(
          data.message ||
            'Email hoặc mật khẩu không chính xác.'
        )
        return
      }

      // ======================================
      // ĐĂNG NHẬP THÀNH CÔNG
      // LƯU JWT TOKEN
      // ======================================

      if (!data.token) {
        console.error(
          'Backend không trả về JWT token.'
        )

        setLoginError(
          'Đăng nhập thành công nhưng không nhận được token.'
        )

        return
      }

      // Lưu JWT để các API có [Authorize] sử dụng
      localStorage.setItem(
        'token',
        data.token
      )

      console.log(
        'Đăng nhập thành công:',
        data.user
      )

      // Chuyển về trang chủ
      navigate('/', {
        replace: true,
      })
    } catch (error) {
      console.error(
        'Lỗi đăng nhập:',
        error
      )

      setLoginError(
        'Không thể kết nối đến máy chủ.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // ĐANG KIỂM TRA SESSION
  // ==========================================

  if (checkingSession) {
    return (
      <div
        className="login-page"
        style={{
          backgroundImage: `url(${hotelBg})`,
        }}
      >
        <div
          className="login-card"
          style={{
            textAlign: 'center',
          }}
        >
          Đang kiểm tra đăng nhập...
        </div>
      </div>
    )
  }

  // ==========================================
  // GIAO DIỆN LOGIN
  // ==========================================

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${hotelBg})`,
      }}
    >
      <div className="login-card">

        {/* LOGO */}

        <div className="login-logo">
          H
        </div>

        <div className="hotel-name">
          QUẢN LÝ KHÁCH SẠN
        </div>

        {/* TIÊU ĐỀ */}

        <h1>
          Đăng nhập
        </h1>

        <p className="login-subtitle">
          Đăng nhập để tiếp tục sử dụng hệ thống
        </p>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          noValidate
        >

          {/* EMAIL */}

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Nhập email của bạn"
              value={email}
              className={
                errors.email
                  ? 'input-error'
                  : ''
              }
              onChange={(e) => {
                setEmail(e.target.value)

                setErrors({
                  ...errors,
                  email: '',
                })

                setLoginError('')
              }}
            />

            {errors.email && (
              <span className="error-message">
                {errors.email}
              </span>
            )}

          </div>

          {/* PASSWORD */}

          <div className="form-group">

            <label htmlFor="password">
              Mật khẩu
            </label>

            <div className="password-wrapper">

              <input
                id="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                className={
                  errors.password
                    ? 'input-error'
                    : ''
                }
                onChange={(e) => {
                  setPassword(
                    e.target.value
                  )

                  setErrors({
                    ...errors,
                    password: '',
                  })

                  setLoginError('')
                }}
              />

              <button
                type="button"
                className="eye-button"
                onClick={() => {
                  setShowPassword(
                    !showPassword
                  )
                }}
              >
                {
                  showPassword
                    ? 'Ẩn'
                    : 'Hiện'
                }
              </button>

            </div>

            {errors.password && (
              <span className="error-message">
                {errors.password}
              </span>
            )}

          </div>

          {/* LỖI ĐĂNG NHẬP */}

          {loginError && (
            <div className="error-message">
              {loginError}
            </div>
          )}

          {/* QUÊN MẬT KHẨU */}

          <div className="forgot-password">

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
              }}
            >
              Quên mật khẩu?
            </a>

          </div>

          {/* BUTTON ĐĂNG NHẬP */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {
              loading
                ? 'Đang đăng nhập...'
                : 'Đăng nhập'
            }
          </button>

          {/* CHUYỂN SANG ĐĂNG KÝ */}

          <div
            style={{
              textAlign: 'center',
              marginTop: '18px',
              fontSize: '14px',
            }}
          >
            <span
              style={{
                color: '#6b7280',
              }}
            >
              Chưa có tài khoản?{' '}
            </span>

            <button
              type="button"
              onClick={() =>
                navigate('/register')
              }
              style={{
                border: 'none',
                background: 'transparent',
                color: '#2563eb',
                fontWeight: '600',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Đăng ký
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}

export default Login