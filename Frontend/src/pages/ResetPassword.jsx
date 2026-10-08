import { useState } from 'react'
import {
  useNavigate,
  useSearchParams
} from 'react-router-dom'

import hotelBg from '../assets/hotel-bg.jpg'
import './ResetPassword.css'

function ResetPassword() {
  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()

  const email =
    searchParams.get('email') || ''

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState('')

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!email) {
      setError(
        'Không tìm thấy email cần đặt lại mật khẩu.'
      )
      return
    }

    if (!password) {
      setError(
        'Vui lòng nhập mật khẩu mới'
      )
      return
    }

    if (password.length < 6) {
      setError(
        'Mật khẩu phải có ít nhất 6 ký tự'
      )
      return
    }

    if (password !== confirmPassword) {
      setError(
        'Xác nhận mật khẩu không khớp'
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5097/api/auth/reset-password',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            email: email,
            newPassword: password,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.message ||
          'Không thể đổi mật khẩu'
        )
        return
      }

      setSuccess(
        'Đổi mật khẩu thành công!'
      )

      setTimeout(() => {
        navigate('/login', {
          replace: true,
        })
      }, 1500)

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
      className="reset-page"
      style={{
        backgroundImage:
          `url(${hotelBg})`,
      }}
    >

      <div className="reset-card">

        <div className="reset-logo">
          H
        </div>

        <div className="reset-hotel-name">
          QUẢN LÝ KHÁCH SẠN
        </div>

        <h1>
          Đặt lại mật khẩu
        </h1>

        <p className="reset-subtitle">
          Tạo mật khẩu mới cho tài khoản
        </p>

        <form onSubmit={handleSubmit}>

          <div className="reset-form-group">

            <label>Email</label>

            <input
              type="email"
              value={email}
              disabled
            />

          </div>

          <div className="reset-form-group">

            <label>
              Mật khẩu mới
            </label>

            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

          </div>

          <div className="reset-form-group">

            <label>
              Xác nhận mật khẩu
            </label>

            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

          </div>

          {error && (
            <div className="reset-error">
              {error}
            </div>
          )}

          {success && (
            <div className="reset-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="reset-button"
            disabled={loading}
          >
            {loading
              ? 'Đang xử lý...'
              : 'Đổi mật khẩu'}
          </button>

        </form>

      </div>

    </div>
  )
}

export default ResetPassword