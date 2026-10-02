import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_ORIGIN, api, formatMoney } from '../services/api'
import { ErrorBox, Loading } from '../components/Feedback'
import './EditBookedRoom.css'

function EditBookedRoom() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [types, setTypes] = useState([])
  const [form, setForm] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([api.getBooking(bookingId), api.getRoomTypes()])
      .then(([myBooking, roomTypes]) => {
        if (!active) return
        if (myBooking.status !== 'Booked') {
          throw new Error('Phòng chỉ có thể cập nhật trước khi nhận phòng.')
        }
        setBooking(myBooking)
        setTypes(Array.isArray(roomTypes) ? roomTypes : [])
        setForm({
          roomNumber: myBooking.roomNumber || '',
          floor: String(myBooking.floor || 1),
          roomTypeId: String(myBooking.roomTypeId || ''),
          note: myBooking.roomNote || '',
        })
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Không thể tải thông tin phòng đã đặt.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [bookingId])

  useEffect(() => () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function selectImage(event) {
    const file = event.target.files?.[0]
    setError('')
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      || /\.(jpe?g|png|webp)$/i.test(file.name)

    if (!allowed) {
      event.target.value = ''
      setError('Chỉ hỗ trợ hình ảnh JPG, JPEG, PNG hoặc WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = ''
      setError('Ảnh không được vượt quá 5 MB.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
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
      let imageUrl = booking.roomImageUrl || null
      if (imageFile) {
        const uploaded = await api.uploadBookedRoomImage(bookingId, imageFile)
        imageUrl = uploaded.imageUrl
      }

      await api.updateBookedRoom(bookingId, {
        roomNumber: form.roomNumber.trim(),
        floor: Number(form.floor),
        roomTypeId: Number(form.roomTypeId),
        note: form.note.trim() || null,
        imageUrl,
      })

      navigate('/my-bookings', {
        state: {
          toast: {
            type: 'success',
            message: `Đã cập nhật thông tin phòng ${form.roomNumber.trim()}.`,
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
  if (!booking || !form) return <ErrorBox message="Không tìm thấy phòng đã đặt." />

  const savedImage = booking.roomImageUrl
    ? (booking.roomImageUrl.startsWith('http') ? booking.roomImageUrl : `${API_ORIGIN}${booking.roomImageUrl}`)
    : ''
  const preview = imagePreview || savedImage
  const selectedType = types.find((type) => String(type.id) === form.roomTypeId)

  return (
    <main className="booked-room-edit-page">
      <header className="booked-room-edit-header">
        <div className="booked-room-heading-copy">
          <Link to="/my-bookings" className="booked-room-back">
            <span aria-hidden="true">←</span> Tất cả đặt phòng
          </Link>
          <div className="booked-room-title-line">
            <div>
              <p className="booked-room-edit-kicker">LƯỢT ĐẶT {booking.code}</p>
              <h1>Cập nhật phòng {booking.roomNumber}</h1>
              <p>Thông tin phòng trong kỳ lưu trú của bạn.</p>
            </div>
            <span className="booked-room-edit-status"><i aria-hidden="true" /> Đã đặt · Chưa nhận phòng</span>
          </div>
        </div>
      </header>

      {error && <div className="booked-room-edit-error" role="alert">{error}</div>}

      <form className="booked-room-edit-layout" onSubmit={handleSubmit}>
        <aside className="booked-room-visual">
          <div className="booked-room-visual-image">
            {preview ? <img src={preview} alt={`Ảnh phòng ${form.roomNumber}`} /> : <div className="booked-room-image-empty"><span aria-hidden="true">⌂</span><strong>Chưa có ảnh phòng</strong></div>}
          </div>
          <div className="booked-room-visual-caption">
            <div className="booked-room-visual-caption-heading">
              <div>
                <span>ẢNH PHÒNG</span>
                <strong>Phòng {form.roomNumber}</strong>
              </div>
              <span className="booked-room-image-count">01</span>
            </div>
            <p className="booked-room-visual-type">{selectedType?.name || booking.roomTypeName} <span>·</span> Tầng {form.floor}</p>
            <label className="booked-room-image-button" htmlFor="booked-room-image">
              <span aria-hidden="true">↥</span> {imageFile ? 'Chọn ảnh khác' : 'Thay ảnh phòng'}
            </label>
            <input id="booked-room-image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={selectImage} disabled={saving} />
            <small>{imageFile ? imageFile.name : 'JPG, PNG hoặc WEBP · tối đa 5 MB'}</small>
          </div>
        </aside>

        <section className="booked-room-fields">
          <div className="booked-room-fields-heading">
            <span className="booked-room-fields-icon" aria-hidden="true">✎</span>
            <div><h2>Thông tin cơ bản</h2><p>Các trường có dấu * là bắt buộc.</p></div>
          </div>

          <div className="booked-room-form-grid">
            <label className="booked-room-field">
              <span>Số phòng <b>*</b></span>
              <input required maxLength="30" value={form.roomNumber} onChange={(event) => update('roomNumber', event.target.value)} disabled={saving} />
              <small>Số phòng phải còn trống và không trùng.</small>
            </label>

            <label className="booked-room-field">
              <span>Tầng <b>*</b></span>
              <input required type="number" min="1" step="1" value={form.floor} onChange={(event) => update('floor', event.target.value)} disabled={saving} />
            </label>

            <label className="booked-room-field booked-room-field-wide">
              <span>Thể loại phòng <b>*</b></span>
              <select required value={form.roomTypeId} onChange={(event) => update('roomTypeId', event.target.value)} disabled={saving}>
                <option value="">Chọn thể loại phòng</option>
                {types.map((type) => <option key={type.id} value={type.id}>{type.name} · {formatMoney(type.pricePerNight)}/đêm</option>)}
              </select>
              {selectedType && <small>Sức chứa {selectedType.capacity} người · {formatMoney(selectedType.pricePerNight)}/đêm</small>}
            </label>

            <label className="booked-room-field booked-room-field-wide">
              <span>Ghi chú phòng</span>
              <textarea maxLength="1000" rows="4" value={form.note} onChange={(event) => update('note', event.target.value)} placeholder="Ví dụ: yêu cầu thêm gối, ưu tiên phòng yên tĩnh..." disabled={saving} />
              <small>{form.note.length}/1000 ký tự</small>
            </label>
          </div>

          <div className="booked-room-edit-footer">
            <p>Trạng thái đặt phòng và thời gian lưu trú do khách sạn quản lý.</p>
            <div>
              <Link to="/my-bookings" className="booked-room-cancel">Hủy</Link>
              <button type="submit" className="booked-room-save" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </main>
  )
}

export default EditBookedRoom