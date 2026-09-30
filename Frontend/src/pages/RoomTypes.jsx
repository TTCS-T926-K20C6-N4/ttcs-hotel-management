import { useEffect, useState } from 'react'
import './RoomTypes.css'

const API_URL = 'http://localhost:5097'
const EMPTY_FORM = { name: '', pricePerNight: '', capacity: '2', description: '' }
const ALLOWED_ROLES = ['Admin', 'Manager']

function formatMoney(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

async function readResponse(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const validationMessage = body.errors
      ? Object.values(body.errors).flat().join(' ')
      : ''
    throw new Error(body.message || validationMessage || 'Không thể xử lý yêu cầu.')
  }
  return body
}

function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canCreate = ALLOWED_ROLES.includes(role)

  async function loadPage() {
    const [profileResponse, typesResponse] = await Promise.all([
      fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }),
      fetch(`${API_URL}/api/rooms/room-types`, { credentials: 'include' }),
    ])
    const profile = await readResponse(profileResponse)
    const types = await readResponse(typesResponse)
    setRole(profile.user?.role || '')
    setRoomTypes(types)
  }

  useEffect(() => {
    loadPage()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const result = await readResponse(await fetch(`${API_URL}/api/rooms/room-types`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          pricePerNight: Number(form.pricePerNight),
          capacity: Number(form.capacity),
          description: form.description.trim() || null,
        }),
      }))
      setRoomTypes((current) => [...current, result.data])
      setForm(EMPTY_FORM)
      setSuccess('Đã tạo loại phòng mới.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="room-types-state">Đang tải dữ liệu...</p>
  if (error && roomTypes.length === 0) {
    return <p className="room-types-alert room-types-alert--error">{error}</p>
  }

  return (
    <section className="room-types-page">
      <header className="room-types-heading">
        <div>
          <p className="room-types-eyebrow">DANH MỤC PHÒNG</p>
          <h1>Thể loại phòng</h1>
          <p>Thiết lập giá và sức chứa cho từng loại phòng.</p>
        </div>
        <span className="room-types-count">{roomTypes.length} loại</span>
      </header>

      {canCreate ? (
        <section className="room-types-panel" aria-labelledby="create-room-type-title">
          <h2 id="create-room-type-title">Thêm loại phòng</h2>
          {error && <p className="room-types-alert room-types-alert--error" role="alert">{error}</p>}
          {success && <p className="room-types-alert room-types-alert--success" role="status">{success}</p>}
          <form className="room-types-form" onSubmit={handleSubmit}>
            <label className="room-types-field">
              Tên loại phòng <span aria-hidden="true">*</span>
              <input
                autoComplete="off"
                maxLength="80"
                required
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Ví dụ: Deluxe, Suite"
              />
            </label>
            <label className="room-types-field">
              Giá cơ bản mỗi đêm (VND) <span aria-hidden="true">*</span>
              <input
                type="number"
                min="0.01"
                max="999999999999.99"
                step="0.01"
                required
                value={form.pricePerNight}
                onChange={(event) => update('pricePerNight', event.target.value)}
                placeholder="1200000"
              />
            </label>
            <label className="room-types-field">
              Số người tối đa <span aria-hidden="true">*</span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                required
                value={form.capacity}
                onChange={(event) => update('capacity', event.target.value)}
              />
            </label>
            <label className="room-types-field room-types-field--wide">
              Mô tả
              <textarea
                maxLength="500"
                rows="3"
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Tiện nghi hoặc đặc điểm nổi bật"
              />
            </label>
            <div className="room-types-form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Tạo loại phòng'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <p className="room-types-alert room-types-alert--error" role="status">
          Tài khoản của bạn không có quyền tạo loại phòng. Chức năng này dành cho Admin hoặc Manager.
        </p>
      )}

      <section className="room-types-list" aria-labelledby="room-types-list-title">
        <div className="room-types-list-heading">
          <h2 id="room-types-list-title">Danh sách hiện có</h2>
        </div>
        {roomTypes.length === 0 ? (
          <p className="room-types-empty">Chưa có loại phòng nào được tạo.</p>
        ) : (
          <div className="room-types-table-wrap">
            <table className="room-types-table">
              <thead>
                <tr>
                  <th>Tên loại phòng</th>
                  <th>Giá mỗi đêm</th>
                  <th>Sức chứa</th>
                  <th>Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.map((roomType) => (
                  <tr key={roomType.id}>
                    <td className="room-types-name">{roomType.name}</td>
                    <td>{formatMoney(roomType.pricePerNight)}</td>
                    <td>{roomType.capacity} người</td>
                    <td>{roomType.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}

export default RoomTypes