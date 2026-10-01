import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { API_ORIGIN, api } from '../services/api'
import { Loading } from '../components/Feedback'
import Toast from '../components/Toast'
import './RoomList.css'

const STATUSES = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: '0', label: 'Phòng trống' },
  { value: '1', label: 'Đang thuê' },
  { value: '2', label: 'Bảo trì' },
  { value: '3', label: 'Đã đặt' },
]

const STATUS_LABELS = ['Phòng trống', 'Đang thuê', 'Bảo trì', 'Đã đặt']
const STATUS_CLASSES = ['available', 'occupied', 'maintenance', 'reserved']

function getStatusCode(status) {
  if (typeof status === 'number') return status

  return {
    Available: 0,
    Occupied: 1,
    Maintenance: 2,
    Reserved: 3,
  }[status] ?? -1
}

function formatDateTime(value) {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function RoomList() {
  const location = useLocation()
  const [rooms, setRooms] = useState([])
  const [activeBookings, setActiveBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(location.state?.toast || null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    api.getRooms()
      .then((data) => {
        if (active) setRooms(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải danh sách phòng.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    api.getCurrentUser()
      .then(async (data) => {
        const admin = data.user?.role?.toLowerCase() === 'admin'
        if (!active) return
        setIsAdmin(admin)

        if (admin) {
          try {
            const bookings = await api.getActiveBookings()
            if (active) setActiveBookings(Array.isArray(bookings) ? bookings : [])
          } catch (err) {
            console.warn('Không thể tải giờ nhận/trả phòng:', err)
          }
        }
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredRooms = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi')

    return rooms
      .filter((room) => {
        const matchesSearch = !normalizedSearch || [
          room.roomNumber,
          room.roomType?.name,
          room.note,
        ].some((value) => value?.toLocaleLowerCase('vi').includes(normalizedSearch))

        return matchesSearch && (
          statusFilter === 'all' || String(getStatusCode(room.status)) === statusFilter
        )
      })
      .sort((first, second) => String(first.roomNumber).localeCompare(
        String(second.roomNumber),
        'vi',
        { numeric: true }
      ))
  }, [rooms, search, statusFilter])

  const counts = rooms.reduce((result, room) => {
    const code = getStatusCode(room.status)
    if (code >= 0 && code < 4) result[code] += 1
    return result
  }, [0, 0, 0, 0])

  async function handleDelete(room) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng ${room.roomNumber}?`)) return

    setDeletingId(room.id)
    setError('')

    try {
      await api.deleteRoom(room.id)
      setRooms((current) => current.filter((item) => item.id !== room.id))
      setToast({ type: 'success', message: `Đã xóa phòng ${room.roomNumber}.` })
    } catch (err) {
      setError(err.message || 'Không thể xóa phòng. Vui lòng thử lại.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <Loading message="Đang tải danh sách phòng..." />

  return (
    <section className="room-list-page">
      <header className="room-list-header">
        <div>
          <p className="room-list-eyebrow">QUẢN LÝ LƯU TRÚ</p>
          <h1>Danh sách phòng</h1>
          <p className="room-list-subtitle">Theo dõi thông tin và tình trạng các phòng trong khách sạn.</p>
        </div>
        {isAdmin && (
          <Link to="/rooms/add" className="room-list-add">
            <span aria-hidden="true">＋</span> Thêm phòng
          </Link>
        )}
      </header>

      {error && (
        <div className="room-list-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Đóng thông báo">×</button>
        </div>
      )}

      <div className="room-list-stats" aria-label="Tổng quan trạng thái phòng">
        <div className="room-stat room-stat-total">
          <span className="room-stat-mark" aria-hidden="true">▦</span>
          <div><span>Tổng số phòng</span><strong>{rooms.length}</strong></div>
        </div>
        {STATUS_LABELS.map((label, index) => (
          <div className={`room-stat room-stat-${STATUS_CLASSES[index]}`} key={label}>
            <span className="room-stat-mark" aria-hidden="true">{['✓', '↗', '⌁', '◷'][index]}</span>
            <div><span>{label}</span><strong>{counts[index]}</strong></div>
          </div>
        ))}
      </div>

      <section className="room-list-panel" aria-label="Bảng danh sách phòng">
        <div className="room-list-toolbar">
          <div>
            <h2>Phòng khách sạn</h2>
            <p>{filteredRooms.length} phòng hiển thị</p>
          </div>
          <div className="room-list-filters">
            <label className="room-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm số phòng, loại phòng..."
                aria-label="Tìm phòng"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Lọc theo trạng thái"
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="room-list-empty">
            <span aria-hidden="true">⌕</span>
            <strong>{rooms.length ? 'Không tìm thấy phòng phù hợp' : 'Chưa có phòng nào'}</strong>
            <p>{rooms.length ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Thêm phòng đầu tiên để bắt đầu quản lý lưu trú.'}</p>
            {!rooms.length && isAdmin && <Link to="/rooms/add">Thêm phòng mới</Link>}
          </div>
        ) : (
          <div className="room-table-scroll">
            <table className="room-list-table">
              <thead>
                <tr>
                  <th>Phòng</th>
                  <th>Loại phòng</th>
                  <th>Tầng</th>
                  <th>Trạng thái</th>
                  {isAdmin && <th className="room-actions-heading">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => {
                  const code = getStatusCode(room.status)
                  const statusIndex = code >= 0 && code < 4 ? code : -1
                  const activeBooking = activeBookings.find(
                    (booking) => Number(booking.roomId) === Number(room.id)
                  )
                  const imageUrl = room.imageUrl
                    ? (room.imageUrl.startsWith('http') ? room.imageUrl : `${API_ORIGIN}${room.imageUrl}`)
                    : ''

                  return (
                    <tr key={room.id}>
                      <td>
                        <div className="room-identity">
                          {imageUrl ? (
                            <img src={imageUrl} alt={`Phòng ${room.roomNumber}`} />
                          ) : (
                            <span className="room-thumbnail-placeholder" aria-hidden="true">⌂</span>
                          )}
                          <div>
                            <strong>Phòng {room.roomNumber}</strong>
                            <span>Mã phòng #{room.id}</span>
                            {activeBooking && (
                              <span className="room-live-booking">
                                Nhận {formatDateTime(activeBooking.checkInDate)}
                                <br />
                                Trả {formatDateTime(activeBooking.actualCheckOutDate || activeBooking.expectedCheckOutDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{room.roomType?.name || 'Chưa phân loại'}</td>
                      <td>Tầng {room.floor}</td>
                      <td>
                        <span className={`room-status ${statusIndex >= 0 ? STATUS_CLASSES[statusIndex] : ''}`}>
                          <i aria-hidden="true" />
                          {statusIndex >= 0 ? STATUS_LABELS[statusIndex] : 'Không xác định'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="room-row-actions">
                            <Link
                              to={`/rooms/${room.id}/edit`}
                              className="room-edit-action"
                              title={`Cập nhật phòng ${room.roomNumber}`}
                            >
                              <span aria-hidden="true">✎</span> Cập nhật
                            </Link>
                            <button
                              type="button"
                              className="room-delete-action"
                              onClick={() => handleDelete(room)}
                              disabled={deletingId === room.id}
                              aria-label={`Xóa phòng ${room.roomNumber}`}
                            >
                              {deletingId === room.id ? 'Đang xóa...' : 'Xóa'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </section>
  )
}

export default RoomList
