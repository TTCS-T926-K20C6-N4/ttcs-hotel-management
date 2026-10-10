import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, formatMoney } from '../services/api'
import { EmptyState, ErrorBox, Loading } from '../components/Feedback'
import Toast from '../components/Toast'
import './RentRoom.css'

// Chuyển Date thành định dạng dùng cho input datetime-local
function toDateTimeLocal(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function createEmptyForm() {
  return {
    roomId: '',
    customerName: '',
    customerPhone: '',
    customerIdCard: '',
    checkInDate: toDateTimeLocal(new Date()),
    expectedCheckOutDate: '',
  }
}

function RentRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  // Vẫn hỗ trợ đường dẫn cũ: /rent-room?roomId=1
  const [searchParams] = useSearchParams()
  const presetRoomId = searchParams.get('roomId')
  const selectedRoomId = roomId || presetRoomId
  const roomSelectionIsFixed = Boolean(selectedRoomId)

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState(() => createEmptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // =========================
  // LOAD DỮ LIỆU
  // =========================
  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const availableRooms = await api.getAvailableRooms()

      setRooms(availableRooms)

      if (selectedRoomId) {
        const selectedRoom = availableRooms.find(
          (room) => String(room.id) === String(selectedRoomId)
        )

        setForm((prev) => ({
          ...prev,
          roomId: selectedRoom ? String(selectedRoom.id) : '',
        }))
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu.')
    } finally {
      setLoading(false)
    }
  }, [selectedRoomId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return undefined

    const timer = setTimeout(() => {
      setToast(null)
    }, 3500)

    return () => clearTimeout(timer)
  }, [toast])

  // =========================
  // PHÒNG ĐANG CHỌN
  // =========================
  const selectedRoom = useMemo(
    () =>
      rooms.find(
        (room) => String(room.id) === String(form.roomId)
      ),
    [rooms, form.roomId]
  )
  const displayedRooms = useMemo(
    () =>
      roomSelectionIsFixed
        ? rooms.filter(
            (room) => String(room.id) === String(selectedRoomId)
          )
        : rooms,
    [rooms, roomSelectionIsFixed, selectedRoomId]
  )

  // =========================
  // TÍNH THỜI GIAN + TIỀN
  // =========================
  const estimate = useMemo(() => {
    if (
      !selectedRoom ||
      !form.checkInDate ||
      !form.expectedCheckOutDate
    ) {
      return null
    }

    const start = new Date(form.checkInDate)
    const end = new Date(form.expectedCheckOutDate)

    const difference = end.getTime() - start.getTime()

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      difference <= 0
    ) {
      return null
    }

    const totalHours = difference / (1000 * 60 * 60)

    // Giá phòng hiện tại đang tính theo ngày.
    // Có thời gian thuê nhỏ hơn 1 ngày vẫn tính tối thiểu 1 ngày.
    const days = Math.max(1, Math.ceil(totalHours / 24))

    const total =
      days * Number(selectedRoom.pricePerNight || 0)

    return {
      totalHours,
      days,
      total,
    }
  }, [
    selectedRoom,
    form.checkInDate,
    form.expectedCheckOutDate,
  ])

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))

    setFormError('')
  }

  // =========================
  // LƯU PHIẾU THUÊ
  // =========================
  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!form.roomId) {
      setFormError('Vui lòng chọn phòng cho thuê.')
      return
    }

    if (!form.customerName.trim()) {
      setFormError('Vui lòng nhập tên khách hàng.')
      return
    }

    if (!form.customerPhone.trim()) {
      setFormError('Vui lòng nhập số điện thoại khách hàng.')
      return
    }

    const phoneRegex = /^0[35789][0-9]{8}$/

    if (!phoneRegex.test(form.customerPhone.trim())) {
      setFormError(
        'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.'
      )
      return
    }

    if (!form.checkInDate) {
      setFormError('Không xác định được thời gian nhận phòng.')
      return
    }

    if (!form.expectedCheckOutDate) {
      setFormError(
        'Vui lòng chọn thời gian trả phòng dự kiến.'
      )
      return
    }

    const checkIn = new Date(form.checkInDate)
    const checkOut = new Date(form.expectedCheckOutDate)

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime())
    ) {
      setFormError('Thời gian thuê phòng không hợp lệ.')
      return
    }

    if (checkOut <= checkIn) {
      setFormError(
        'Thời gian trả phòng phải sau thời gian nhận phòng.'
      )
      return
    }

    const payload = {
      roomId: Number(form.roomId),

      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),

      customerIdCard:
        form.customerIdCard.trim() || null,

      guestCount: 1,

      checkInDate: form.checkInDate,

      expectedCheckOutDate:
        form.expectedCheckOutDate,
    }

    setSaving(true)

    try {
      const booking = await api.rentRoom(payload)

      // Sau khi thuê thành công quay về danh sách phòng
      // và truyền thông tin để RoomList hiển thị Toast.
      navigate('/rooms', {
        replace: true,
        state: {
          roomRented:
            booking.roomNumber ||
            selectedRoom?.roomNumber,
        },
      })
    } catch (err) {
      setFormError(
        err.message || 'Không thể cho thuê phòng.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // NHẬP LẠI
  // =========================
  function handleReset() {
    const selectedRoomId =
      roomId || presetRoomId || ''

    setForm({
      ...createEmptyForm(),
      roomId: selectedRoomId
        ? String(selectedRoomId)
        : '',
    })

    setFormError('')
  }

  if (loading) {
    return <Loading text="Đang tải phòng trống..." />
  }

  if (error) {
    return (
      <ErrorBox
        message={error}
        onRetry={load}
      />
    )
  }

  return (
    <div className="rent-room-page">
      <div className="page-header">
        <div>
          <h1>Cho thuê phòng</h1>
          <p>
            {roomSelectionIsFixed && selectedRoom
              ? `Lập phiếu thuê cho phòng ${selectedRoom.roomNumber}`
              : `Lập phiếu thuê cho khách — hiện có ${rooms.length} phòng trống`}
          </p>
        </div>
      </div>

      {roomSelectionIsFixed && displayedRooms.length === 0 ? (
        <EmptyState
          icon="🚫"
          title="Phòng này hiện không còn trống"
          description="Vui lòng quay lại danh sách phòng và chọn một phòng đang trống khác."
        />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon="🚫"
          title="Hiện không còn phòng trống"
          description="Hãy trả phòng cho khách hoặc chuyển phòng bảo trì về trạng thái trống."
        />
      ) : (
        <div className="grid-2">

          {/* =========================
              CỘT TRÁI
          ========================= */}
          <div className="card">
            <h2 className="card-title">
              {roomSelectionIsFixed ? 'Phòng được chọn' : '1. Chọn phòng'}
            </h2>

            <div className="room-grid">
              {displayedRooms.map((room) => (
                <button
                  type="button"
                  key={room.id}
                  disabled={roomSelectionIsFixed}
                  className={`room-card status-available ${
                    String(room.id) ===
                    String(form.roomId)
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => update('roomId', String(room.id))}
                  style={
                    String(room.id) ===
                    String(form.roomId)
                      ? {
                          outline:
                            '2px solid #2563eb',
                          outlineOffset: 1,
                        }
                      : undefined
                  }
                >
                  <span className="room-number">
                    {room.roomNumber}
                  </span>

                  <span className="room-type">
                    Tầng {room.floor} ·{' '}
                    {room.roomTypeName}
                  </span>

                  <span className="room-price">
                    {formatMoney(
                      room.pricePerNight
                    )}
                    /ngày
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* =========================
              CỘT PHẢI
          ========================= */}
          <div className="card">
            <h2 className="card-title">
              2. Thông tin thuê phòng
            </h2>

            {formError && (
              <div className="alert alert-error">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">

                <div className="form-group">
                  <label>
                    Tên khách hàng{' '}
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    value={form.customerName}
                    onChange={(event) =>
                      update(
                        'customerName',
                        event.target.value
                      )
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Số điện thoại{' '}
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.customerPhone}
                    onChange={(event) =>
                      update(
                        'customerPhone',
                        event.target.value
                      )
                    }
                    placeholder="0912345678"
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label>CMND / CCCD</label>

                  <input
                    value={form.customerIdCard}
                    onChange={(event) =>
                      update(
                        'customerIdCard',
                        event.target.value
                      )
                    }
                  />
                </div>

                {/* GIỜ NHẬN PHÒNG */}
                <div className="form-group">
                  <label>
                    Thời gian nhận phòng
                  </label>

                  <input
                    type="datetime-local"
                    value={form.checkInDate}
                    readOnly
                  />

                  <span className="form-hint">
                    Tự động lấy thời gian hiện tại
                    của hệ thống.
                  </span>
                </div>

                {/* GIỜ TRẢ PHÒNG */}
                <div className="form-group form-group-checkout-date">
                  <label>
                    Thời gian trả phòng dự kiến{' '}
                    <span className="required">
                      *
                    </span>
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.expectedCheckOutDate
                    }
                    min={form.checkInDate}
                    onChange={(event) =>
                      update(
                        'expectedCheckOutDate',
                        event.target.value
                      )
                    }
                    required
                  />

                  <span className="form-hint">
                    Chọn ngày và giờ khách dự kiến
                    trả phòng.
                  </span>
                </div>

              </div>

              {/* =========================
                  TÓM TẮT TIỀN
              ========================= */}
              {selectedRoom && (
                <div className="summary-box">

                  <div className="summary-row">
                    <span>Phòng chọn thuê</span>

                    <strong>
                      {selectedRoom.roomNumber} —{' '}
                      {selectedRoom.roomTypeName}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>Giá thuê</span>

                    <strong>
                      {formatMoney(
                        selectedRoom.pricePerNight
                      )}
                      /ngày
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>Giờ nhận</span>

                    <strong>
                      {new Date(
                        form.checkInDate
                      ).toLocaleString('vi-VN')}
                    </strong>
                  </div>

                  {form.expectedCheckOutDate && (
                    <div className="summary-row">
                      <span>Giờ trả dự kiến</span>

                      <strong>
                        {new Date(
                          form.expectedCheckOutDate
                        ).toLocaleString('vi-VN')}
                      </strong>
                    </div>
                  )}

                  {estimate && (
                    <>
                      <div className="summary-row">
                        <span>
                          Thời gian thuê
                        </span>

                        <strong>
                          {estimate.totalHours < 24
                            ? `${Math.ceil(
                                estimate.totalHours
                              )} giờ`
                            : `${estimate.days} ngày`}
                        </strong>
                      </div>

                      <div className="summary-row">
                        <span>
                          Số ngày tính tiền
                        </span>

                        <strong>
                          {estimate.days} ngày
                        </strong>
                      </div>

                      <div className="summary-row grand">
                        <span>
                          Tạm tính tiền phòng
                        </span>

                        <span>
                          {formatMoney(
                            estimate.total
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="form-actions">

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving
                    ? 'Đang lưu...'
                    : '🔑 Xác nhận cho thuê'}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleReset}
                  disabled={saving}
                >
                  ↺ Nhập lại
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    navigate('/rooms')
                  }
                  disabled={saving}
                >
                  ← Quay lại
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default RentRoom