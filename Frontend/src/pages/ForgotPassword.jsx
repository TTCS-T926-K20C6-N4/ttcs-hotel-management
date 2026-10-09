import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import hotelBg from '../assets/hotel-bg.jpg'
import './ForgotPassword.css'

function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!email.trim()) {
      setError('Vui lòng nhập email')
      return
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email.trim())) {
      setError('Email không hợp lệ')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5097/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
          'Email chưa được đăng ký'
        )
        return
      }

      // Email hợp lệ -> sang trang đặt lại mật khẩu
      navigate(
        `/reset-password?email=${encodeURIComponent(
          email.trim()
        )}`
      )
    } catch (error) {
      console.error(error)

      setError(
        'Không thể kết nối đến máy chủ'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="forgot-page"
      style={{
        backgroundImage: `url(${hotelBg})`,
      }}
    >
      <div className="forgot-card">

        <div className="forgot-logo">
          H
        </div>

        <div className="forgot-hotel-name">
          QUẢN LÝ KHÁCH SẠN
        </div>

        <h1>
          Quên mật khẩu?
        </h1>

        <p className="forgot-subtitle">
          Nhập email đã đăng ký để đặt lại mật khẩu
        </p>

        <form onSubmit={handleSubmit}>

          <div className="forgot-form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />

            {error && (
              <span className="forgot-error">
                {error}
              </span>
            )}

          </div>

          <button
            type="submit"
            className="forgot-button"
            disabled={loading}
          >
            {loading
              ? 'Đang kiểm tra...'
              : 'Xác nhận'}
          </button>

        </form>

        <button
          type="button"
          className="back-login"
          onClick={() =>
            navigate('/login')
          }
        >
          ← Quay lại đăng nhập
        </button>

      </div>
    </div>
  )
}

export default ForgotPassword