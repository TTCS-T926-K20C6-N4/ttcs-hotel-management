import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, formatMoney } from '../services/api'
import { ErrorBox, Loading } from '../components/Feedback'
import Toast from '../components/Toast'
import './AddRoom.css'

const EMPTY = {
  roomNumber: '',
  floor: 1,
  roomTypeId: '',
  status: 0,
  note: '',
}

function AddRoom() {
  const navigate = useNavigate()

  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Cho phép thêm nhanh nhiều phòng liên tiếp
  const [bulk, setBulk] = useState(false)

  // Ảnh phòng
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getRoomTypes()
        setTypes(Array.isArray(data) ? data : [])
      } catch (err) {
        setLoadError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!toast) return undefined

    const timer = setTimeout(() => {
      setToast(null)
    }, 3200)

    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview('')

    const input = document.getElementById('add-room-image')

    if (input) {
      input.value = ''
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]

    setError('')

    if (!file) {
      clearImage()
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      event.target.value = ''
      setImageFile(null)
      setImagePreview('')
      setError('Chỉ hỗ trợ hình ảnh JPG, JPEG, PNG hoặc WEBP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = ''
      setImageFile(null)
      setImagePreview('')
      setError('Hình ảnh không được vượt quá 5 MB.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    clearImage()
  }

  function resetForm() {
    setForm({ ...EMPTY })
    setError('')
    clearImage()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.roomNumber.trim()) {
      setError('Vui lòng nhập số phòng.')
      return
    }

    if (!form.floor || Number(form.floor) <= 0) {
      setError('Tầng phải lớn hơn 0.')
      return
    }

    if (!form.roomTypeId) {
      setError('Vui lòng chọn thể loại phòng.')
      return
    }

    setSaving(true)

    try {
      let imageUrl = null

      // Nếu có ảnh thì upload ảnh trước
      if (imageFile) {
        const uploadResult = await api.uploadRoomImage(imageFile)
        imageUrl = uploadResult?.imageUrl || null
      }

      // QUAN TRỌNG:
      // Backend RoomStatus là enum số:
      // Available = 0
      // Occupied = 1
      // Maintenance = 2
      // Reserved = 3
      const payload = {
        roomNumber: form.roomNumber.trim(),
        floor: Number(form.floor),
        roomTypeId: Number(form.roomTypeId),
        status: Number(form.status),
        note: form.note.trim() || null,
        imageUrl,
      }

      const created = await api.createRoom(payload)

      if (bulk) {
        setToast({
          type: 'success',
          message: `Đã thêm phòng ${created.roomNumber}.`,
        })

        // Giữ lại tầng và thể loại khi thêm liên tiếp
        setForm((prev) => ({
          ...prev,
          roomNumber: '',
          status: 0,
          note: '',
        }))

        clearImage()
      } else {
        navigate('/rooms', {
          state: {
            toast: {
              type: 'success',
              message: `Đã thêm phòng ${created.roomNumber}.`,
            },
          },
        })
      }
    } catch (err) {
      setError(
        err.message ||
          'Không thể thêm phòng. Vui lòng thử lại.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Loading text="Đang tải thể loại phòng..." />
    )
  }

  if (loadError) {
    return <ErrorBox message={loadError} />
  }

  const selectedType = types.find(
    (type) =>
      String(type.id) === String(form.roomTypeId)
  )

  return (
    <div className="add-room-page">
      {/* HEADER */}
      <div className="add-room-header">
        <div>
          <div className="add-room-breadcrumb">
            QUẢN LÝ PHÒNG / THÊM PHÒNG
          </div>

          <h1>Thêm mới phòng</h1>

          <p>
            Nhập thông tin phòng mới để thêm vào hệ thống
            quản lý khách sạn.
          </p>
        </div>

        <Link
          to="/rooms"
          className="add-room-back"
        >
          ← Danh sách phòng
        </Link>
      </div>

      {/* CHƯA CÓ THỂ LOẠI */}
      {types.length === 0 && (
        <div className="add-room-info">
          <div className="add-room-info-icon">
            !
          </div>

          <div>
            <strong>
              Chưa có thể loại phòng
            </strong>

            <p>
              Bạn cần{' '}
              <Link to="/room-types">
                tạo thể loại phòng
              </Link>{' '}
              trước khi có thể lưu phòng mới.
            </p>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <div className="add-room-card">
        <div className="add-room-card-header">
          <div className="add-room-card-icon">
            🏨
          </div>

          <div>
            <h2>Thông tin phòng</h2>

            <p>
              Các trường có dấu <span>*</span> là bắt buộc.
            </p>
          </div>
        </div>

        {error && (
          <div className="add-room-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="add-room-grid">

            {/* SỐ PHÒNG */}
            <div className="add-room-field">
              <label>
                Số phòng <span>*</span>
              </label>

              <input
                type="text"
                value={form.roomNumber}
                onChange={(e) =>
                  update('roomNumber', e.target.value)
                }
                placeholder="Ví dụ: 101, A203"
                disabled={saving}
              />

              <small>
                Số phòng không được trùng với phòng đã có.
              </small>
            </div>

            {/* TẦNG */}
            <div className="add-room-field">
              <label>
                Tầng <span>*</span>
              </label>

              <input
                type="number"
                min="1"
                value={form.floor}
                onChange={(e) =>
                  update('floor', e.target.value)
                }
                disabled={saving}
              />

              <small>
                Nhập tầng mà phòng đang nằm.
              </small>
            </div>

            {/* THỂ LOẠI */}
            <div className="add-room-field">
              <label>
                Thể loại phòng <span>*</span>
              </label>

              <select
                value={form.roomTypeId}
                onChange={(e) =>
                  update('roomTypeId', e.target.value)
                }
                disabled={saving}
              >
                <option value="">
                  -- Chọn thể loại phòng --
                </option>

                {types.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {type.name} —{' '}
                    {formatMoney(type.pricePerNight)}
                    /đêm
                  </option>
                ))}
              </select>

              <small>
                Chọn thể loại để xem giá thuê và sức chứa.
              </small>
            </div>

            {/* TRẠNG THÁI */}
            <div className="add-room-field">
              <label>
                Trạng thái ban đầu
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  update(
                    'status',
                    Number(e.target.value)
                  )
                }
                disabled={saving}
              >
                <option value={0}>
                  Trống — sẵn sàng cho thuê
                </option>

                <option value={2}>
                  Bảo trì — chưa cho thuê
                </option>

                <option value={3}>
                  Đã đặt trước
                </option>
              </select>

              <small>
                Phòng mới mặc định ở trạng thái trống.
              </small>
            </div>

            {/* THÔNG TIN THỂ LOẠI */}
            {selectedType && (
              <div className="add-room-full">
                <div className="add-room-summary">
                  <div>
                    <span>Thể loại</span>
                    <strong>
                      {selectedType.name}
                    </strong>
                  </div>

                  <div>
                    <span>Giá thuê</span>
                    <strong>
                      {formatMoney(
                        selectedType.pricePerNight
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Sức chứa</span>
                    <strong>
                      {selectedType.capacity} người
                    </strong>
                  </div>

                  <div>
                    <span>Trạng thái</span>
                    <strong>
                      Sẵn sàng thiết lập
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* MÔ TẢ */}
            <div className="add-room-field add-room-full">
              <label>
                Mô tả / Ghi chú
              </label>

              <textarea
                value={form.note}
                onChange={(e) =>
                  update('note', e.target.value)
                }
                placeholder="Ví dụ: Phòng có ban công, view đẹp, gần thang máy..."
                disabled={saving}
              />

              <small>
                Nhập mô tả ngắn hoặc thông tin cần lưu ý
                về phòng.
              </small>
            </div>

            {/* HÌNH ẢNH */}
            <div className="add-room-field add-room-full">
              <label>
                Hình ảnh phòng
              </label>

              <div className="add-room-image-area">
                {imagePreview ? (
                  <div className="add-room-image-preview">
                    <img
                      src={imagePreview}
                      alt="Xem trước phòng"
                    />

                    <div className="add-room-image-info">
                      <strong>
                        {imageFile?.name}
                      </strong>

                      <span>
                        {imageFile
                          ? `${(
                              imageFile.size /
                              1024 /
                              1024
                            ).toFixed(2)} MB`
                          : ''}
                      </span>

                      <button
                        type="button"
                        className="add-room-remove-image"
                        onClick={removeImage}
                        disabled={saving}
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="add-room-image"
                    className="add-room-upload"
                  >
                    <div className="add-room-upload-icon">
                      🖼️
                    </div>

                    <strong>
                      Chọn hình ảnh phòng
                    </strong>

                    <span>
                      JPG, JPEG, PNG hoặc WEBP · Tối đa 5 MB
                    </span>
                  </label>
                )}

                <input
                  id="add-room-image"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={saving}
                  className="add-room-file-input"
                />
              </div>
            </div>
          </div>

          {/* THÊM LIÊN TIẾP */}
          <label className="add-room-bulk">
            <input
              type="checkbox"
              checked={bulk}
              onChange={(e) =>
                setBulk(e.target.checked)
              }
              disabled={saving}
            />

            <div>
              <strong>
                Tiếp tục thêm phòng sau khi lưu
              </strong>

              <span>
                Giữ lại tầng và thể loại để nhập nhiều
                phòng nhanh hơn.
              </span>
            </div>
          </label>

          {/* BUTTON */}
          <div className="add-room-actions">
            <button
              type="button"
              className="add-room-reset"
              onClick={resetForm}
              disabled={saving}
            >
              ↻ Nhập lại
            </button>

            <button
              type="submit"
              className="add-room-submit"
              disabled={
                saving || types.length === 0
              }
            >
              {saving
                ? 'Đang lưu...'
                : '+ Thêm phòng'}
            </button>
          </div>
        </form>
      </div>

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default AddRoom