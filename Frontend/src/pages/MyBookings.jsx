import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { API_ORIGIN, api, formatDate, formatMoney } from '../services/api'
import { ErrorBox, Loading } from '../components/Feedback'
import Toast from '../components/Toast'
import './MyBookings.css'

const BOOKING_STATUS = {
  Booked: { label: 'Đã đặt', className: 'booked' },
  CheckedIn: { label: 'Đang lưu trú', className: 'checked-in' },
  CheckedOut: { label: 'Đã trả phòng', className: 'checked-out' },
  Cancelled: { label: 'Đã hủy', className: 'cancelled' },
}

function MyBookings() {
  const location = useLocation()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(location.state?.toast || null)

  useEffect(() => {
    let active = true

    api.getMyBookings()
      .then((data) => {
        if (active) setBookings(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải danh sách đặt phòng.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (loading) return <Loading message="Đang tải phòng bạn đã đặt..." />
  if (error) return <ErrorBox message={error} />

  return (
    <main className="my-bookings-page">
      <header className="my-bookings-heading">
        <div>
          <p className="my-bookings-kicker">KỲ NGHỈ CỦA BẠN</p>
          <h1>Phòng bạn đã đặt</h1>
          <p>Quản lý thông tin phòng trong các lượt đặt của tài khoản.</p>
        </div>
        <Link className="my-bookings-browse" to="/rooms">Khám phá phòng <span aria-hidden="true">→</span></Link>
      </header>

      <div className="my-bookings-summary">
        <span className="my-bookings-summary-icon" aria-hidden="true">▤</span>
        <div><strong>{bookings.length}</strong><span>{bookings.length === 1 ? 'lượt đặt của bạn' : 'lượt đặt của bạn'}</span></div>
      </div>

      {bookings.length === 0 ? (
        <section className="my-bookings-empty">
          <div className="my-bookings-empty-mark" aria-hidden="true">⌂</div>
          <h2>Chưa có lượt đặt phòng</h2>
          <p>Các phòng bạn đặt sẽ xuất hiện tại đây để tiện theo dõi và cập nhật thông tin.</p>
          <Link to="/rent-room">Đặt phòng đầu tiên</Link>
        </section>
      ) : (
        <section className="my-bookings-list" aria-label="Các lượt đặt phòng của bạn">
          {bookings.map((booking) => {
            const imageUrl = booking.roomImageUrl
              ? (booking.roomImageUrl.startsWith('http') ? booking.roomImageUrl : `${API_ORIGIN}${booking.roomImageUrl}`)
              : ''
            const status = BOOKING_STATUS[booking.status] || { label: booking.statusText || 'Không xác định', className: '' }
            const canEdit = booking.status === 'Booked'

            return (
              <article className="my-booking-item" key={booking.id}>
                <div className="my-booking-photo">
                  {imageUrl ? <img src={imageUrl} alt={`Phòng ${booking.roomNumber}`} /> : <div className="my-booking-photo-empty" aria-hidden="true">⌂</div>}
                  <span className={`my-booking-status ${status.className}`}><i aria-hidden="true" />{status.label}</span>
                </div>
                <div className="my-booking-content">
                  <div className="my-booking-topline">
                    <div>
                      <span className="my-booking-reference">MÃ ĐẶT PHÒNG {booking.code}</span>
                      <h2>Phòng {booking.roomNumber}</h2>
                      <p>{booking.roomTypeName || 'Phòng khách sạn'} <span>·</span> Tầng {booking.floor}</p>
                    </div>
                    <strong className="my-booking-price">{formatMoney(booking.pricePerNight)}<small> / đêm</small></strong>
                  </div>
                  <div className="my-booking-details">
                    <div><span>Ngày nhận phòng</span><strong>{formatDate(booking.checkInDate)}</strong></div>
                    <div><span>Dự kiến trả phòng</span><strong>{booking.expectedCheckOutDate ? formatDate(booking.expectedCheckOutDate) : 'Chưa xác định'}</strong></div>
                    <div><span>Số khách</span><strong>{booking.guestCount} người</strong></div>
                  </div>
                  {booking.roomNote && <p className="my-booking-note">{booking.roomNote}</p>}
                  <div className="my-booking-actions">
                    {canEdit ? (
                      <Link to={`/my-bookings/${booking.id}/edit`} className="my-booking-edit"><span aria-hidden="true">✎</span> Cập nhật thông tin phòng</Link>
                    ) : (
                      <span className="my-booking-locked">Thông tin phòng được khóa sau khi nhận phòng</span>
                    )}
                    <span className="my-booking-protection">Phòng thuộc tài khoản của bạn</span>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </main>
  )
}

export default MyBookings