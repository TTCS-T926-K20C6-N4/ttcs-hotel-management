
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, formatMoney } from '../services/api'
import { EmptyState, ErrorBox, Loading } from '../components/Feedback'
import './RentRoom.css'

// Chuyển thời gian sang định dạng datetime-local
function toDateTimeLocal(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Tạo form ban đầu
function createEmptyForm(roomId = '') {
  return {
    roomId: String(roomId),
    customerName: '',
    customerPhone: '',
    customerIdCard: '',
    checkInDate: toDateTimeLocal(),
    expectedCheckOutDate: '',
  }
}

function RentRoom() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const presetRoomId = searchParams.get('roomId')
  const initialRoomId = roomId || presetRoomId || ''
  const navigate = useNavigate()

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(() =>
    createEmptyForm(initialRoomId)
  )

  // ================= LOAD PHÒNG =================

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const availableRooms = await api.getAvailableRooms()

      const roomList = Array.isArray(availableRooms)
        ? availableRooms
        : []

      setRooms(roomList)

      setForm((previous) => ({
        ...previous,
        roomId: initialRoomId
          ? String(initialRoomId)
          : previous.roomId,
      }))
    } catch (err) {
      setError(
        err.message || 'Không thể tải danh sách phòng trống.'
      )
    } finally {
      setLoading(false)
    }
  }, [initialRoomId])

  useEffect(() => {
    load()
  }, [load])

  // ================= PHÒNG ĐANG CHỌN =================

  const selectedRoom = useMemo(() => {
    return rooms.find(
      (room) => String(room.id) === String(form.roomId)
    )
  }, [rooms, form.roomId])

  // ================= TÍNH TIỀN =================

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

    const duration = end.getTime() - start.getTime()

    if (!Number.isFinite(duration) || duration <= 0) {
      return null
    }

    const totalHours = duration / (1000 * 60 * 60)

    // Tính theo ngày, tối thiểu một ngày
    const days = Math.max(1, Math.ceil(totalHours / 24))

    const price = Number(selectedRoom.pricePerNight || 0)

    const total = days * price

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

  // ================= CẬP NHẬT FORM =================

  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

    setFormError('')
  }

  // ================= XÁC NHẬN THUÊ =================

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!selectedRoom) {
      setFormError('Vui lòng chọn phòng còn trống.')
      return
    }

    const customerName = form.customerName.trim()
    const customerPhone = form.customerPhone.trim()
    const customerIdCard = form.customerIdCard.trim()

    if (!customerName) {
      setFormError('Vui lòng nhập tên khách hàng.')
      return
    }

    const phoneRegex = /^0[35789][0-9]{8}$/

    if (!phoneRegex.test(customerPhone)) {
      setFormError(
        'Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.'
      )
      return
    }

    if (
      customerIdCard &&
      !/^(\d{9}|\d{12})$/.test(customerIdCard)
    ) {
      setFormError(
        'CMND/CCCD phải gồm 9 hoặc 12 chữ số.'
      )
      return
    }

    if (!form.checkInDate) {
      setFormError('Không xác định được thời gian nhận phòng.')
      return
    }

    if (!form.expectedCheckOutDate) {
      setFormError('Vui lòng chọn thời gian trả phòng.')
      return
    }

    const checkIn = new Date(form.checkInDate)
    const checkOut = new Date(form.expectedCheckOutDate)

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime())
    ) {
      setFormError('Thời gian thuê không hợp lệ.')
      return
    }

    if (checkOut <= checkIn) {
      setFormError(
        'Thời gian trả phòng phải sau thời gian nhận phòng.'
      )
      return
    }

    if (!estimate) {
      setFormError('Không thể tính tiền thuê phòng.')
      return
    }

    // Giữ các trường mặc định để tương thích API cũ
    const payload = {
      roomId: Number(form.roomId),
      customerId: null,
      customerName,
      customerPhone,
      customerEmail: null,
      customerIdCard: customerIdCard || null,
      customerAddress: null,
      guestCount: 1,
      checkInDate: form.checkInDate,
      expectedCheckOutDate: form.expectedCheckOutDate,
      note: null,
    }

    setSaving(true)

    try {
      const booking = await api.rentRoom(payload)

      navigate('/rooms', {
        replace: true,
        state: {
          roomRented:
            booking?.roomNumber || selectedRoom.roomNumber,
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

  // ================= NHẬP LẠI =================

  function handleReset() {
    setForm(createEmptyForm(initialRoomId))
    setFormError('')
  }

  // ================= LOADING =================

  if (loading) {
    return (
      <Loading text="Đang tải danh sách phòng trống..." />
    )
  }

  if (error) {
    return (
      <ErrorBox message={error} onRetry={load} />
    )
  }

  // ================= GIAO DIỆN =================

  return (
    <div className="rent-room-page">

      {/* HEADER */}
      <div className="page-header">
        <h1>Cho thuê phòng</h1>
        <p>
          Lập phiếu thuê phòng cho khách hàng —
          hiện có {rooms.length} phòng trống
        </p>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon="🏨"
          title="Hiện không còn phòng trống"
          description="Vui lòng kiểm tra lại danh sách phòng."
        />
      ) : (
        <div className="grid-2">

          {/* ========== CỘT TRÁI ========== */}
          <div className="card">

            <h2 className="card-title">
              1. Chọn phòng
            </h2>

            <div className="room-grid">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className={`room-card ${
                    String(form.roomId) === String(room.id)
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() =>
                    update('roomId', String(room.id))
                  }
                >
                  <span className="room-number">
                    {room.roomNumber}
                  </span>

                  <span className="room-type">
                    Tầng {room.floor} · {room.roomTypeName}
                  </span>

                  <span className="room-price">
                    {formatMoney(room.pricePerNight)}/ngày
                  </span>
                </button>
              ))}
            </div>

            {selectedRoom && (
              <div className="summary-box">

                <div className="summary-row">
                  <span>Phòng đã chọn</span>
                  <strong>
                    {selectedRoom.roomNumber}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Loại phòng</span>
                  <strong>
                    {selectedRoom.roomTypeName}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Đơn giá</span>
                  <strong>
                    {formatMoney(
                      selectedRoom.pricePerNight
                    )}/ngày
                  </strong>
                </div>

              </div>
            )}

          </div>

          {/* ========== CỘT PHẢI ========== */}
          <div className="card">

            <h2 className="card-title">
              2. Thông tin thuê phòng
            </h2>

            {formError && (
              <div
                className="alert alert-error"
                role="alert"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                {/* TÊN KHÁCH HÀNG */}
                <div className="form-group">
                  <label htmlFor="rent-customer-name">
                    Tên khách hàng
                    <span className="required"> *</span>
                  </label>

                  <input
                    id="rent-customer-name"
                    type="text"
                    value={form.customerName}
                    onChange={(event) =>
                      update(
                        'customerName',
                        event.target.value
                      )
                    }
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                {/* SỐ ĐIỆN THOẠI */}
                <div className="form-group">
                  <label htmlFor="rent-customer-phone">
                    Số điện thoại
                    <span className="required"> *</span>
                  </label>

                  <input
                    id="rent-customer-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.customerPhone}
                    onChange={(event) =>
                      update(
                        'customerPhone',
                        event.target.value
                      )
                    }
                    placeholder="0912345678"
                    required
                  />
                </div>

                {/* CMND / CCCD */}
                <div className="form-group full">
                  <label htmlFor="rent-customer-id">
                    CMND / CCCD (không bắt buộc)
                  </label>

                  <input
                    id="rent-customer-id"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={form.customerIdCard}
                    onChange={(event) =>
                      update(
                        'customerIdCard',
                        event.target.value
                      )
                    }
                    placeholder="Nhập số CMND hoặc CCCD"
                  />
                </div>

                {/* THỜI GIAN NHẬN PHÒNG */}
                <div className="form-group">
                  <label htmlFor="rent-check-in">
                    Thời gian nhận phòng
                  </label>

                  <input
                    id="rent-check-in"
                    type="datetime-local"
                    value={form.checkInDate}
                    readOnly
                  />

                  <span className="form-hint">
                    Tự động lấy thời gian hệ thống.
                  </span>
                </div>

                {/* THỜI GIAN TRẢ PHÒNG */}
                <div className="form-group">
                  <label htmlFor="rent-check-out">
                    Thời gian trả phòng dự kiến
                    <span className="required"> *</span>
                  </label>

                  <input
                    id="rent-check-out"
                    type="datetime-local"
                    value={form.expectedCheckOutDate}
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
                    Chọn ngày và giờ khách dự kiến trả.
                  </span>
                </div>

              </div>

              {/* ========== TÓM TẮT TIỀN ========== */}
              {selectedRoom && (
                <div className="summary-box">

                  <h3 style={{ marginTop: 0 }}>
                    Chi tiết tiền thuê dự kiến
                  </h3>

                  <div className="summary-row">
                    <span>Phòng thuê</span>
                    <strong>
                      {selectedRoom.roomNumber}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>Đơn giá</span>
                    <strong>
                      {formatMoney(
                        selectedRoom.pricePerNight
                      )}/ngày
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>Thời gian thuê</span>
                    <strong>
                      {estimate
                        ? `${Number(
                            estimate.totalHours.toFixed(2)
                          )} giờ`
                        : 'Chưa chọn'}
                    </strong>
                  </div>

                  <div className="summary-row">
                    <span>Số ngày tính tiền</span>
                    <strong>
                      {estimate
                        ? `${estimate.days} ngày`
                        : '—'}
                    </strong>
                  </div>

                  <div className="summary-row grand">
                    <span>Tổng tiền dự kiến</span>
                    <span>
                      {estimate
                        ? formatMoney(estimate.total)
                        : '—'}
                    </span>
                  </div>

                </div>
              )}

              {/* ========== BUTTON ========== */}
              <div className="form-actions">

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving || !selectedRoom}
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
                  onClick={() => navigate('/rooms')}
                  disabled={saving}
                >
                  ← Quay lại
                </button>

              </div>

            </form>
          </div>

        </div>
      )}

    </div>
  )
}

export default RentRoom
