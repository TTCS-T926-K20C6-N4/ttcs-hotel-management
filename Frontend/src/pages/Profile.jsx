import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import './Profile.css'

const API_ORIGIN = 'http://localhost:5097'

function getImageSource(imageUrl) {
  if (!imageUrl) return ''
  return imageUrl.startsWith('/') ? `${API_ORIGIN}${imageUrl}` : imageUrl
}

function Profile() {
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    email: '',
    phoneNumber: '',
    avatarUrl: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const currentUser = await api.getCurrentUser()
        if (!active) return

        setForm({
          fullName: currentUser.fullName || '',
          dateOfBirth: currentUser.dateOfBirth || '',
          email: currentUser.email || '',
          phoneNumber: currentUser.phoneNumber || '',
          avatarUrl: currentUser.avatarUrl || '',
        })
        setAvatarPreview(getImageSource(currentUser.avatarUrl))
      } catch (loadError) {
        if (active) setError(loadError.message || 'Không thể tải thông tin cá nhân.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    setError('')
    setSuccess('')
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    setError('')
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Chỉ hỗ trợ JPG, JPEG, PNG hoặc WEBP.')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Hình ảnh không được vượt quá 5 MB.')
      event.target.value = ''
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function removeAvatar() {
    setAvatarFile(null)
    setForm((current) => ({ ...current, avatarUrl: '' }))
    setAvatarPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validate() {
    const nextErrors = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập tên đầy đủ.'
    if (!form.dateOfBirth) nextErrors.dateOfBirth = 'Vui lòng chọn ngày sinh.'
    if (!form.phoneNumber.trim()) nextErrors.phoneNumber = 'Vui lòng nhập số điện thoại.'
    else if (!/^\+?[0-9\s()-]{7,30}$/.test(form.phoneNumber.trim())) {
      nextErrors.phoneNumber = 'Số điện thoại không hợp lệ.'
    }
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!validate()) return

    setSaving(true)
    try {
      let avatarUrl = form.avatarUrl
      if (avatarFile) {
        const uploadResult = await api.uploadProfileImage(avatarFile)
        avatarUrl = uploadResult.avatarUrl
      }

      await api.updateProfile({
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        phoneNumber: form.phoneNumber.trim(),
        avatarUrl,
      })

      setForm((current) => ({ ...current, avatarUrl }))
      setAvatarPreview(getImageSource(avatarUrl))
      setAvatarFile(null)
      setSuccess('Thông tin cá nhân đã được cập nhật thành công!')
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật thông tin cá nhân.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="profile-loading">Đang tải thông tin cá nhân...</div>
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <span className="profile-eyebrow">TÀI KHOẢN / THÔNG TIN CÁ NHÂN</span>
          <h1>Thông tin cá nhân</h1>
          <p>Cập nhật dữ liệu của bạn và thêm ảnh đại diện.</p>
        </div>
      </header>

      {success && <div className="profile-alert profile-success" role="status">✓ {success}</div>}
      {error && <div className="profile-alert profile-error" role="alert">{error}</div>}

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <section className="profile-card profile-photo-card">
          <div className="profile-card-heading">
            <div className="profile-heading-icon">▣</div>
            <div>
              <h2>Ảnh đại diện</h2>
              <p>Hình ảnh rõ nét, định dạng JPG, PNG hoặc WEBP.</p>
            </div>
          </div>

          <div className="profile-avatar-layout">
            <div className="profile-avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Ảnh đại diện hiện tại" />
              ) : (
                <span>USER</span>
              )}
            </div>
            <div className="profile-avatar-actions">
              <label className="profile-upload-button" htmlFor="profile-avatar">
                <span>＋</span> Chọn ảnh
              </label>
              <input
                ref={fileInputRef}
                id="profile-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={saving}
              />
              {avatarPreview && <button type="button" onClick={removeAvatar} disabled={saving}>Gỡ ảnh</button>}
              <small>Tối đa 5 MB</small>
            </div>
          </div>
        </section>

        <section className="profile-card profile-details-card">
          <div className="profile-card-heading">
            <div className="profile-heading-icon">✦</div>
            <div>
              <h2>Thông tin cơ bản</h2>
              <p>Các trường có dấu * là bắt buộc.</p>
            </div>
          </div>

          <div className="profile-fields">
            <div className="profile-field profile-field-wide">
              <label htmlFor="fullName">Tên đầy đủ <span>*</span></label>
              <input
                id="fullName"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                maxLength={100}
                required
                disabled={saving}
              />
              {fieldErrors.fullName && <small className="profile-error">{fieldErrors.fullName}</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="dateOfBirth">Ngày sinh <span>*</span></label>
              <input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => updateField('dateOfBirth', event.target.value)}
                required
                disabled={saving}
              />
              {fieldErrors.dateOfBirth && <small className="profile-error">{fieldErrors.dateOfBirth}</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="phoneNumber">Số điện thoại <span>*</span></label>
              <input
                id="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
                placeholder="Ví dụ: +84 987 654 321"
                maxLength={30}
                required
                disabled={saving}
              />
              {fieldErrors.phoneNumber && <small className="profile-error">{fieldErrors.phoneNumber}</small>}
            </div>

            <div className="profile-field profile-field-wide">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                disabled
                aria-describedby="profile-email-note"
              />
              <small id="profile-email-note" className="profile-helper">Email không thể chỉnh sửa.</small>
            </div>
          </div>

          <div className="profile-actions">
            <button type="submit" className="profile-save" disabled={saving}>
              {saving ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}

export default Profile
