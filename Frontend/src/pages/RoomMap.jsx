import { useEffect, useMemo, useState } from 'react'
import './RoomMap.css'

const API_URL = 'http://localhost:5097/api/rooms'

const STATUS_INFO = {
  0: {
    label: 'Phòng trống',
    className: 'available',
    icon: '✓',
  },
  1: {
    label: 'Đã đặt',
    className: 'reserved',
    icon: '◷',
  },
  2: {
    label: 'Đang thuê',
    className: 'occupied',
    icon: '●',
  },
  3: {
    label: 'Bảo trì',
    className: 'maintenance',
    icon: '⚙',
  },
}

function RoomMap() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [floor, setFloor] = useState('all')
  const [status, setStatus] = useState('all')
  const [selectedRoom, setSelectedRoom] = useState(null)

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Không thể tải danh sách phòng.')
      }

      const data = await response.json()
      setRooms(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError('Không thể tải sơ đồ phòng. Vui lòng kiểm tra Backend.')
    } finally {
      setLoading(false)
    }
  }

  const floors = useMemo(() => {
    return [...new Set(rooms.map((room) => room.floor))]
      .filter((item) => item !== null && item !== undefined)
      .sort((a, b) => Number(a) - Number(b))
  }, [rooms])

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return rooms.filter((room) => {
      const matchesSearch =
        !keyword ||
        String(room.roomNumber || '').toLowerCase().includes(keyword) ||
        String(room.roomType?.name || '').toLowerCase().includes(keyword)

      const matchesFloor =
        floor === 'all' || String(room.floor) === String(floor)

      const matchesStatus =
        status === 'all' || String(room.status) === String(status)

      return matchesSearch && matchesFloor && matchesStatus
    })
  }, [rooms, search, floor, status])

  const roomsByFloor = useMemo(() => {
    return filteredRooms.reduce((groups, room) => {
      const key = room.floor ?? 'Khác'

      if (!groups[key]) {
        groups[key] = []
      }

      groups[key].push(room)
      return groups
    }, {})
  }, [filteredRooms])

  const countStatus = (value) =>
    rooms.filter((room) => Number(room.status) === value).length

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'Chưa cập nhật'

    return `${Number(price).toLocaleString('vi-VN')}đ / đêm`
  }

  if (loading) {
    return (
      <div className="room-map-page">
        <div className="room-map-loading">
          <div className="room-map-spinner" />
          <p>Đang tải sơ đồ phòng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="room-map-page">
      <div className="room-map-heading">
        <div>
          <h1>Sơ đồ phòng</h1>
          <p>Theo dõi và quản lý tình trạng phòng trong khách sạn</p>
        </div>

        <button className="refresh-button" onClick={loadRooms}>
          ↻ Làm mới
        </button>
      </div>

      <div className="room-summary">
        <div className="summary-card summary-all">
          <div className="summary-icon">▦</div>
          <div>
            <span>Tổng số phòng</span>
            <strong>{rooms.length}</strong>
          </div>
        </div>

        <div className="summary-card summary-available">
          <div className="summary-icon">✓</div>
          <div>
            <span>Phòng trống</span>
            <strong>{countStatus(0)}</strong>
          </div>
        </div>

        <div className="summary-card summary-reserved">
          <div className="summary-icon">◷</div>
          <div>
            <span>Đã đặt</span>
            <strong>{countStatus(1)}</strong>
          </div>
        </div>

        <div className="summary-card summary-occupied">
          <div className="summary-icon">●</div>
          <div>
            <span>Đang thuê</span>
            <strong>{countStatus(2)}</strong>
          </div>
        </div>

        <div className="summary-card summary-maintenance">
          <div className="summary-icon">⚙</div>
          <div>
            <span>Bảo trì</span>
            <strong>{countStatus(3)}</strong>
          </div>
        </div>
      </div>

      <div className="room-map-toolbar">
        <div className="room-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Tìm theo số phòng hoặc loại phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={floor} onChange={(e) => setFloor(e.target.value)}>
          <option value="all">Tất cả tầng</option>

          {floors.map((item) => (
            <option key={item} value={item}>
              Tầng {item}
            </option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="0">Phòng trống</option>
          <option value="1">Đã đặt</option>
          <option value="2">Đang thuê</option>
          <option value="3">Bảo trì</option>
        </select>
      </div>

      <div className="room-map-legend">
        <span><i className="legend-dot available-dot" /> Phòng trống</span>
        <span><i className="legend-dot reserved-dot" /> Đã đặt</span>
        <span><i className="legend-dot occupied-dot" /> Đang thuê</span>
        <span><i className="legend-dot maintenance-dot" /> Bảo trì</span>
      </div>

      {error && <div className="room-map-error">{error}</div>}

      {!error && Object.keys(roomsByFloor).length === 0 && (
        <div className="room-map-empty">
          <div>⌕</div>
          <h3>Không tìm thấy phòng</h3>
          <p>Không có phòng phù hợp với điều kiện tìm kiếm.</p>
        </div>
      )}

      <div className="floors-container">
        {Object.entries(roomsByFloor)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([floorNumber, floorRooms]) => (
            <section className="floor-section" key={floorNumber}>
              <div className="floor-heading">
                <div>
                  <span className="floor-icon">▦</span>
                  <h2>Tầng {floorNumber}</h2>
                </div>

                <span className="floor-count">
                  {floorRooms.length} phòng
                </span>
              </div>

              <div className="rooms-grid">
                {floorRooms
                  .sort((a, b) =>
                    String(a.roomNumber).localeCompare(
                      String(b.roomNumber),
                      undefined,
                      { numeric: true }
                    )
                  )
                  .map((room) => {
                    const info =
                      STATUS_INFO[Number(room.status)] || STATUS_INFO[0]

                    return (
                      <article
                        className={`room-card ${info.className}`}
                        key={room.id}
                      >
                        <div className="room-card-top">
                          <span
                            className={`room-status ${info.className}`}
                          >
                            <i />
                            {info.label}
                          </span>

                          <span className="room-floor">
                            Tầng {room.floor}
                          </span>
                        </div>

                        <div className="room-number">
                          {room.roomNumber}
                        </div>

                        <div className="room-type">
                          {room.roomType?.name || 'Chưa phân loại'}
                        </div>

                        <div className="room-details">
                          <div>
                            <span>👥</span>
                            <p>
                              <small>Sức chứa</small>
                              <strong>
                                {room.roomType?.capacity || '--'} người
                              </strong>
                            </p>
                          </div>

                          <div>
                            <span>◈</span>
                            <p>
                              <small>Giá phòng</small>
                              <strong>
                                {formatPrice(room.roomType?.pricePerNight)}
                              </strong>
                            </p>
                          </div>
                        </div>

                        {room.note && (
                          <div className="room-note">
                            {room.note}
                          </div>
                        )}

                        <button
  type="button"
  className="room-detail-button"
  onClick={() => setSelectedRoom(room)}
>
  Xem chi tiết
  <span>→</span>
</button>
                      </article>
                    )
                  })}
              </div>
            </section>
          ))}
      </div>
      {selectedRoom && (
  <div
    className="room-detail-overlay"
    onClick={() => setSelectedRoom(null)}
  >
    <div
      className="room-detail-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="room-modal-close"
        onClick={() => setSelectedRoom(null)}
      >
        ×
      </button>

      <div className="room-modal-header">
        <div>
          <span className="room-modal-label">
            THÔNG TIN PHÒNG
          </span>

          <h2>Phòng {selectedRoom.roomNumber}</h2>

          <p>
            {selectedRoom.roomType?.name || 'Chưa phân loại'} • Tầng{' '}
            {selectedRoom.floor}
          </p>
        </div>

        <span
          className={`room-status ${
            STATUS_INFO[Number(selectedRoom.status)]?.className ||
            'available'
          }`}
        >
          <i />
          {STATUS_INFO[Number(selectedRoom.status)]?.label ||
            'Không xác định'}
        </span>
      </div>

      {selectedRoom.imageUrl && (
        <div className="room-modal-image">
          <img
            src={`http://localhost:5097${selectedRoom.imageUrl}`}
            alt={`Phòng ${selectedRoom.roomNumber}`}
          />
        </div>
      )}

      <div className="room-modal-info">
        <div className="room-modal-info-item">
          <span>🏨</span>
          <div>
            <small>Loại phòng</small>
            <strong>
              {selectedRoom.roomType?.name || 'Chưa cập nhật'}
            </strong>
          </div>
        </div>

        <div className="room-modal-info-item">
          <span>▦</span>
          <div>
            <small>Tầng</small>
            <strong>Tầng {selectedRoom.floor}</strong>
          </div>
        </div>

        <div className="room-modal-info-item">
          <span>👥</span>
          <div>
            <small>Sức chứa</small>
            <strong>
              {selectedRoom.roomType?.capacity || '--'} người
            </strong>
          </div>
        </div>

        <div className="room-modal-info-item">
          <span>◈</span>
          <div>
            <small>Giá phòng</small>
            <strong>
              {formatPrice(selectedRoom.roomType?.pricePerNight)}
            </strong>
          </div>
        </div>
      </div>

      <div className="room-modal-note">
        <span>Ghi chú</span>

        <p>
          {selectedRoom.note?.trim()
            ? selectedRoom.note
            : 'Không có ghi chú cho phòng này.'}
        </p>
      </div>

      <div className="room-modal-footer">
        <button
          type="button"
          className="room-modal-back"
          onClick={() => setSelectedRoom(null)}
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

export default RoomMap