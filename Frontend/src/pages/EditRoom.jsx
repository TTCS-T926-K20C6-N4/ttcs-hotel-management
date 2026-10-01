import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_ORIGIN, api, formatMoney } from '../services/api'
import { ErrorBox, Loading } from '../components/Feedback'
import './AddRoom.css'

function statusToNumber(status) {
  if (typeof status === 'number') return status

  return {
    Available: 0,
    Occupied: 1,
    Maintenance: 2,
    Reserved: 3,
  }[status] ?? 0
}

function EditRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [types, setTypes] = useState([])
  const [currentImage, setCurrentImage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
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
          floor: String(room.floor ?? 1),
          roomTypeId: String(room.roomTypeId ?? ''),
          status: statusToNumber(room.status),
          note: room.note || '',
        })
        setCurrentImage(room.imageUrl || '')
        setTypes(Array.isArray(roomTypes) ? roomTypes : [])
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Không thể tải thông tin phòng.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    setError('')
    if (!file) return

    const validType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      || /\.(jpe?g|png|webp)$/i.test(file.name)

    if (!validType) {
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
    setImagePreview(URL.createObjectURL(file))
  }

  function clearSelectedImage() {
    setImageFile(null)
    setImagePreview('')
    const input = document.getElementById('edit-room-image')
    if (input) input.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.roomNumber.trim()) {
      setError('Vui lòng nhập số phòng.')
      return
    }

    if (!Number.isInteger(Number(form.floor)) || Number(form.floor) < 1) {
      setError('Tầng phải là số nguyên lớn hơn hoặc bằng 1.')
      return
    }

    if (!form.roomTypeId) {
      setError('Vui lòng chọn thể loại phòng.')
      return
    }

    setSaving(true)

    try {
      let imageUrl = currentImage || null
      if (imageFile) {
        const uploadedImage = await api.uploadRoomImage(imageFile)
        imageUrl = uploadedImage?.imageUrl || imageUrl
      }

      const updated = await api.updateRoom(id, {
        roomNumber: form.roomNumber.trim(),
        floor: Number(form.floor),
        roomTypeId: Number(form.roomTypeId),
        status: Number(form.status),
        note: form.note.trim() || null,
        imageUrl,
      })

      navigate('/rooms', {
        state: {
          toast: {
            type: 'success',
            message: `Đã cập nhật phòng ${updated.roomNumber}.`,
          },
        },
      })
    } catch (err) {
      setError(err.message || 'Không thể cập nhật phòng. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading message="Đang tải thông tin phòng..." />
  if (loadError) return <ErrorBox message={loadError} />
  if (!form) return <ErrorBox message="Không tìm thấy thông tin phòng." />

  const selectedType = types.find((type) => String(type.id) === form.roomTypeId)
  const savedImageUrl = currentImage
    ? (currentImage.startsWith('http') ? currentImage : `${API_ORIGIN}${currentImage}`)
    : ''
  const previewUrl = imagePreview || savedImageUrl

  return (
    <div className="add-room-page">
      <div className="add-room-header">
        <div>
          <div className="add-room-breadcrumb">QUẢN LÝ PHÒNG / CẬP NHẬT PHÒNG</div>
          <h1>Cập nhật phòng {form.roomNumber}</h1>
          <p>Điều chỉnh thông tin, trạng thái và hình ảnh phòng.</p>
        </div>
        <Link to="/rooms" className="add-room-back">← Danh sách phòng</Link>
      </div>

      {types.length === 0 && (
        <div className="add-room-info">
          <div className="add-room-info-icon">!</div>
          <div><strong>Chưa có thể loại phòng</strong><p>Hãy tạo thể loại phòng trước khi lưu thay đổi.</p></div>
        </div>
      )}

      <div className="add-room-card">
        <div className="add-room-card-header">
          <div className="add-room-card-icon" aria-hidden="true">✎</div>
          <div><h2>Thông tin phòng</h2><p>Các trường có dấu <span>*</span> là bắt buộc.</p></div>
        </div>

        {error && <div className="add-room-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="add-room-grid">
            <div className="add-room-field">
              <label htmlFor="edit-room-number">Số phòng <span>*</span></label>
              <input id="edit-room-number" required maxLength="30" value={form.roomNumber} onChange={(event) => update('roomNumber', event.target.value)} disabled={saving} />
              <small>Số phòng không được trùng với phòng khác.</small>
            </div>

            <div className="add-room-field">
              <label htmlFor="edit-room-floor">Tầng <span>*</span></label>
              <input id="edit-room-floor" required type="number" min="1" step="1" value={form.floor} onChange={(event) => update('floor', event.target.value)} disabled={saving} />
            </div>

            <div className="add-room-field">
              <label htmlFor="edit-room-type">Thể loại phòng <span>*</span></label>
              <select id="edit-room-type" required value={form.roomTypeId} onChange={(event) => update('roomTypeId', event.target.value)} disabled={saving}>
                <option value="">-- Chọn thể loại phòng --</option>
                {types.map((type) => <option key={type.id} value={type.id}>{type.name} — {formatMoney(type.pricePerNight)}/đêm</option>)}
              </select>
              {selectedType && <small>Sức chứa tối đa {selectedType.capacity} người.</small>}
            </div>

            <div className="add-room-field">
              <label htmlFor="edit-room-status">Trạng thái</label>
              <select id="edit-room-status" value={form.status} onChange={(event) => update('status', Number(event.target.value))} disabled={saving}>
                <option value={0}>Trống — sẵn sàng cho thuê</option>
                <option value={1}>Đang thuê</option>
                <option value={2}>Bảo trì</option>
                <option value={3}>Đã đặt trước</option>
              </select>
            </div>

            <div className="add-room-field add-room-full">
              <label htmlFor="edit-room-note">Mô tả / Ghi chú</label>
              <textarea id="edit-room-note" maxLength="1000" value={form.note} onChange={(event) => update('note', event.target.value)} placeholder="Thông tin cần lưu ý về phòng..." disabled={saving} />
            </div>

            <div className="add-room-field add-room-full">
              <label>Hình ảnh phòng</label>
              <div className="add-room-image-area">
                {previewUrl ? (
                  <div className="add-room-image-preview">
                    <img src={previewUrl} alt={`Ảnh phòng ${form.roomNumber}`} />
                    <div className="add-room-image-info">
                      <strong>{imageFile?.name || 'Ảnh hiện tại của phòng'}</strong>
                      <span>{imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : 'Ảnh sẽ được giữ nguyên nếu không chọn ảnh mới.'}</span>
                      {imageFile && <button type="button" className="add-room-remove-image" onClick={clearSelectedImage}>Bỏ ảnh mới</button>}
                    </div>
                  </div>
                ) : (
                  <label className="add-room-upload" htmlFor="edit-room-image">
                    <span className="add-room-upload-icon" aria-hidden="true">▧</span>
                    <strong>Chọn hình ảnh phòng</strong>
                    <span>JPG, PNG hoặc WEBP · tối đa 5 MB</span>
                  </label>
                )}
                {previewUrl && <label className="add-room-change-image" htmlFor="edit-room-image">Chọn ảnh khác</label>}
                <input id="edit-room-image" className="add-room-file-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleImageChange} disabled={saving} />
              </div>
              <small>Không chọn ảnh mới để giữ nguyên hình ảnh đang sử dụng.</small>
            </div>
          </div>

          <div className="add-room-actions">
            <Link to="/rooms" className="add-room-reset">Hủy</Link>
            <button type="submit" className="add-room-submit" disabled={saving || types.length === 0}>
              {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRoom