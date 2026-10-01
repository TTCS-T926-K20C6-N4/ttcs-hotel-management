import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_ORIGIN, api, formatMoney } from '../services/api'
import { ErrorBox, Loading } from '../components/Feedback'
import './RoomManagement.css'

const EMPTY_FORM = {
  roomNumber: '',
  floor: '1',
  roomTypeId: '',
  status: 'Available',
  note: '',
}

function EditRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [types, setTypes] = useState([])
  const [currentImage, setCurrentImage] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([api.getRoom(id), api.getRoomTypes()])
      .then(([room, roomTypes]) => {
        if (!active) return
        setForm({
          roomNumber: room.roomNumber || '',
          floor: String(room.floor || 1),
          roomTypeId: String(room.roomTypeId || ''),
          status: room.status || 'Available',
          note: room.note || '',
        })
        setCurrentImage(room.imageUrl || '')
        setTypes(roomTypes)
      })
      .catch((err) => { if (active) setLoadError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => () => {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  function handleImageChange(event) {
    const selectedImage = event.target.files?.[0] || null
    setImage(selectedImage)
    setPreview(selectedImage ? URL.createObjectURL(selectedImage) : '')
  }

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.roomNumber.trim()) {
      setError('Vui lòng nhập số phòng.')
      return
    }
    if (!form.roomTypeId) {
      setError('Vui lòng chọn thể loại phòng.')
      return
    }
    if (!Number.isInteger(Number(form.floor)) || Number(form.floor) < 1) {
      setError('Tầng phải là số nguyên lớn hơn hoặc bằng 1.')
      return
    }
    if (image && image.size > 5 * 1024 * 1024) {
      setError('Ảnh phải có dung lượng tối đa 5 MB.')
      return
    }

    setSaving(true)
    try {
      await api.updateRoom(id, {
        ...form,
        roomNumber: form.roomNumber.trim(),
        floor: Number(form.floor),
        roomTypeId: Number(form.roomTypeId),
        note: form.note.trim(),
      }, image)
      navigate('/rooms', { state: { notice: `Đã cập nhật phòng ${form.roomNumber.trim()}.` } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading text="Đang tải thông tin phòng..." />
  if (loadError) return <ErrorBox message={loadError} />

  const selectedType = types.find((type) => String(type.id) === form.roomTypeId)
  const previewUrl = preview || (currentImage ? `${API_ORIGIN}${currentImage}` : '')

  return (
    <main className="room-page room-edit-page">
      <header className="room-page-header">
        <div>
          <h1>Cập nhật phòng {form.roomNumber}</h1>
          <p>Chỉnh sửa thông tin và hình ảnh phòng</p>
        </div>
        <Link to="/rooms" className="room-secondary-action">← Danh sách phòng</Link>
      </header>

      <form className="room-edit-form" onSubmit={handleSubmit}>
        {error && <div className="room-form-error" role="alert">{error}</div>}

        <div className="room-edit-grid">
          <label className="room-field">
            <span>Số phòng <b>*</b></span>
            <input
              required
              value={form.roomNumber}
              onChange={(event) => update('roomNumber', event.target.value)}
              maxLength={30}
            />
          </label>

          <label className="room-field">
            <span>Tầng <b>*</b></span>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.floor}
              onChange={(event) => update('floor', event.target.value)}
            />
          </label>

          <label className="room-field">
            <span>Thể loại phòng <b>*</b></span>
            <select required value={form.roomTypeId} onChange={(event) => update('roomTypeId', event.target.value)}>
              <option value="">-- Chọn thể loại --</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>{type.name} — {formatMoney(type.pricePerNight)}/đêm</option>
              ))}
            </select>
            {selectedType && <small>Sức chứa tối đa {selectedType.capacity} người</small>}
          </label>

          <label className="room-field">
            <span>Trạng thái</span>
            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
              <option value="Available">Trống</option>
              <option value="Occupied">Đang thuê</option>
              <option value="Reserved">Đã đặt</option>
              <option value="Maintenance">Bảo trì</option>
            </select>
          </label>

          <label className="room-field room-field-wide">
            <span>Ghi chú</span>
            <textarea
              rows="4"
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              maxLength={1000}
            />
          </label>

          <div className="room-field room-field-wide">
            <span>Ảnh phòng</span>
            <div className="room-image-control">
              {previewUrl ? <img className="room-image-preview" src={previewUrl} alt="Xem trước ảnh phòng" /> : <div className="room-image-empty">Chưa có ảnh</div>}
              <div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
                <small>JPG, PNG hoặc WebP; tối đa 5 MB. Không chọn ảnh mới để giữ ảnh hiện tại.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="room-form-actions">
          <button type="submit" className="room-primary-action" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
          <Link to="/rooms" className="room-secondary-action">Hủy</Link>
        </div>
      </form>
    </main>
  )
}

export default EditRoom
