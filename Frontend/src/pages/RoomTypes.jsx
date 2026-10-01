import { useCallback, useEffect, useState } from 'react'
import { api, formatMoney } from '../services/api'
import './RoomTypes.css'

const emptyForm = { name: '', pricePerNight: '', capacity: 2, description: '' }

function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadRoomTypes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getRoomTypes()
      setRoomTypes(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(loadError.message || 'Không tải được danh sách thể loại phòng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoomTypes()
  }, [loadRoomTypes])

  const startEditing = (roomType) => {
    setEditing(roomType)
    setForm({
      name: roomType.name || '',
      pricePerNight: roomType.pricePerNight ?? '',
      capacity: roomType.capacity ?? 1,
      description: roomType.description || '',
    })
    setError('')
    setNotice('')
  }

  const stopEditing = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const pricePerNight = Number(form.pricePerNight)
    const capacity = Number(form.capacity)

    if (!name) {
      setError('Vui lòng nhập tên thể loại phòng.')
      return
    }
    if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
      setError('Giá mỗi đêm phải là số không âm.')
      return
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      setError('Sức chứa phải là số nguyên lớn hơn 0.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const result = await api.updateRoomType(editing.id, {
        name,
        pricePerNight,
        capacity,
        description: form.description.trim() || null,
      })
      const updated = result?.data || {
        id: editing.id,
        name,
        pricePerNight,
        capacity,
        description: form.description.trim() || null,
      }
      setRoomTypes((current) => current.map((item) => item.id === editing.id ? updated : item))
      setEditing(null)
      setNotice('Cập nhật thể loại phòng thành công.')
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật thể loại phòng.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="room-types-page">
      <div className="room-types-heading">
        <div>
          <h1>Thể loại phòng</h1>
          <p>Xem và cập nhật thông tin, giá thuê, sức chứa của từng thể loại.</p>
        </div>
        <button className="room-types-refresh" type="button" onClick={loadRoomTypes} disabled={loading}>
          Làm mới
        </button>
      </div>

      {notice && <div className="room-types-notice" role="status">{notice}</div>}
      {error && <div className="room-types-error" role="alert">{error}</div>}

      {editing && (
        <form className="room-type-editor" onSubmit={handleSubmit}>
          <div className="room-type-editor-heading">
            <div>
              <h2>Cập nhật thể loại phòng</h2>
              <p>Đang chỉnh sửa: {editing.name}</p>
            </div>
            <button type="button" className="room-type-close" onClick={stopEditing} aria-label="Đóng">×</button>
          </div>

          <div className="room-type-fields">
            <label>
              Tên thể loại <span>*</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} required />
            </label>
            <label>
              Giá mỗi đêm (₫) <span>*</span>
              <input type="number" min="0" step="1000" value={form.pricePerNight} onChange={(event) => setForm({ ...form, pricePerNight: event.target.value })} required />
            </label>
            <label>
              Sức chứa (người) <span>*</span>
              <input type="number" min="1" step="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} required />
            </label>
            <label className="room-type-description">
              Mô tả
              <textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={500} />
            </label>
          </div>

          <div className="room-type-form-actions">
            <button type="button" className="room-type-cancel" onClick={stopEditing} disabled={saving}>Hủy</button>
            <button type="submit" className="room-type-save" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      <div className="room-types-table-wrap">
        {loading ? <div className="room-types-empty">Đang tải thể loại phòng...</div> : roomTypes.length === 0 ? (
          <div className="room-types-empty">Chưa có thể loại phòng.</div>
        ) : (
          <table className="room-types-table">
            <thead>
              <tr><th>Thể loại</th><th>Giá mỗi đêm</th><th>Sức chứa</th><th>Mô tả</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {roomTypes.map((roomType) => (
                <tr key={roomType.id}>
                  <td><strong>{roomType.name}</strong></td>
                  <td>{formatMoney(roomType.pricePerNight)}</td>
                  <td>{roomType.capacity} người</td>
                  <td className="room-type-description-cell">{roomType.description || '—'}</td>
                  <td><button type="button" className="room-type-edit" onClick={() => startEditing(roomType)}>Cập nhật</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default RoomTypes
