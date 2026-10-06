import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { api, formatMoney } from '../services/api'
import { EmptyState, ErrorBox, Loading } from '../components/Feedback'
import Toast from '../components/Toast'

import './RentRoom.css'


// =========================================================
// HELPERS
// =========================================================

function toDateTimeLocal(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
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


function getRoomPrice(room) {
  if (!room) return 0

  return Number(
    room.pricePerNight ??
      room.roomType?.pricePerNight ??
      room.price ??
      room.roomType?.price ??
      0,
  )
}


function getRoomTypeName(room) {
  if (!room) return 'Chưa phân loại'

  return (
    room.roomTypeName ||
    room.roomType?.name ||
    'Chưa phân loại'
  )
}


function getRoomCapacity(room) {
  if (!room) return null

  const capacity =
    room.capacity ??
    room.roomType?.capacity ??
    null

  return capacity == null
    ? null
    : Number(capacity)
}


function formatDateTime(value) {
  if (!value) return 'Chưa chọn'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}


// =========================================================
// COMPONENT
// =========================================================

function RentRoom() {
  const navigate = useNavigate()

  // Hỗ trợ cả:
  // /rent-room/3
  // /rent-room?roomId=3
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()

  const presetRoomId = searchParams.get('roomId')
  const requestedRoomId = roomId || presetRoomId


  // =======================================================
  // STATE
  // =======================================================

  const [rooms, setRooms] = useState([])
  const [customers, setCustomers] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [toast, setToast] = useState(null)

  const [form, setForm] = useState(() =>
    createEmptyForm(),
  )

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [customerSearch, setCustomerSearch] =
    useState('')


  // =======================================================
  // LOAD DATA
  // =======================================================

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [availableRooms, customerList] =
        await Promise.all([
          api.getAvailableRooms(),
          api.getCustomers(),
        ])

      const roomList = Array.isArray(availableRooms)
        ? availableRooms
        : []

      const customerData = Array.isArray(customerList)
        ? customerList
        : []

      setRooms(roomList)
      setCustomers(customerData)

      // Nếu đi từ nút "Cho thuê" của một phòng
      // thì tự động chọn đúng phòng đó.
      if (requestedRoomId) {
        const roomExists = roomList.some(
          (room) =>
            String(room.id) ===
            String(requestedRoomId),
        )

        if (!roomExists) {
          setError(
            'Phòng được chọn không còn sẵn sàng cho thuê.',
          )
          return
        }

        setForm((prev) => ({
          ...prev,
          roomId: String(requestedRoomId),

          // Thời gian nhận luôn lấy thời điểm mở phiếu.
          checkInDate: toDateTimeLocal(new Date()),
        }))
      } else if (roomList.length === 1) {
        setForm((prev) => ({
          ...prev,
          roomId: String(roomList[0].id),
          checkInDate: toDateTimeLocal(new Date()),
        }))
      }
    } catch (err) {
      setError(
        err.message ||
          'Không thể tải dữ liệu cho thuê phòng.',
      )
    } finally {
      setLoading(false)
    }
  }, [requestedRoomId])


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


  // =======================================================
  // SELECTED ROOM
  // =======================================================

  const selectedRoom = useMemo(
    () =>
      rooms.find(
        (room) =>
          String(room.id) ===
          String(form.roomId),
      ),
    [rooms, form.roomId],
  )


  const roomPrice = useMemo(
    () => getRoomPrice(selectedRoom),
    [selectedRoom],
  )


  const roomCapacity = useMemo(
    () => getRoomCapacity(selectedRoom),
    [selectedRoom],
  )


  // =======================================================
  // CUSTOMER SEARCH
  // =======================================================

  const matchedCustomers = useMemo(() => {
    const keyword =
      customerSearch.trim().toLowerCase()

    if (!keyword) {
      return []
    }

    return customers
      .filter((customer) => {
        const name = String(
          customer.fullName || '',
        ).toLowerCase()

        const phone = String(
          customer.phone || '',
        ).toLowerCase()

        const idCard = String(
          customer.idCard || '',
        ).toLowerCase()

        return (
          name.includes(keyword) ||
          phone.includes(keyword) ||
          idCard.includes(keyword)
        )
      })
      .slice(0, 6)
  }, [customers, customerSearch])


  // =======================================================
  // CALCULATE RENTAL
  // =======================================================

  const estimate = useMemo(() => {
    if (
      !selectedRoom ||
      !form.checkInDate ||
      !form.expectedCheckOutDate
    ) {
      return null
    }

    const start = new Date(form.checkInDate)
    const end = new Date(
      form.expectedCheckOutDate,
    )

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return null
    }

    const totalMinutes = Math.ceil(
      (end.getTime() - start.getTime()) /
        60000,
    )

    const durationDays = Math.floor(
      totalMinutes / (24 * 60),
    )

    const remainingMinutes =
      totalMinutes % (24 * 60)

    const durationHours = Math.floor(
      remainingMinutes / 60,
    )

    const durationMinutes =
      remainingMinutes % 60

    // Giá hiện tại của hệ thống là giá/ngày.
    // Dưới 1 ngày vẫn tính tối thiểu 1 ngày.
    const chargeDays = Math.max(
      1,
      Math.ceil(
        totalMinutes / (24 * 60),
      ),
    )

    const total =
      chargeDays * roomPrice

    return {
      totalMinutes,
      durationDays,
      durationHours,
      durationMinutes,
      chargeDays,
      total,
    }
  }, [
    selectedRoom,
    roomPrice,
    form.checkInDate,
    form.expectedCheckOutDate,
  ])


  function formatDuration(value) {
    if (!value) return '--'

    const parts = []

    if (value.durationDays > 0) {
      parts.push(
        `${value.durationDays} ngày`,
      )
    }

    if (value.durationHours > 0) {
      parts.push(
        `${value.durationHours} giờ`,
      )
    }

    if (value.durationMinutes > 0) {
      parts.push(
        `${value.durationMinutes} phút`,
      )
    }

    return parts.length
      ? parts.join(' ')
      : 'Dưới 1 phút'
  }


  // =======================================================
  // FORM
  // =======================================================

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))

    setFormError('')
  }


  function pickCustomer(customer) {
    setForm((prev) => ({
      ...prev,

      customerId: String(customer.id),

      customerName:
        customer.fullName || '',

      customerPhone:
        customer.phone || '',

      customerEmail:
        customer.email || '',

      customerIdCard:
        customer.idCard || '',

      customerAddress:
        customer.address || '',
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

    setCustomerSearch('')
    setFormError('')
  }


  // =======================================================
  // SUBMIT
  // =======================================================

  async function handleSubmit(event) {
    event.preventDefault()

    setFormError('')

    if (!selectedRoom) {
      setFormError(
        'Không xác định được phòng cần cho thuê.',
      )
      return
    }

    const customerName =
      form.customerName.trim()

    if (!customerName) {
      setFormError(
        'Vui lòng nhập tên khách hàng.',
      )
      return
    }

    const phone =
      form.customerPhone.trim()

    if (!phone) {
      setFormError(
        'Vui lòng nhập số điện thoại khách hàng.',
      )
      return
    }

    if (!/^[0-9]{9,11}$/.test(phone)) {
      setFormError(
        'Số điện thoại phải gồm từ 9 đến 11 chữ số.',
      )
      return
    }

    const email =
      form.customerEmail.trim()

    if (email) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email)) {
        setFormError(
          'Email không đúng định dạng.',
        )
        return
      }
    }

    const guestCount =
      Number(form.guestCount)

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1
    ) {
      setFormError(
        'Số người ở phải lớn hơn hoặc bằng 1.',
      )
      return
    }

    if (
      roomCapacity &&
      guestCount > roomCapacity
    ) {
      setFormError(
        `Phòng này chỉ cho phép tối đa ${roomCapacity} người.`,
      )
      return
    }

    if (!form.checkInDate) {
      setFormError(
        'Không xác định được thời gian nhận phòng.',
      )
      return
    }

    if (!form.expectedCheckOutDate) {
      setFormError(
        'Vui lòng chọn thời gian trả phòng dự kiến.',
      )
      return
    }

    const checkIn =
      new Date(form.checkInDate)

    const checkOut =
      new Date(
        form.expectedCheckOutDate,
      )

    if (
      Number.isNaN(checkIn.getTime()) ||
      Number.isNaN(checkOut.getTime())
    ) {
      setFormError(
        'Thời gian thuê phòng không hợp lệ.',
      )
      return
    }

    if (checkOut <= checkIn) {
      setFormError(
        'Thời gian trả phòng phải sau thời gian nhận phòng.',
      )
      return
    }

    const payload = {
      roomId: Number(form.roomId),

      customerId:
        form.customerId
          ? Number(form.customerId)
          : null,

      customerName,

      customerPhone: phone,

      customerEmail:
        email || null,

      customerIdCard:
        form.customerIdCard.trim() ||
        null,

      customerAddress:
        form.customerAddress.trim() ||
        null,

      guestCount,

      checkInDate:
        form.checkInDate,

      expectedCheckOutDate:
        form.expectedCheckOutDate,

      note:
        form.note.trim() || null,
    }

    setSaving(true)

    try {
      const booking =
        await api.rentRoom(payload)

      const roomNumber =
        booking?.roomNumber ||
        selectedRoom.roomNumber

      setToast({
        type: 'success',
        message:
          `Đã cho thuê phòng ${roomNumber} thành công.`,
      })

      setTimeout(() => {
        navigate('/rooms', {
          replace: true,
          state: {
            roomRented: roomNumber,
          },
        })
      }, 600)
    } catch (err) {
      setFormError(
        err.message ||
          'Không thể cho thuê phòng.',
      )
    } finally {
      setSaving(false)
    }
  }


  // =======================================================
  // PAGE STATES
  // =======================================================

  if (loading) {
    return (
      <Loading text="Đang tải thông tin phòng..." />
    )
  }


  if (error) {
    return (
      <ErrorBox
        message={error}
        onRetry={load}
      />
    )
  }


  if (rooms.length === 0) {
    return (
      <EmptyState
        icon="🚫"
        title="Hiện không còn phòng trống"
        description="Không có phòng trống để thực hiện cho thuê."
      />
    )
  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="rent-room-page">

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />


      {/* HEADER */}
      <div className="rent-room-header">

        <div>
          <h1>Cho thuê phòng</h1>

          <p>
            Lập phiếu thuê phòng cho khách hàng
          </p>
        </div>


        <button
          type="button"
          className="rent-back-button"
          onClick={() =>
            navigate('/rooms')
          }
        >
          ← Danh sách phòng
        </button>

      </div>


      <div className="rent-room-layout">

        {/* =================================================
            LEFT
        ================================================= */}
        <div className="rent-left-column">


          {/* 1. ROOM INFORMATION */}
          <section className="rent-section">

            <h2 className="rent-section-title">
              <span className="rent-step">
                1
              </span>

              THÔNG TIN PHÒNG
            </h2>


            {selectedRoom ? (

              <div className="rent-selected-room">

                <div className="rent-room-top">

                  <div>
                    <span className="rent-room-number-label">
                      PHÒNG
                    </span>

                    <h3 className="rent-room-number">
                      {selectedRoom.roomNumber}
                    </h3>

                    <div className="rent-room-type-name">
                      {getRoomTypeName(
                        selectedRoom,
                      )}
                    </div>
                  </div>


                  <span className="rent-room-badge">
                    ● Trống
                  </span>

                </div>


                <div className="rent-room-details">

                  <div className="rent-detail-row">
                    <span>Tầng</span>

                    <strong>
                      {selectedRoom.floor ??
                        '--'}
                    </strong>
                  </div>


                  {roomCapacity != null && (
                    <div className="rent-detail-row">

                      <span>Sức chứa</span>

                      <strong>
                        {roomCapacity} người
                      </strong>

                    </div>
                  )}


                  <div className="rent-detail-row">

                    <span>Giá phòng</span>

                    <strong className="rent-price">
                      {formatMoney(roomPrice)}
                      /ngày
                    </strong>

                  </div>

                </div>

              </div>

            ) : (

              <div className="rent-room-not-selected">
                Không xác định được phòng.
              </div>

            )}

          </section>


          {/* 2. CUSTOMER */}
          <section className="rent-section">

            <h2 className="rent-section-title">
              <span className="rent-step">
                2
              </span>

              KHÁCH HÀNG
            </h2>


            <div className="rent-search-box">

              <span className="rent-search-icon">
                🔍
              </span>

              <input
                value={customerSearch}
                onChange={(event) =>
                  setCustomerSearch(
                    event.target.value,
                  )
                }
                placeholder="Tìm khách cũ..."
              />

            </div>


            <span className="rent-help">
              Tìm theo tên, số điện thoại hoặc CCCD.
              Nếu là khách mới, nhập thông tin ở biểu
              mẫu bên cạnh.
            </span>


            {customerSearch && (

              <div className="rent-customer-results">

                {matchedCustomers.length === 0 && (
                  <div className="rent-no-customer">
                    Không tìm thấy khách hàng phù hợp.
                  </div>
                )}


                {matchedCustomers.map(
                  (customer) => (

                    <button
                      type="button"
                      className="rent-customer-item"
                      key={customer.id}
                      onClick={() =>
                        pickCustomer(customer)
                      }
                    >

                      <div>
                        <strong>
                          {customer.fullName}
                        </strong>

                        <span>
                          {customer.phone}

                          {customer.idCard
                            ? ` · CCCD ${customer.idCard}`
                            : ''}
                        </span>
                      </div>


                      <span className="rent-select-text">
                        Chọn
                      </span>

                    </button>

                  ),
                )}

              </div>

            )}


            {form.customerId && (

              <div className="rent-selected-customer">

                <div>
                  <small>
                    Khách hàng đã chọn
                  </small>

                  <strong>
                    {form.customerName}
                  </strong>

                  <span>
                    {form.customerPhone}
                  </span>
                </div>


                <button
                  type="button"
                  onClick={clearCustomer}
                >
                  Đổi khách
                </button>

              </div>

            )}

          </section>

        </div>


        {/* =================================================
            RIGHT
        ================================================= */}
        <div className="rent-right-column">

          <section className="rent-section rent-form-card">

            <h2 className="rent-section-title">
              <span className="rent-step">
                3
              </span>

              THÔNG TIN THUÊ PHÒNG
            </h2>


            {formError && (
              <div className="rent-error">
                ⚠ {formError}
              </div>
            )}


            <form onSubmit={handleSubmit}>

              <div className="rent-form-grid">


                {/* CUSTOMER NAME */}
                <div className="rent-field">

                  <label>
                    Tên khách
                    <span className="rent-required">
                      {' '}*
                    </span>
                  </label>

                  <input
                    value={form.customerName}
                    onChange={(event) =>
                      update(
                        'customerName',
                        event.target.value,
                      )
                    }
                    placeholder="Nguyễn Văn A"
                    disabled={Boolean(
                      form.customerId,
                    )}
                  />

                </div>


                {/* PHONE */}
                <div className="rent-field">

                  <label>
                    Số điện thoại
                    <span className="rent-required">
                      {' '}*
                    </span>
                  </label>

                  <input
                    value={form.customerPhone}
                    onChange={(event) =>
                      update(
                        'customerPhone',
                        event.target.value,
                      )
                    }
                    placeholder="0912345678"
                    disabled={Boolean(
                      form.customerId,
                    )}
                  />

                </div>


                {/* ID CARD */}
                <div className="rent-field">

                  <label>
                    CCCD
                  </label>

                  <input
                    value={form.customerIdCard}
                    onChange={(event) =>
                      update(
                        'customerIdCard',
                        event.target.value,
                      )
                    }
                    placeholder="Nhập số CCCD"
                    disabled={Boolean(
                      form.customerId,
                    )}
                  />

                </div>


                {/* EMAIL */}
                <div className="rent-field">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(event) =>
                      update(
                        'customerEmail',
                        event.target.value,
                      )
                    }
                    placeholder="example@gmail.com"
                    disabled={Boolean(
                      form.customerId,
                    )}
                  />

                </div>


                {/* ADDRESS */}
                <div className="rent-field full">

                  <label>
                    Địa chỉ
                  </label>

                  <input
                    value={form.customerAddress}
                    onChange={(event) =>
                      update(
                        'customerAddress',
                        event.target.value,
                      )
                    }
                    placeholder="Nhập địa chỉ khách hàng"
                    disabled={Boolean(
                      form.customerId,
                    )}
                  />

                </div>


                {/* CHECK IN */}
                <div className="rent-field">

                  <label>
                    Nhận phòng
                    <span className="rent-required">
                      {' '}*
                    </span>
                  </label>

                  <input
                    type="datetime-local"
                    value={form.checkInDate}
                    readOnly
                  />

                  <span className="rent-field-hint">
                    Tự động lấy thời gian hệ thống
                  </span>

                </div>


                {/* CHECK OUT */}
                <div className="rent-field">

                  <label>
                    Trả dự kiến
                    <span className="rent-required">
                      {' '}*
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
                        event.target.value,
                      )
                    }
                    required
                  />

                  <span className="rent-field-hint">
                    Chọn ngày và giờ trả phòng
                  </span>

                </div>


                {/* GUEST COUNT */}
                <div className="rent-field">

                  <label>
                    Số người ở
                    <span className="rent-required">
                      {' '}*
                    </span>
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={
                      roomCapacity ||
                      undefined
                    }
                    value={form.guestCount}
                    onChange={(event) =>
                      update(
                        'guestCount',
                        event.target.value,
                      )
                    }
                  />

                  {roomCapacity && (
                    <span className="rent-field-hint">
                      Tối đa {roomCapacity} người
                    </span>
                  )}

                </div>


                {/* NOTE */}
                <div className="rent-field">

                  <label>
                    Ghi chú
                  </label>

                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      update(
                        'note',
                        event.target.value,
                      )
                    }
                    placeholder="Yêu cầu đặc biệt..."
                  />

                </div>

              </div>


              {/* SUMMARY */}
              {selectedRoom && (

                <div className="rent-summary">

                  <div className="rent-summary-title">
                    TÓM TẮT PHIẾU THUÊ
                  </div>


                  <div className="rent-summary-row">
                    <span>Phòng</span>

                    <strong>
                      {selectedRoom.roomNumber}
                    </strong>
                  </div>


                  <div className="rent-summary-row">
                    <span>Loại phòng</span>

                    <strong>
                      {getRoomTypeName(
                        selectedRoom,
                      )}
                    </strong>
                  </div>


                  <div className="rent-summary-row">
                    <span>Giá phòng</span>

                    <strong>
                      {formatMoney(roomPrice)}
                      /ngày
                    </strong>
                  </div>


                  <div className="rent-summary-row">
                    <span>Nhận phòng</span>

                    <strong>
                      {formatDateTime(
                        form.checkInDate,
                      )}
                    </strong>
                  </div>


                  <div className="rent-summary-row">
                    <span>Trả dự kiến</span>

                    <strong>
                      {formatDateTime(
                        form.expectedCheckOutDate,
                      )}
                    </strong>
                  </div>


                  <div className="rent-summary-row">
                    <span>Thời gian</span>

                    <strong>
                      {estimate
                        ? formatDuration(
                            estimate,
                          )
                        : '--'}
                    </strong>
                  </div>


                  {estimate && (
                    <div className="rent-summary-row">
                      <span>
                        Số ngày tính phí
                      </span>

                      <strong>
                        {estimate.chargeDays} ngày
                      </strong>
                    </div>
                  )}


                  <div className="rent-summary-row rent-summary-total">

                    <span>
                      Tổng tiền
                    </span>

                    <strong>
                      {estimate
                        ? formatMoney(
                            estimate.total,
                          )
                        : '--'}
                    </strong>

                  </div>

                </div>

              )}


              {/* ACTIONS */}
              <div className="rent-actions">

                <button
                  type="button"
                  className="rent-cancel-button"
                  disabled={saving}
                  onClick={() =>
                    navigate('/rooms')
                  }
                >
                  Quay lại
                </button>


                <button
                  type="submit"
                  className="rent-submit-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Đang lưu...'
                    : '🔑 Xác nhận'}
                </button>

              </div>

            </form>

          </section>

        </div>

      </div>

    </div>
  )
}


export default RentRoom