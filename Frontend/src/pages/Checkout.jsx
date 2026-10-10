import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, formatDate, formatMoney } from '../services/api'
import { ErrorBox, Loading } from '../components/Feedback'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import './Checkout.css'

const SERVICE_PRESETS = [
  { name: 'Ăn sáng', price: 50000 },
  { name: 'Giặt ủi', price: 60000 },
  { name: 'Nước suối', price: 15000 },
  { name: 'Đồ uống minibar', price: 25000 },
  { name: 'Thuê xe máy', price: 150000 },
]

function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetBookingId = searchParams.get('bookingId')

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [selectedId, setSelectedId] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [saving, setSaving] = useState(false)

  const [serviceForm, setServiceForm] = useState({ name: '', price: '', quantity: 1 })
  const [serviceError, setServiceError] = useState('')

  const [confirmCheckout, setConfirmCheckout] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getActiveBookings()
      setBookings(data)

      if (data.length === 0) {
        setSelectedId(null)
      } else if (presetBookingId && data.some((b) => String(b.id) === String(presetBookingId))) {
        setSelectedId(Number(presetBookingId))
      } else {
        setSelectedId((prev) => (data.some((b) => b.id === prev) ? prev : data[0].id))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [presetBookingId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) || null,
    [bookings, selectedId]
  )

  const totals = useMemo(() => {
    if (!selected) return { room: 0, service: 0, discount: 0, total: 0 }
    const room = Number(selected.roomAmount)
    const service = Number(selected.serviceAmount)
    const disc = Math.max(0, Number(discount) || 0)
    return { room, service, discount: disc, total: Math.max(0, room + service - disc) }
  }, [selected, discount])

  async function handleAddService(event) {
    event.preventDefault()
    setServiceError('')

    if (!selected) return
    if (!serviceForm.name.trim()) {
      setServiceError('Vui lòng nhập tên dịch vụ.')
      return
    }
    if (Number(serviceForm.price) < 0 || !serviceForm.price) {
      setServiceError('Đơn giá không hợp lệ.')
      return
    }
    if (Number(serviceForm.quantity) <= 0) {
      setServiceError('Số lượng phải lớn hơn 0.')
      return
    }

    setSaving(true)
    try {
      await api.addService(selected.id, {
        name: serviceForm.name.trim(),
        price: Number(serviceForm.price),
        quantity: Number(serviceForm.quantity),
      })
      setServiceForm({ name: '', price: '', quantity: 1 })
      setToast({ type: 'success', message: 'Đã thêm dịch vụ phát sinh.' })
      await load()
    } catch (err) {
      setServiceError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveService(serviceId) {
    setSaving(true)
    try {
      await api.removeService(serviceId)
      setToast({ type: 'success', message: 'Đã xoá dịch vụ.' })
      await load()
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleCheckout() {
    if (!selected) return

    setSaving(true)
    try {
      const result = await api.checkout(selected.id, {
        discount: Number(discount) || 0,
      })
      const invoiceData = result.invoice ?? (
        Array.isArray(result.invoices)
          ? [...result.invoices]
            .filter((item) => Number(item.bookingId) === Number(selected.id))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          : null
      )

      const invoice = invoiceData
        ? {
            ...invoiceData,
            roomNumber: result.roomNumber || selected.roomNumber,
            customerName: result.customerName || selected.customerName,
            nights: result.nights ?? selected.nights,
          }
        : null
      setConfirmCheckout(false)
      setDiscount(0)
      navigate('/rooms', {
        replace: true,
        state: {
          roomCheckedOut: selected.roomNumber,
          checkoutInvoice: invoice,
          checkoutInvoiceError: !invoice,
        },
      })
    } catch (err) {
      setToast({ type: 'error', message: err.message })
      setConfirmCheckout(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading message="Đang tải danh sách khách đang ở..." />
  if (error) return <ErrorBox message={error} onRetry={load} />

  return (
    <div className="checkout-page">
      <div className="checkout-page-header">
        <div>
          <h1>Trả phòng</h1>
          <p>Chọn khách đang ở, kiểm tra chi phí và xác nhận trả phòng.</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <section className="checkout-empty">
          <div className="checkout-empty-icon" aria-hidden="true">✓</div>
          <h2>Không có khách cần trả phòng</h2>
          <p>Tất cả lượt thuê đang lưu trú đã được xử lý.</p>
          <button type="button" className="checkout-secondary-button" onClick={() => navigate('/rooms')}>
            Xem danh sách phòng
          </button>
        </section>
      ) : (
        <div className="checkout-layout">
          <section className="checkout-panel checkout-stays">
            <div className="checkout-panel-heading">
              <div>
                <h2>Khách đang lưu trú</h2>
                <p>Chọn lượt thuê cần trả phòng</p>
              </div>
              <span className="checkout-count">{bookings.length}</span>
            </div>

            <div className="checkout-booking-list">
              {bookings.map((booking) => (
                <button
                  type="button"
                  key={booking.id}
                  className={`checkout-booking-option${booking.id === selectedId ? ' is-selected' : ''}`}
                  onClick={() => setSelectedId(booking.id)}
                  aria-pressed={booking.id === selectedId}
                >
                  <span className="checkout-room-number">{booking.roomNumber}</span>
                  <span className="checkout-booking-main">
                    <strong>{booking.customerName}</strong>
                    <span>{booking.roomTypeName} · nhận {formatDate(booking.checkInDate)}</span>
                  </span>
                  <span className="checkout-booking-total">
                    {formatMoney(Number(booking.roomAmount) + Number(booking.serviceAmount))}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {selected && (
            <section className="checkout-panel checkout-detail">
              <div className="checkout-panel-heading checkout-detail-heading">
                <div>
                  <span className="checkout-eyebrow">PHIẾU THUÊ {selected.code}</span>
                  <h2>Phòng {selected.roomNumber}</h2>
                  <p>{selected.customerName} · {selected.customerPhone}</p>
                </div>
                <span className="checkout-status">{selected.statusText || 'Đang ở'}</span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <div className="label">Khách hàng</div>
                  <div className="value">{selected.customerName}</div>
                </div>
                <div className="detail-item">
                  <div className="label">Số điện thoại</div>
                  <div className="value">{selected.customerPhone}</div>
                </div>
                <div className="detail-item">
                  <div className="label">Ngày nhận phòng</div>
                  <div className="value">{formatDate(selected.checkInDate)}</div>
                </div>
                <div className="detail-item">
                  <div className="label">Số ngày đã ở</div>
                  <div className="value">{selected.nights} ngày</div>
                </div>
                <div className="detail-item">
                  <div className="label">Giá thuê</div>
                  <div className="value">{formatMoney(selected.pricePerNight)}/ngày</div>
                </div>
                <div className="detail-item">
                  <div className="label">Tiền phòng</div>
                  <div className="value">{formatMoney(selected.roomAmount)}</div>
                </div>
              </div>

              <details className="checkout-services">
                <summary>
                  <span>Dịch vụ phát sinh</span>
                  <span className="checkout-service-count">{selected.services.length}</span>
                </summary>

                {selected.services.length === 0 ? (
                  <p className="checkout-no-services">Chưa ghi nhận dịch vụ phát sinh.</p>
                ) : (
                  <div className="table-wrap" style={{ marginBottom: 14 }}>
                    <table className="data-table" style={{ minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th className="text-right">Đơn giá</th>
                        <th className="text-center">SL</th>
                        <th className="text-right">Thành tiền</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {selected.services.map((s) => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td className="text-right">{formatMoney(s.price)}</td>
                          <td className="text-center">{s.quantity}</td>
                          <td className="text-right money">
                            {formatMoney(Number(s.price) * Number(s.quantity))}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="btn-icon danger"
                              title="Xoá dịch vụ"
                              onClick={() => handleRemoveService(s.id)}
                              disabled={saving}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                )}

                {serviceError && <div className="alert alert-error">{serviceError}</div>}

                <form className="checkout-service-form" onSubmit={handleAddService}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="checkout-service-name">Dịch vụ</label>
                      <input
                        id="checkout-service-name"
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Tên dịch vụ"
                        list="service-presets"
                        disabled={saving}
                      />
                      <datalist id="service-presets">
                        {SERVICE_PRESETS.map((s) => (
                          <option key={s.name} value={s.name} />
                        ))}
                      </datalist>
                    </div>

                    <div className="form-group">
                      <label htmlFor="checkout-service-price">Đơn giá</label>
                      <input
                        id="checkout-service-price"
                        type="number"
                        min="0"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm((p) => ({ ...p, price: e.target.value }))}
                        disabled={saving}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="checkout-service-quantity">Số lượng</label>
                      <input
                        id="checkout-service-quantity"
                        type="number"
                        min="1"
                        value={serviceForm.quantity}
                        onChange={(e) => setServiceForm((p) => ({ ...p, quantity: e.target.value }))}
                        disabled={saving}
                      />
                    </div>

                    <div className="form-group checkout-service-submit">
                      <label aria-hidden="true">&nbsp;</label>
                      <button type="submit" className="checkout-secondary-button" disabled={saving}>
                        {saving ? 'Đang thêm...' : 'Thêm dịch vụ'}
                      </button>
                    </div>
                  </div>

                  <div className="checkout-service-presets">
                    {SERVICE_PRESETS.map((service) => (
                      <button
                        type="button"
                        key={service.name}
                        onClick={() => setServiceForm({
                          name: service.name,
                          price: String(service.price),
                          quantity: 1,
                        })}
                        disabled={saving}
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                </form>
              </details>

              {/* ===== TỔNG KẾT ===== */}
              <div className="summary-box checkout-summary">
                <div className="summary-row">
                  <span>Tiền phòng ({selected.nights} ngày)</span>
                  <strong>{formatMoney(totals.room)}</strong>
                </div>
                <div className="summary-row">
                  <span>Tiền dịch vụ</span>
                  <strong>{formatMoney(totals.service)}</strong>
                </div>

                <div className="summary-row">
                  <span>Giảm giá</span>
                  <input
                    aria-label="Giảm giá"
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="summary-row grand">
                  <span>Khách phải trả</span>
                  <span>{formatMoney(totals.total)}</span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="checkout-primary-button"
                  onClick={() => setConfirmCheckout(true)}
                  disabled={saving}
                >
                  {saving ? 'Đang xử lý...' : 'Xác nhận trả phòng'}
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ===== XÁC NHẬN TRẢ PHÒNG ===== */}
      {confirmCheckout && selected && (
        <Modal
          title="Xác nhận trả phòng"
          size="sm"
          onClose={() => setConfirmCheckout(false)}
          footer={
            <>
              <button type="button" className="checkout-secondary-button" onClick={() => setConfirmCheckout(false)}>
                Huỷ
              </button>
              <button type="button" className="checkout-primary-button" onClick={handleCheckout} disabled={saving}>
                {saving ? 'Đang xử lý...' : 'Trả phòng & lập hoá đơn'}
              </button>
            </>
          }
        >
          <p>
            Trả phòng <strong>{selected.roomNumber}</strong> cho khách{' '}
            <strong>{selected.customerName}</strong>?
          </p>
          <div className="summary-box">
            <div className="summary-row">
              <span>Tiền phòng</span>
              <strong>{formatMoney(totals.room)}</strong>
            </div>
            <div className="summary-row">
              <span>Tiền dịch vụ</span>
              <strong>{formatMoney(totals.service)}</strong>
            </div>
            <div className="summary-row">
              <span>Giảm giá</span>
              <strong>-{formatMoney(totals.discount)}</strong>
            </div>
            <div className="summary-row grand">
              <span>Tổng thanh toán</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>
          <p className="text-muted">Sau khi trả phòng, phòng sẽ trở về trạng thái Trống.</p>
        </Modal>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}

export default Checkout