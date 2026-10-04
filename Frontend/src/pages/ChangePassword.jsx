import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import './ChangePassword.css'

function ChangePassword() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      setError('Vui lòng nhập đầy đủ thông tin.')
      return
    }

    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp.')
      return
    }

    if (form.currentPassword === form.newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }

    try {
      setSaving(true)

      const result = await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })

      setSuccess(
        result?.message || 'Đổi mật khẩu thành công!'
      )

      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setError(
        err?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cp-page">

      <div className="cp-card">

        <div className="cp-icon">
          🔐
        </div>

        <div className="cp-header">
          <h1>Đổi mật khẩu</h1>

          <p>
            Cập nhật mật khẩu mới để tăng cường
            bảo mật cho tài khoản của bạn.
          </p>
        </div>

        {success && (
          <div className="cp-message cp-success">
            <div className="cp-message-icon">✓</div>

            <div>
              <strong>Thành công!</strong>
              <p>{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="cp-message cp-error">
            <div className="cp-message-icon">!</div>

            <div>
              <strong>Không thể đổi mật khẩu</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="cp-form-group">
            <label htmlFor="currentPassword">
              Mật khẩu hiện tại
            </label>

            <div className="cp-password-box">
              <span className="cp-lock">🔒</span>

              <input
                id="currentPassword"
                name="currentPassword"
                type={
                  showCurrentPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Nhập mật khẩu hiện tại"
                value={form.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
              />

              <button
                type="button"
                className="cp-show-password"
                onClick={() =>
                  setShowCurrentPassword(
                    (prev) => !prev
                  )
                }
              >
                {showCurrentPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div className="cp-divider"></div>

          <div className="cp-form-group">
            <label htmlFor="newPassword">
              Mật khẩu mới
            </label>

            <div className="cp-password-box">
              <span className="cp-lock">🔑</span>

              <input
                id="newPassword"
                name="newPassword"
                type={
                  showNewPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Nhập mật khẩu mới"
                value={form.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <button
                type="button"
                className="cp-show-password"
                onClick={() =>
                  setShowNewPassword(
                    (prev) => !prev
                  )
                }
              >
                {showNewPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>

            <div className="cp-hint">
              Mật khẩu phải có ít nhất 6 ký tự.
            </div>
          </div>

          <div className="cp-form-group">
            <label htmlFor="confirmPassword">
              Xác nhận mật khẩu mới
            </label>

            <div className="cp-password-box">
              <span className="cp-lock">🔑</span>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Nhập lại mật khẩu mới"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <button
                type="button"
                className="cp-show-password"
                onClick={() =>
                  setShowConfirmPassword(
                    (prev) => !prev
                  )
                }
              >
                {showConfirmPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div className="cp-actions">

            <button
              type="button"
              className="cp-cancel"
              onClick={() => navigate('/')}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="cp-submit"
              disabled={saving}
            >
              {saving
                ? 'Đang cập nhật...'
                : '🔐 Đổi mật khẩu'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

export default ChangePassword