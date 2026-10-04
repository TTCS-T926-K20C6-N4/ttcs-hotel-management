import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, formatMoney } from '../services/api'
import { ErrorBox, Loading } from '../components/Feedback'
import './EditRoom.css'

const API_ORIGIN = 'http://localhost:5097'

const STATUS_LABELS = {
  0: 'Phòng trống',
  1: 'Đang có khách',
  2: 'Đang bảo trì',
  3: 'Đã đặt trước',
  Available: 'Phòng trống',
  Occupied: 'Đang có khách',
  Maintenance: 'Đang bảo trì',
  Reserved: 'Đã đặt trước',
}

function getImageSource(imageUrl) {
  if (!imageUrl) return ''
  return imageUrl.startsWith('/') ? `${API_ORIGIN}${imageUrl}` : imageUrl
}

function EditRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [room, setRoom] = useState(null)
  const [types, setTypes] = useState([])
  const [form, setForm] = useState({
    roomNumber: '',
    floor: '',
    roomTypeId: '',
    note: '',
  })
  const [imageUrl, setImageUrl] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [roomData, roomTypes] = await Promise.all([
          api.getRoomById(id),
          api.getRoomTypes(),
        ])

        if (!active) return
        setRoom(roomData)
        setTypes(Array.isArray(roomTypes) ? roomTypes : [])
        setForm({
          roomNumber: roomData.roomNumber ?? '',
          floor: String(roomData.floor ?? ''),
          roomTypeId: String(roomData.roomTypeId ?? ''),
          note: roomData.note ?? '',
        })
        setImageUrl(roomData.imageUrl ?? null)
        setImagePreview(getImageSource(roomData.imageUrl))
      } catch (loadError) {
        if (active) setLoadError(loadError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!imagePreview.startsWith('blob:')) return undefined
    return () => URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    setError('')
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      event.target.value = ''
      setError('Chỉ hỗ trợ hình ảnh JPG, JPEG, PNG hoặc WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = ''
      setError('Hình ảnh không được vượt quá 5 MB.')
      return
    }

    setImageFile(file)
    setImageUrl(null)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImageUrl(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const roomNumber = form.roomNumber.trim()
    const floor = Number(form.floor)
    const roomTypeId = Number(form.roomTypeId)

    if (!roomNumber) {
      setError('Vui lòng nhập số phòng.')
      return
    }
    if (roomNumber.length > 50) {
      setError('Số phòng không được vượt quá 50 ký tự.')
      return
    }
    if (!Number.isInteger(floor) || floor < 1) {
      setError('Tầng phải là số nguyên lớn hơn 0.')
      return
    }
    if (!Number.isInteger(roomTypeId) || roomTypeId < 1) {
      setError('Vui lòng chọn thể loại phòng.')
      return
    }

    setSaving(true)
    try {
      let nextImageUrl = imageUrl
      if (imageFile) {
        const uploadResult = await api.uploadRoomImage(imageFile)
        nextImageUrl = uploadResult.imageUrl
      }

      await api.updateRoom(id, {
        roomNumber,
        floor,
        roomTypeId,
        note: form.note.trim() || null,
        imageUrl: nextImageUrl,
      })
      navigate('/rooms', {
        state: { roomUpdated: roomNumber },
      })
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật phòng. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading message="Đang tải thông tin phòng..." />
  if (loadError) return <ErrorBox message={loadError} />
  if (!room) return <ErrorBox message="Không tìm thấy phòng cần cập nhật." />

  const selectedType = types.find(
    (type) => String(type.id) === form.roomTypeId,
  )
  const statusLabel = STATUS_LABELS[room.status] ?? 'Không xác định'

  return (
    <div className="edit-room-page">
      <header className="edit-room-header">
        <div>
          <div className="edit-room-eyebrow">QUẢN LÝ PHÒNG / CẬP NHẬT</div>
          <h1>Cập nhật phòng {room.roomNumber}</h1>
          <p>Cập nhật thông tin chi tiết và hình ảnh đại diện cho phòng.</p>
        </div>
        <Link to="/rooms" className="edit-room-back">
          <span aria-hidden="true">←</span> Danh sách phòng
        </Link>
      </header>

      <div className="edit-room-notice">
        <span className="edit-room-notice-icon" aria-hidden="true">i</span>
        <p>
          Trạng thái thuê hiện tại được giữ nguyên để không ảnh hưởng đến đặt
          phòng và các lượt thuê đang hoạt động.
        </p>
        <span className="edit-room-status">{statusLabel}</span>
      </div>

      <form className="edit-room-form" onSubmit={handleSubmit}>
        <section className="edit-room-card">
          <div className="edit-room-card-heading">
            <div className="edit-room-card-icon" aria-hidden="true">⌂</div>
            <div>
              <h2>Thông tin cơ bản</h2>
              <p>Các mục có dấu <span>*</span> là bắt buộc.</p>
            </div>
          </div>

          {error && (
            <div className="edit-room-error" role="alert">{error}</div>
          )}

          <div className="edit-room-fields">
            <div className="edit-room-field">
              <label htmlFor="edit-room-number">Số phòng <span>*</span></label>
              <input
                id="edit-room-number"
                value={form.roomNumber}
                onChange={(event) => update('roomNumber', event.target.value)}
                placeholder="Ví dụ: 101, A203"
                maxLength={50}
                required
                disabled={saving}
              />
              <small>Mã phòng cần duy nhất trong khách sạn.</small>
            </div>

            <div className="edit-room-field">
              <label htmlFor="edit-room-floor">Tầng <span>*</span></label>
              <input
                id="edit-room-floor"
                type="number"
                min="1"
                step="1"
                value={form.floor}
                onChange={(event) => update('floor', event.target.value)}
                required
                disabled={saving}
              />
              <small>Nhập tầng hiện tại của phòng.</small>
            </div>

            <div className="edit-room-field edit-room-field-full">
              <label htmlFor="edit-room-type">Thể loại phòng <span>*</span></label>
              <select
                id="edit-room-type"
                value={form.roomTypeId}
                onChange={(event) => update('roomTypeId', event.target.value)}
                required
                disabled={saving}
              >
                <option value="">-- Chọn thể loại phòng --</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} — {formatMoney(type.pricePerNight)}/đêm
                  </option>
                ))}
              </select>
              {selectedType && (
                <div className="edit-room-type-summary">
                  <span><strong>{formatMoney(selectedType.pricePerNight)}</strong> / đêm</span>
                  <span>Sức chứa <strong>{selectedType.capacity} người</strong></span>
                  {selectedType.description && <p>{selectedType.description}</p>}
                </div>
              )}
            </div>

            <div className="edit-room-field edit-room-field-full">
              <label htmlFor="edit-room-note">Mô tả / Ghi chú</label>
              <textarea
                id="edit-room-note"
                value={form.note}
                onChange={(event) => update('note', event.target.value)}
                placeholder="Ví dụ: Phòng có ban công, view đẹp, gần thang máy..."
                maxLength={2000}
                rows={4}
                disabled={saving}
              />
              <small>Thông tin bổ sung giúp nhân viên nhận biết đặc điểm phòng.</small>
            </div>
          </div>
        </section>

        <aside className="edit-room-side">
          <section className="edit-room-card edit-room-image-card">
            <div className="edit-room-card-heading">
              <div className="edit-room-card-icon edit-room-image-icon" aria-hidden="true">▧</div>
              <div>
                <h2>Ảnh phòng</h2>
                <p>Ảnh đẹp giúp nhận diện phòng nhanh hơn.</p>
              </div>
            </div>

            {imagePreview ? (
              <div className="edit-room-preview">
                <img src={imagePreview} alt={`Hình ảnh phòng ${room.roomNumber}`} />
                <button
                  type="button"
                  className="edit-room-remove-image"
                  onClick={removeImage}
                  disabled={saving}
                >
                  Gỡ ảnh
                </button>
              </div>
            ) : (
              <label className="edit-room-upload" htmlFor="edit-room-image">
                <span className="edit-room-upload-icon" aria-hidden="true">＋</span>
                <strong>Chọn ảnh từ thiết bị</strong>
                <span>JPG, PNG, WEBP · Tối đa 5 MB</span>
              </label>
            )}
            <input
              ref={fileInputRef}
              id="edit-room-image"
              className="edit-room-file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={saving}
            />
            {imagePreview && (
              <label className="edit-room-change-image" htmlFor="edit-room-image">
                Thay ảnh khác
              </label>
            )}
          </section>

          <div className="edit-room-tip">
            <span aria-hidden="true">✦</span>
            <div>
              <strong>Gợi ý hình ảnh</strong>
              <p>Sử dụng ảnh rõ nét, đủ sáng và thể hiện đúng không gian phòng.</p>
            </div>
          </div>
        </aside>

        <footer className="edit-room-actions">
          <Link to="/rooms" className="edit-room-cancel">Hủy bỏ</Link>
          <button type="submit" className="edit-room-submit" disabled={saving || types.length === 0}>
            {saving ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
          </button>
        </footer>
      </form>
    </div>
  )
}

export default EditRoom
