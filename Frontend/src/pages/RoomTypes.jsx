import { useEffect, useMemo, useState } from 'react'
import { api, formatMoney } from '../services/api'
import Toast from '../components/Toast'
import './RoomTypes.css'

function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [capacityFilter, setCapacityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'

  // Modals state
  const [detailModal, setDetailModal] = useState({ open: false, data: null, loading: false })
  const [formModal, setFormModal] = useState({ open: false, isEdit: false, id: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, loading: false })

  // Form values
  const [formData, setFormData] = useState({
    name: '',
    pricePerNight: '',
    capacity: 2,
    description: '',
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Notification Toast
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Load Room Types
  const loadRoomTypes = async () => {
    setLoading(true)
    try {
      const data = await api.getRoomTypes()
      setRoomTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Lỗi khi tải danh sách thể loại phòng:', error)
      showToast(error.message || 'Không thể tải danh sách thể loại phòng.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoomTypes()
  }, [])

  // Quick Stats
  const stats = useMemo(() => {
    const totalTypes = roomTypes.length
    const totalRooms = roomTypes.reduce((acc, curr) => acc + (curr.totalRooms || 0), 0)
    const availableRooms = roomTypes.reduce((acc, curr) => acc + (curr.availableRooms || 0), 0)
    const avgPrice = totalTypes > 0
      ? roomTypes.reduce((acc, curr) => acc + (Number(curr.pricePerNight) || 0), 0) / totalTypes
      : 0

    return { totalTypes, totalRooms, availableRooms, avgPrice }
  }, [roomTypes])

  // Filtered & Sorted List
  const filteredRoomTypes = useMemo(() => {
    let result = [...roomTypes]

    // Search filter
    if (search.trim()) {
      const keyword = search.trim().toLowerCase()
      result = result.filter(
        (rt) =>
          rt.name?.toLowerCase().includes(keyword) ||
          rt.description?.toLowerCase().includes(keyword)
      )
    }

    // Capacity filter
    if (capacityFilter === '1-2') {
      result = result.filter((rt) => rt.capacity <= 2)
    } else if (capacityFilter === '3') {
      result = result.filter((rt) => rt.capacity === 3)
    } else if (capacityFilter === '4+') {
      result = result.filter((rt) => rt.capacity >= 4)
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.pricePerNight) - Number(b.pricePerNight))
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.pricePerNight) - Number(a.pricePerNight))
    } else if (sortBy === 'capacity-asc') {
      result.sort((a, b) => a.capacity - b.capacity)
    } else if (sortBy === 'capacity-desc') {
      result.sort((a, b) => b.capacity - a.capacity)
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name, 'vi'))
    }

    return result
  }, [roomTypes, search, capacityFilter, sortBy])

  // Get Icon and Gradient based on RoomType name
  const getTypeMeta = (name = '') => {
    const lower = name.toLowerCase()
    if (lower.includes('vip') || lower.includes('tổng thống') || lower.includes('president')) {
      return { icon: '👑', colorClass: 'amber', badge: 'Hạng VIP Hoàng Gia' }
    }
    if (lower.includes('suite') || lower.includes('gia đình') || lower.includes('family')) {
      return { icon: '👨‍👩‍👧‍👦', colorClass: 'purple', badge: 'Hạng Gia Đình' }
    }
    if (lower.includes('deluxe') || lower.includes('sang trọng')) {
      return { icon: '💎', colorClass: 'blue', badge: 'Hạng Deluxe' }
    }
    if (lower.includes('superior') || lower.includes('cao cấp')) {
      return { icon: '✨', colorClass: 'green', badge: 'Hạng Cao Cấp' }
    }
    return { icon: '🛏️', colorClass: 'blue', badge: 'Hạng Tiêu Chuẩn' }
  }

  // Handle View Detail
  const handleOpenDetail = async (id) => {
    setDetailModal({ open: true, data: null, loading: true })
    try {
      const data = await api.getRoomTypeById(id)
      setDetailModal({ open: true, data, loading: false })
    } catch (error) {
      console.error('Lỗi khi tải chi tiết thể loại phòng:', error)
      showToast(error.message || 'Không thể tải chi tiết thể loại phòng.', 'error')
      setDetailModal({ open: false, data: null, loading: false })
    }
  }

  // Handle Open Create / Edit Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      pricePerNight: '',
      capacity: 2,
      description: '',
    })
    setFormError('')
    setFormModal({ open: true, isEdit: false, id: null })
  }

  const handleOpenEdit = (item) => {
    setFormData({
      name: item.name,
      pricePerNight: item.pricePerNight,
      capacity: item.capacity,
      description: item.description || '',
    })
    setFormError('')
    setFormModal({ open: true, isEdit: true, id: item.id })
  }

  // Handle Submit Form (Create / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên thể loại phòng.')
      return
    }

    const price = Number(formData.pricePerNight)
    if (Number.isNaN(price) || price < 0) {
      setFormError('Giá mỗi đêm phải là số hợp lệ lớn hơn hoặc bằng 0.')
      return
    }

    const capacity = Number(formData.capacity)
    if (Number.isNaN(capacity) || capacity < 1) {
      setFormError('Sức chứa phải từ 1 người trở lên.')
      return
    }

    setFormSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        pricePerNight: price,
        capacity: capacity,
        description: formData.description.trim() || null,
      }

      if (formModal.isEdit) {
        await api.updateRoomType(formModal.id, payload)
        showToast('Cập nhật thể loại phòng thành công!')
      } else {
        await api.createRoomType(payload)
        showToast('Thêm thể loại phòng mới thành công!')
      }

      setFormModal({ open: false, isEdit: false, id: null })
      await loadRoomTypes()
    } catch (error) {
      setFormError(error.message || 'Có lỗi xảy ra khi lưu thể loại phòng.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Delete Modal
  const handleOpenDelete = (item) => {
    setDeleteModal({ open: true, item, loading: false })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return
    setDeleteModal((prev) => ({ ...prev, loading: true }))

    try {
      const res = await api.deleteRoomType(deleteModal.item.id)
      showToast(res?.message || 'Đã xóa thể loại phòng thành công!')
      setDeleteModal({ open: false, item: null, loading: false })
      await loadRoomTypes()
    } catch (error) {
      showToast(error.message || 'Không thể xóa thể loại phòng.', 'error')
      setDeleteModal((prev) => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="room-types-page">
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      {/* ===== HEADER ===== */}
      <div className="room-types-header">
        <div>
          <div className="room-types-breadcrumb">QUẢN LÝ KHÁCH SẠN / THỂ LOẠI PHÒNG</div>
          <h1>Danh Sách Thể Loại Phòng</h1>
          <p>Quản lý các hạng phòng, đơn giá lưu trú, sức chứa tối đa và theo dõi các phòng trực thuộc</p>
        </div>

        <div className="room-types-header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={loadRoomTypes}
            title="Làm mới dữ liệu"
          >
            🔄 Làm mới
          </button>
          <button
            type="button"
            className="btn-primary-add"
            onClick={handleOpenCreate}
          >
            ➕ Thêm loại phòng
          </button>
        </div>
      </div>

      {/* ===== STATS OVERVIEW ===== */}
      <div className="room-types-stats">
        <div className="stat-card">
          <div className="stat-icon blue">🏷️</div>
          <div className="stat-info">
            <span>Tổng loại phòng</span>
            <strong>{stats.totalTypes}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-info">
            <span>Đơn giá trung bình</span>
            <strong>{formatMoney(stats.avgPrice)}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">🚪</div>
          <div className="stat-info">
            <span>Tổng số phòng có sẵn</span>
            <strong>{stats.totalRooms} phòng</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">🟢</div>
          <div className="stat-info">
            <span>Phòng đang trống</span>
            <strong>{stats.availableRooms} / {stats.totalRooms}</strong>
          </div>
        </div>
      </div>

      {/* ===== TOOLBAR ===== */}
      <div className="room-types-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên thể loại, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
          >
            <option value="all">Sức chứa: Tất cả</option>
            <option value="1-2">Tối đa 1 - 2 người</option>
            <option value="3">3 người</option>
            <option value="4+">Từ 4 người trở lên</option>
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="price-asc">Giá: Thấp đến Cao</option>
            <option value="price-desc">Giá: Cao đến Thấp</option>
            <option value="capacity-asc">Sức chứa: Ít đến Nhiều</option>
            <option value="capacity-desc">Sức chứa: Nhiều đến Ít</option>
            <option value="name-asc">Tên loại phòng: A - Z</option>
            <option value="name-desc">Tên loại phòng: Z - A</option>
          </select>
        </div>

        <div className="toolbar-right">
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Chế độ thẻ lưới"
            >
              ⊞ Lưới
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Chế độ bảng dữ liệu"
            >
              ☰ Bảng
            </button>
          </div>
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      {loading ? (
        <div className="room-types-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách thể loại phòng...</p>
        </div>
      ) : filteredRoomTypes.length === 0 ? (
        <div className="room-types-empty">
          <div className="empty-icon">📂</div>
          <h3>Không tìm thấy thể loại phòng nào</h3>
          <p>
            {search || capacityFilter !== 'all'
              ? 'Không có kết quả nào phù hợp với bộ lọc hiện tại. Hãy thử tìm kiếm từ khóa khác.'
              : 'Hệ thống hiện chưa có thể loại phòng nào. Bạn có thể thêm mới ngay bây giờ.'}
          </p>
          {search || capacityFilter !== 'all' ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearch('')
                setCapacityFilter('all')
              }}
            >
              Xóa bộ lọc tìm kiếm
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary-add"
              onClick={handleOpenCreate}
            >
              ➕ Thêm thể loại phòng đầu tiên
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ===== GRID VIEW ===== */
        <div className="room-types-grid">
          {filteredRoomTypes.map((item) => {
            const meta = getTypeMeta(item.name)
            const availablePercent =
              item.totalRooms > 0
                ? Math.round((item.availableRooms / item.totalRooms) * 100)
                : 0

            return (
              <div key={item.id} className="type-card">
                <div className="type-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="type-badge-icon">{meta.icon}</div>
                    <div>
                      <h3 className="type-card-title">{item.name}</h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Mã loại: #{item.id}
                      </span>
                    </div>
                  </div>

                  <div className="type-card-price-tag">
                    <span className="price-amount">{formatMoney(item.pricePerNight)}</span>
                    <span className="price-unit">/ đêm</span>
                  </div>
                </div>

                <div className="type-card-body">
                  <div className="type-meta-badges">
                    <span className="meta-badge capacity">
                      👥 Sức chứa: <strong>{item.capacity} người</strong>
                    </span>
                    <span className="meta-badge rooms">
                      🚪 Tổng: <strong>{item.totalRooms} phòng</strong>
                    </span>
                    <span className="meta-badge available">
                      🟢 Trống: <strong>{item.availableRooms}</strong>
                    </span>
                    {item.occupiedRooms > 0 && (
                      <span className="meta-badge occupied">
                        🔴 Đang thuê: <strong>{item.occupiedRooms}</strong>
                      </span>
                    )}
                  </div>

                  <p className="type-description">
                    {item.description || 'Chưa có mô tả chi tiết cho thể loại phòng này.'}
                  </p>

                  <div className="occupancy-section">
                    <div className="occupancy-labels">
                      <span>Tình trạng phòng ({item.availableRooms}/{item.totalRooms} trống)</span>
                      <span>{availablePercent}%</span>
                    </div>
                    <div className="occupancy-bar">
                      <div
                        className="occupancy-fill-available"
                        style={{ width: `${availablePercent}%` }}
                        title={`${availablePercent}% phòng trống`}
                      ></div>
                      <div
                        className="occupancy-fill-occupied"
                        style={{ width: `${100 - availablePercent}%` }}
                        title={`${100 - availablePercent}% đang sử dụng`}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="type-card-actions">
                  <button
                    type="button"
                    className="btn-card-action view"
                    onClick={() => handleOpenDetail(item.id)}
                  >
                    🔍 Xem {item.totalRooms} phòng
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-card-action edit"
                      onClick={() => handleOpenEdit(item)}
                      title="Chỉnh sửa thể loại phòng"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      type="button"
                      className="btn-card-action delete"
                      onClick={() => handleOpenDelete(item)}
                      title="Xóa thể loại phòng"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ===== TABLE VIEW ===== */
        <div className="room-types-table-card">
          <div className="table-responsive">
            <table className="room-types-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Thể loại phòng</th>
                  <th>Sức chứa</th>
                  <th>Giá mỗi đêm</th>
                  <th>Tổng phòng</th>
                  <th>Phòng trống</th>
                  <th>Mô tả</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoomTypes.map((item) => {
                  const meta = getTypeMeta(item.name)
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: '#64748b' }}>#{item.id}</td>
                      <td>
                        <div className="table-type-name">
                          <span className="table-type-icon">{meta.icon}</span>
                          <div>
                            <strong>{item.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="meta-badge capacity">
                          👥 {item.capacity} khách
                        </span>
                      </td>
                      <td>
                        <span className="table-price">{formatMoney(item.pricePerNight)}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}> / đêm</span>
                      </td>
                      <td>
                        <strong>{item.totalRooms}</strong> phòng
                      </td>
                      <td>
                        <span className="status-pill available">
                          {item.availableRooms} phòng trống
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            maxWidth: '280px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '13px',
                            color: '#64748b',
                          }}
                          title={item.description}
                        >
                          {item.description || 'Chưa có mô tả'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-card-action view"
                            onClick={() => handleOpenDetail(item.id)}
                            title="Xem chi tiết các phòng"
                          >
                            🔍 Xem
                          </button>
                          <button
                            type="button"
                            className="btn-card-action edit"
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-card-action delete"
                            onClick={() => handleOpenDelete(item)}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {detailModal.open && (
        <div className="modal-backdrop" onClick={() => setDetailModal({ open: false, data: null, loading: false })}>
          <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi Tiết Thể Loại Phòng: {detailModal.data?.name || 'Đang tải...'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDetailModal({ open: false, data: null, loading: false })}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {detailModal.loading ? (
                <div className="room-types-loading" style={{ padding: '30px' }}>
                  <div className="loading-spinner"></div>
                  <p>Đang tải dữ liệu phòng...</p>
                </div>
              ) : detailModal.data ? (
                <>
                  <div className="detail-overview-grid">
                    <div className="detail-item">
                      <span>Đơn giá niêm yết</span>
                      <strong style={{ color: '#2563eb' }}>
                        {formatMoney(detailModal.data.pricePerNight)} / đêm
                      </strong>
                    </div>
                    <div className="detail-item">
                      <span>Sức chứa tối đa</span>
                      <strong>👥 {detailModal.data.capacity} người lớn</strong>
                    </div>
                    <div className="detail-item">
                      <span>Số lượng phòng</span>
                      <strong>
                        {detailModal.data.availableRooms} trống / {detailModal.data.totalRooms} tổng
                      </strong>
                    </div>
                  </div>

                  <div className="detail-desc-box">
                    <h4>Mô tả tiện nghi & thông tin loại phòng:</h4>
                    <p>{detailModal.data.description || 'Chưa có thông tin mô tả chi tiết.'}</p>
                  </div>

                  <h4 className="rooms-subtable-header">
                    Danh sách phòng thuộc loại này ({detailModal.data.rooms?.length || 0} phòng):
                  </h4>

                  {(!detailModal.data.rooms || detailModal.data.rooms.length === 0) ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic', margin: '10px 0' }}>
                      Chưa có phòng nào được gán cho thể loại này. Hãy tạo phòng mới trong mục &quot;Thêm phòng&quot;.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="room-types-table">
                        <thead>
                          <tr>
                            <th>Số phòng</th>
                            <th>Tầng</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailModal.data.rooms.map((room) => (
                            <tr key={room.id}>
                              <td>
                                <strong style={{ color: '#0f172a', fontSize: '15px' }}>
                                  Phòng {room.roomNumber}
                                </strong>
                              </td>
                              <td>Tầng {room.floor}</td>
                              <td>
                                <span
                                  className={`status-pill ${
                                    room.status === 0
                                      ? 'available'
                                      : room.status === 1
                                      ? 'occupied'
                                      : room.status === 3
                                      ? 'reserved'
                                      : 'maintenance'
                                  }`}
                                >
                                  {room.statusName}
                                </span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: '13px' }}>
                                {room.note || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDetailModal({ open: false, data: null, loading: false })}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE / EDIT MODAL ===== */}
      {formModal.open && (
        <div className="modal-backdrop" onClick={() => !formSubmitting && setFormModal({ open: false, isEdit: false, id: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitForm}>
              <div className="modal-header">
                <h3>{formModal.isEdit ? 'Chỉnh Sửa Thể Loại Phòng' : 'Thêm Thể Loại Phòng Mới'}</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => !formSubmitting && setFormModal({ open: false, isEdit: false, id: null })}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {formError && <div className="modal-alert-error">⚠️ {formError}</div>}

                <div className="form-group">
                  <label>
                    Tên thể loại phòng <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phòng Deluxe Hướng Biển, Family Suite..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                  <span className="form-hint">Tên định danh rõ ràng để nhân viên và khách dễ nhận biết.</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Đơn giá mỗi đêm (VNĐ) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="Ví dụ: 500000"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                      required
                    />
                    <span className="form-hint">
                      {formData.pricePerNight
                        ? `Xem trước: ${formatMoney(formData.pricePerNight)}/đêm`
                        : 'Nhập số tiền VNĐ'}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>
                      Sức chứa tối đa (Khách) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="Ví dụ: 2"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                    <span className="form-hint">Số khách lưu trú tối đa quy định</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả tiện ích &amp; trang thiết bị</label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả giường, diện tích, ban công, thiết bị đi kèm (máy lạnh, bồn tắm, smart TV, wifi...)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setFormModal({ open: false, isEdit: false, id: null })}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary-modal"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? 'Đang lưu...'
                    : formModal.isEdit
                    ? 'Lưu thay đổi'
                    : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteModal.open && deleteModal.item && (
        <div className="modal-backdrop" onClick={() => !deleteModal.loading && setDeleteModal({ open: false, item: null, loading: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác Nhận Xóa Thể Loại Phòng</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !deleteModal.loading && setDeleteModal({ open: false, item: null, loading: false })}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#1e293b' }}>
                Bạn có chắc chắn muốn xóa thể loại phòng: <strong>{deleteModal.item.name}</strong> không?
              </p>

              {deleteModal.item.totalRooms > 0 ? (
                <div className="modal-alert-error">
                  ⚠️ <strong>Cảnh báo:</strong> Thể loại phòng này hiện đang có{' '}
                  <strong>{deleteModal.item.totalRooms} phòng</strong> liên kết. Hệ thống sẽ{' '}
                  <strong>không cho phép xóa</strong> để bảo đảm toàn vẹn dữ liệu. Hãy xóa hoặc đổi thể loại cho các phòng đó trước.
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Hành động này sẽ xóa hoàn toàn thể loại phòng khỏi hệ thống và không thể hoàn tác.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModal({ open: false, item: null, loading: false })}
                disabled={deleteModal.loading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-danger-modal"
                onClick={handleConfirmDelete}
                disabled={deleteModal.loading || deleteModal.item.totalRooms > 0}
              >
                {deleteModal.loading ? 'Đang xóa...' : 'Xóa thể loại phòng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoomTypes
