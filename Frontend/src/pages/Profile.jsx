import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import Toast from '../components/Toast'
import './Profile.css'

const MAX_AVATAR_SIZE = 1024 * 1024
const TODAY = new Date().toISOString().slice(0, 10)

function Profile() {
  const fileInputRef = useRef(null)
  const [profile, setProfile] = useState({
    fullName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    avatar: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [savedAvatarUrl, setSavedAvatarUrl] = useState('')
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const result = await api.getCurrentUser()
        const user = result?.user || {}

        if (active) {
          const avatarUrl = user.avatarUrl || ''
          setProfile({
            fullName: user.fullName || '',
            dateOfBirth: user.dateOfBirth || '',
            email: user.email || '',
            phone: user.phone || '',
            avatar: avatarUrl,
          })
          setSavedAvatarUrl(avatarUrl)
        }
      } catch (error) {
        if (active) {
          setToast({
            type: 'error',
            message: error.message || 'Không thể tải thông tin tài khoản.',
          })
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setToast({ type: 'error', message: 'Ảnh đại diện cần có định dạng JPG, PNG hoặc WEBP.' })
      event.target.value = ''
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setToast({ type: 'error', message: 'Ảnh đại diện không được vượt quá 1 MB.' })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((current) => ({ ...current, avatar: reader.result }))
      setAvatarFile(file)
      setAvatarRemoved(false)
      setToast(null)
    }
    reader.onerror = () => {
      setToast({ type: 'error', message: 'Không thể đọc tệp ảnh đã chọn.' })
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errors = {}
    const trimmedName = profile.fullName.trim()

    if (!trimmedName) errors.fullName = 'Vui lòng nhập họ và tên.'
    if (!profile.dateOfBirth) {
      errors.dateOfBirth = 'Vui lòng chọn ngày sinh.'
    } else if (profile.dateOfBirth > TODAY) {
      errors.dateOfBirth = 'Ngày sinh không thể ở tương lai.'
    }

    if (!profile.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại.'
    } else if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(profile.phone.replace(/[\s.-]/g, ''))) {
      errors.phone = 'Số điện thoại chưa đúng định dạng Việt Nam.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setToast(null)

    if (!validate()) return

    setSaving(true)
    try {
      const result = await api.updateProfile({
        fullName: profile.fullName.trim(),
        dateOfBirth: profile.dateOfBirth,
        phone: profile.phone.trim(),
      })

      setProfile((current) => ({
        ...current,
        fullName: result?.user?.fullName || current.fullName.trim(),
      }))

      let avatarUrl = savedAvatarUrl
      try {
        if (avatarFile) {
          const uploadResult = await api.uploadProfileAvatar(avatarFile)
          avatarUrl = uploadResult.avatarUrl
        } else if (avatarRemoved && savedAvatarUrl) {
          await api.deleteProfileAvatar()
          avatarUrl = ''
        }
      } catch (error) {
        setToast({
          type: 'error',
          message: `Thông tin đã cập nhật nhưng ảnh chưa được lưu: ${error.message}`,
        })
        return
      }

      setSavedAvatarUrl(avatarUrl)
      setAvatarFile(null)
      setAvatarRemoved(false)
      setProfile((current) => ({ ...current, avatar: avatarUrl }))
      setToast({
        type: 'success',
        message: result?.message || 'Cập nhật thông tin cá nhân thành công.',
      })
    } catch (error) {
      setToast({
        type: 'error',
        message: error.message || 'Không thể cập nhật thông tin cá nhân.',
      })
    } finally {
      setSaving(false)
    }
  }

  const initials = profile.fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  if (loading) {
    return <div className="profile-loading">Đang tải thông tin cá nhân...</div>
  }

  return (
    <section className="profile-page">
      <header className="profile-heading">
        <div>
          <p className="profile-eyebrow">TÀI KHOẢN</p>
          <h1>Thông tin cá nhân</h1>
          <p className="profile-subtitle">Quản lý thông tin liên hệ và hồ sơ của bạn.</p>
        </div>
      </header>

      <div className="profile-grid">
        <aside className="profile-overview">
          <div className="profile-avatar" aria-label="Ảnh đại diện">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Ảnh đại diện" />
            ) : (
              <span>{initials || 'U'}</span>
            )}
          </div>
          <h2>{profile.fullName || 'Tên người dùng'}</h2>
          <p>{profile.email || 'Chưa có email'}</p>
          <span className="profile-status"><i /> Tài khoản đang hoạt động</span>
          <div className="profile-overview-rule" />
          <p className="profile-avatar-note">Ảnh JPG, PNG hoặc WEBP. Tối đa 1 MB.</p>
          <button
            className="profile-photo-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Chọn ảnh đại diện
          </button>
          <input
            ref={fileInputRef}
            className="profile-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            aria-label="Tải ảnh đại diện lên"
          />
          {profile.avatar && (
            <button
              className="profile-remove-photo"
              type="button"
              onClick={() => {
                setProfile((current) => ({ ...current, avatar: '' }))
                setAvatarFile(null)
                setAvatarRemoved(Boolean(savedAvatarUrl))
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Xóa ảnh
            </button>
          )}
        </aside>

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="profile-form-heading">
            <div>
              <h2>Chi tiết hồ sơ</h2>
              <p>Các trường có dấu <b>*</b> là bắt buộc.</p>
            </div>
            <span className="profile-lock-label">Email không thể thay đổi</span>
          </div>

          <div className="profile-fields">
            <div className={`profile-field ${fieldErrors.fullName ? 'has-error' : ''}`}>
              <label htmlFor="profile-full-name">Họ và tên <b>*</b></label>
              <input
                id="profile-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Nhập họ và tên"
                value={profile.fullName}
                onChange={handleChange}
                maxLength={100}
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? 'profile-name-error' : undefined}
              />
              {fieldErrors.fullName && <small id="profile-name-error">{fieldErrors.fullName}</small>}
            </div>

            <div className={`profile-field ${fieldErrors.dateOfBirth ? 'has-error' : ''}`}>
              <label htmlFor="profile-birthday">Ngày sinh <b>*</b></label>
              <input
                id="profile-birthday"
                name="dateOfBirth"
                type="date"
                max={TODAY}
                value={profile.dateOfBirth}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                aria-describedby={fieldErrors.dateOfBirth ? 'profile-birthday-error' : undefined}
              />
              {fieldErrors.dateOfBirth && <small id="profile-birthday-error">{fieldErrors.dateOfBirth}</small>}
            </div>

            <div className="profile-field profile-field-readonly">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email}
                readOnly
                aria-readonly="true"
              />
              <span>Email được liên kết với tài khoản đăng nhập.</span>
            </div>

            <div className={`profile-field ${fieldErrors.phone ? 'has-error' : ''}`}>
              <label htmlFor="profile-phone">Số điện thoại <b>*</b></label>
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="Ví dụ: 0912345678"
                value={profile.phone}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined}
              />
              {fieldErrors.phone && <small id="profile-phone-error">{fieldErrors.phone}</small>}
            </div>
          </div>

          <footer className="profile-form-footer">
            <p>Thông tin được lưu vào tài khoản của bạn.</p>
            <button type="submit" disabled={saving}>
              {saving ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </footer>
        </form>
      </div>

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </section>
  )
}

export default Profile