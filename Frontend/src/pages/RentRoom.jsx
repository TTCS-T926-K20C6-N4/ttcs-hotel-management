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
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerIdCard: '',
    customerAddress: '',
    guestCount: 1,
    checkInDate: toDateTimeLocal(new Date()),
    expectedCheckOutDate: '',
    note: '',
  }
}

function RentRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()

  // Vẫn hỗ trợ đường dẫn cũ: /rent-room?roomId=1
  const [searchParams] = useSearchParams()
  const presetRoomId = searchParams.get('roomId')

  const [rooms, setRooms] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState(() => createEmptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')

  // =========================
  // LOAD DỮ LIỆU
  // =========================
  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [availableRooms, customerList] = await Promise.all([
        api.getAvailableRooms(),
        api.getCustomers(),
      ])

      setRooms(availableRooms)
      setCustomers(customerList)

      // Ưu tiên ID trên URL: /rent-room/3
      const selectedRoomId = roomId || presetRoomId

      if (selectedRoomId) {
        const exists = availableRooms.some(
          (room) => String(room.id) === String(selectedRoomId)
        )

        if (exists) {
          setForm((prev) => ({
            ...prev,
            roomId: String(selectedRoomId),
          }))
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu.')
    } finally {
      setLoading(false)
    }
  }, [roomId, presetRoomId])

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

  // =========================
  // TÌM KHÁCH HÀNG
  // =========================
  const matchedCustomers = useMemo(() => {
    const key = customerSearch.trim().toLowerCase()

    if (!key) {
      return customers.slice(0, 6)
    }

    return customers
      .filter(
        (customer) =>
          customer.fullName.toLowerCase().includes(key) ||
          customer.phone.includes(key) ||
          (customer.idCard || '').includes(key)
      )
      .slice(0, 6)
  }, [customers, customerSearch])

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
  // CHỌN KHÁCH CŨ
  // =========================
  function pickCustomer(customer) {
    setForm((prev) => ({
      ...prev,
      customerId: String(customer.id),
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerEmail: customer.email || '',
      customerIdCard: customer.idCard || '',
      customerAddress: customer.address || '',
    }))

    setCustomerSearch('')
    setFormError('')
  }

  function clearCustomer() {
    setForm((prev) => ({
      ...prev,
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerIdCard: '',
      customerAddress: '',
    }))
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

    if (
      !form.guestCount ||
      Number(form.guestCount) <= 0
    ) {
      setFormError('Số người ở phải lớn hơn 0.')
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

      customerId: form.customerId
        ? Number(form.customerId)
        : null,

      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),

      customerEmail:
        form.customerEmail.trim() || null,

      customerIdCard:
        form.customerIdCard.trim() || null,

      customerAddress:
        form.customerAddress.trim() || null,

      guestCount: Number(form.guestCount),

      checkInDate: form.checkInDate,

      expectedCheckOutDate:
        form.expectedCheckOutDate,

      note: form.note.trim() || null,
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

    setCustomerSearch('')
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
            Lập phiếu thuê cho khách — hiện có{' '}
            {rooms.length} phòng trống
          </p>
        </div>
      </div>

      {rooms.length === 0 ? (
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
              1. Chọn phòng
            </h2>

            <div className="room-grid">
              {rooms.map((room) => (
                <button
                  type="button"
                  key={room.id}
                  className={`room-card status-available ${
                    String(room.id) ===
                    String(form.roomId)
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() =>
                    update(
                      'roomId',
                      String(room.id)
                    )
                  }
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

            <h2
              className="card-title"
              style={{ marginTop: 24 }}
            >
              2. Khách hàng
            </h2>

            <div
              className="form-group"
              style={{ marginBottom: 12 }}
            >
              <label>Tìm khách hàng cũ</label>

              <input
                value={customerSearch}
                onChange={(event) =>
                  setCustomerSearch(
                    event.target.value
                  )
                }
                placeholder="🔍 Nhập tên, số điện thoại hoặc CMND..."
              />

              <span className="form-hint">
                Bỏ trống nếu đây là khách mới —
                hệ thống sẽ tự tạo hồ sơ khách hàng.
              </span>
            </div>

            {customerSearch && (
              <div
                className="table-wrap"
                style={{ marginBottom: 12 }}
              >
                <table
                  className="data-table"
                  style={{ minWidth: 320 }}
                >
                  <tbody>
                    {matchedCustomers.length ===
                      0 && (
                      <tr>
                        <td className="text-muted">
                          Không tìm thấy khách hàng
                          phù hợp.
                        </td>
                      </tr>
                    )}

                    {matchedCustomers.map(
                      (customer) => (
                        <tr
                          key={customer.id}
                          style={{
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            pickCustomer(customer)
                          }
                        >
                          <td>
                            <strong>
                              {customer.fullName}
                            </strong>

                            <div className="text-muted">
                              {customer.phone}

                              {customer.idCard
                                ? ` · CMND ${customer.idCard}`
                                : ''}
                            </div>
                          </td>

                          <td className="text-right">
                            <span className="btn btn-ghost btn-sm">
                              Chọn
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {form.customerId && (
              <div className="alert alert-info">
                Đang dùng hồ sơ khách cũ:{' '}
                <strong>
                  {form.customerName}
                </strong>{' '}
                ({form.customerPhone})

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearCustomer}
                >
                  Đổi sang khách mới
                </button>
              </div>
            )}
          </div>

          {/* =========================
              CỘT PHẢI
          ========================= */}
          <div className="card">
            <h2 className="card-title">
              3. Thông tin thuê phòng
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
                    disabled={Boolean(
                      form.customerId
                    )}
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
                    disabled={Boolean(
                      form.customerId
                    )}
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
                    disabled={Boolean(
                      form.customerId
                    )}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(event) =>
                      update(
                        'customerEmail',
                        event.target.value
                      )
                    }
                    disabled={Boolean(
                      form.customerId
                    )}
                  />
                </div>

                <div className="form-group full">
                  <label>Địa chỉ</label>

                  <input
                    value={form.customerAddress}
                    onChange={(event) =>
                      update(
                        'customerAddress',
                        event.target.value
                      )
                    }
                    disabled={Boolean(
                      form.customerId
                    )}
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
                <div className="form-group">
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

                <div className="form-group">
                  <label>Số người ở</label>

                  <input
                    type="number"
                    min="1"
                    value={form.guestCount}
                    onChange={(event) =>
                      update(
                        'guestCount',
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Ghi chú</label>

                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      update(
                        'note',
                        event.target.value
                      )
                    }
                    placeholder="Yêu cầu đặc biệt của khách..."
                  />
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