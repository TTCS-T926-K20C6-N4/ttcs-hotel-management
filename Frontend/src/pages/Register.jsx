import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './Register.css'


function Register() {

  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })


  // ==========================================
  // VALIDATE
  // ==========================================

  const validateForm = () => {

    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên'
    }

    if (!email.trim()) {

      newErrors.email = 'Vui lòng nhập Email'

    } else {

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Email không hợp lệ'
      }

    }

    if (!password) {

      newErrors.password = 'Vui lòng nhập mật khẩu'

    } else if (password.length < 6) {

      newErrors.password =
        'Mật khẩu phải có ít nhất 6 ký tự'

    }

    if (!confirmPassword) {

      newErrors.confirmPassword =
        'Vui lòng xác nhận mật khẩu'

    } else if (password !== confirmPassword) {

      newErrors.confirmPassword =
        'Mật khẩu xác nhận không khớp'

    }

    setErrors(newErrors)

    return !Object.values(newErrors).some(
      error => error !== ''
    )
  }


  // ==========================================
  // ĐĂNG KÝ
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault()

    setRegisterError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {

      const response = await fetch(
        'http://localhost:5097/api/auth/register',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          credentials: 'include',

          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            confirmPassword
          })
        }
      )

      let data = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {

        setRegisterError(
          data.message ||
          'Đăng ký tài khoản không thành công.'
        )

        return
      }

      alert('Đăng ký tài khoản thành công!')

      navigate('/login', {
        replace: true
      })

    } catch (error) {

      console.error(
        'Lỗi đăng ký:',
        error
      )

      setRegisterError(
        'Không thể kết nối đến máy chủ.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ==========================================
  // GIAO DIỆN
  // ==========================================

  return (

    <div className="register-page">

      <div className="register-card">


        {/* LOGO */}

        <div className="register-logo">
          H
        </div>


        <div className="hotel-name">
          HOTEL MANAGER
        </div>


        <h1>
          Đăng ký
        </h1>


        <p className="register-subtitle">
          Tạo tài khoản để sử dụng hệ thống
        </p>


        <form
          onSubmit={handleSubmit}
          noValidate
        >


          {/* HỌ VÀ TÊN */}

          <div className="form-group">

            <label htmlFor="fullName">
              Họ và tên
            </label>

            <input
              id="fullName"
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              className={
                errors.fullName
                  ? 'input-error'
                  : ''
              }
              onChange={(e) => {

                setFullName(e.target.value)

                setErrors({
                  ...errors,
                  fullName: ''
                })

                setRegisterError('')
              }}
            />

            {errors.fullName && (

              <span className="error-message">
                {errors.fullName}
              </span>

            )}

          </div>


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
                  email: ''
                })

                setRegisterError('')
              }}
            />

            {errors.email && (

              <span className="error-message">
                {errors.email}
              </span>

            )}

          </div>


          {/* MẬT KHẨU */}

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
                autoComplete="new-password"
                placeholder="Nhập mật khẩu"
                value={password}
                className={
                  errors.password
                    ? 'input-error'
                    : ''
                }
                onChange={(e) => {

                  setPassword(e.target.value)

                  setErrors({
                    ...errors,
                    password: ''
                  })

                  setRegisterError('')
                }}
              />

              <button
                type="button"
                className="eye-button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>

            </div>

            {errors.password && (

              <span className="error-message">
                {errors.password}
              </span>

            )}

          </div>


          {/* XÁC NHẬN MẬT KHẨU */}

          <div className="form-group">

            <label htmlFor="confirmPassword">
              Xác nhận mật khẩu
            </label>

            <div className="password-wrapper">

              <input
                id="confirmPassword"
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                className={
                  errors.confirmPassword
                    ? 'input-error'
                    : ''
                }
                onChange={(e) => {

                  setConfirmPassword(
                    e.target.value
                  )

                  setErrors({
                    ...errors,
                    confirmPassword: ''
                  })

                  setRegisterError('')
                }}
              />

              <button
                type="button"
                className="eye-button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {
                  showConfirmPassword
                    ? 'Ẩn'
                    : 'Hiện'
                }
              </button>

            </div>

            {errors.confirmPassword && (

              <span className="error-message">
                {errors.confirmPassword}
              </span>

            )}

          </div>


          {/* LỖI BACKEND */}

          {registerError && (

            <div className="error-message register-error">
              {registerError}
            </div>

          )}


          {/* NÚT ĐĂNG KÝ */}

          <button
            type="submit"
            className="register-button"
            disabled={loading}
          >
            {
              loading
                ? 'Đang đăng ký...'
                : 'Đăng ký'
            }
          </button>


          {/* QUAY VỀ LOGIN */}

          <div className="login-link">

            <span>
              Đã có tài khoản?{' '}
            </span>

            <button
              type="button"
              onClick={() =>
                navigate('/login')
              }
            >
              Đăng nhập
            </button>

          </div>


        </form>

      </div>

    </div>

  )

}

export default Register