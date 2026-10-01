import { useEffect, useMemo, useState } from 'react'
import { api, formatMoney } from '../services/api'
import Toast from '../components/Toast'
import './RoomTypes.css'

// Encore Photo Library (copied from Encore assets)
const ENCORE_IMAGE_PRESETS = [
  { id: '06', url: '/room-types/06.jpg', title: 'Presidential Suite (Grand Piano & Fireplace)' },
  { id: '013', url: '/room-types/013.jpg', title: 'Double Suite Attic Floor (Skyline View)' },
  { id: '05', url: '/room-types/05.jpg', title: 'Luxury Art Living Suite' },
  { id: '02', url: '/room-types/02.jpg', title: 'Family Double Room Suite' },
  { id: '032', url: '/room-types/032.jpg', title: 'Luxury Double Room Suite' },
  { id: '041', url: '/room-types/041.jpg', title: 'Deluxe Executive Living Suite' },
]

function getRoomTypeImage(item) {
  if (item?.imageUrl) return item.imageUrl

  const name = (item?.name || '').toLowerCase()
  if (name.includes('tổng thống') || name.includes('vip') || name.includes('president')) {
    return '/room-types/06.jpg' // Image 1 with Grand Piano
  }
  if (name.includes('attic') || name.includes('sang trọng') || name.includes('deluxe')) {
    return '/room-types/013.jpg' // Image 2 with slanted skylight glass
  }
  if (name.includes('cao cấp') || name.includes('superior') || name.includes('art')) {
    return '/room-types/05.jpg' // Image 3 with typographic art wall
  }
  if (name.includes('gia đình') || name.includes('family')) {
    return '/room-types/02.jpg'
  }
  if (name.includes('tiêu chuẩn') || name.includes('standard')) {
    return '/room-types/041.jpg'
  }

  // Fallback by ID
  const presets = ['/room-types/06.jpg', '/room-types/013.jpg', '/room-types/05.jpg', '/room-types/02.jpg', '/room-types/032.jpg', '/room-types/041.jpg']
  return presets[(item?.id || 0) % presets.length]
}

function getCategoryInfo(item) {
  const name = (item?.name || '').toLowerCase()
  if (name.includes('tổng thống') || name.includes('vip') || name.includes('president')) {
    return { category: 'VIP Hoàng Gia', categoryKey: 'vip', bed: '1 Giường King Hoàng Gia', area: '120 m²' }
  }
  if (name.includes('gia đình') || name.includes('family') || item?.capacity >= 4) {
    return { category: 'Gia đình', categoryKey: 'family', bed: '1 King + 2 Giường Đơn', area: '85 m²' }
  }
  if (name.includes('sang trọng') || name.includes('deluxe') || name.includes('cao cấp') || name.includes('superior')) {
    return { category: 'Sang trọng', categoryKey: 'luxury', bed: '1 Giường Queen Đôi 1m8', area: '55 m²' }
  }
  return { category: 'Cặp đôi', categoryKey: 'couple', bed: '1 Giường Đôi Tiêu Chuẩn', area: '38 m²' }
}

function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'couple' | 'family' | 'luxury' | 'vip'
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
    imageUrl: '/room-types/06.jpg',
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Notification Toast
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  // Load Room Types from Backend API
  const loadRoomTypes = async () => {
    setLoading(true)
    try {
      const data = await api.getRoomTypes()
      setRoomTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Lỗi khi tải danh sách thể loại phòng:', error)
      showToast(error.message || 'Không thể kết nối Backend để tải dữ liệu.', 'error')
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

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter((rt) => {
        const { categoryKey } = getCategoryInfo(rt)
        return categoryKey === categoryFilter
      })
    }

    // Search filter
    if (search.trim()) {
      const keyword = search.trim().toLowerCase()
      result = result.filter(
        (rt) =>
          rt.name?.toLowerCase().includes(keyword) ||
          rt.description?.toLowerCase().includes(keyword)
      )
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
  }, [roomTypes, categoryFilter, search, sortBy])

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
      imageUrl: '/room-types/06.jpg',
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
      imageUrl: item.imageUrl || getRoomTypeImage(item),
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
    <div className="encore-room-types-page">
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      {/* ===== LUXURY ENCORE HERO BANNER ===== */}
      <div className="encore-hero-banner">
        <div
          className="encore-hero-bg"
          style={{ backgroundImage: `url('/room-types/06.jpg')` }}
        ></div>
        <div className="encore-hero-overlay"></div>

        <div className="encore-hero-content">
          <div>
            <div className="encore-tagline">✨ ENCORE LUXURY RESORT &amp; HOTEL</div>
            <h1 className="encore-hero-title">LOẠI PHÒNG &amp; SUITES</h1>
            <p className="encore-hero-desc">
              Trải nghiệm không gian nghỉ dưỡng đỉnh cao với nội thất hoàng gia, tiện nghi 5 sao,
              ban công hướng biển và dịch vụ quản gia phục vụ 24/7.
            </p>
          </div>

          <div className="encore-hero-actions">
            <button
              type="button"
              className="btn-encore-primary"
              onClick={handleOpenCreate}
            >
              ➕ Thêm loại phòng mới
            </button>
            <button
              type="button"
              className="btn-encore-outline"
              onClick={loadRoomTypes}
              title="Làm mới dữ liệu từ máy chủ"
            >
              🔄 Làm mới dữ liệu
            </button>
          </div>
        </div>
      </div>

      {/* ===== OVERVIEW STATS ===== */}
      <div className="encore-stats-grid">
        <div className="encore-stat-card">
          <div className="encore-stat-icon-wrap gold">👑</div>
          <div className="encore-stat-text">
            <span>Tổng loại phòng</span>
            <strong>{stats.totalTypes} Hạng phòng</strong>
          </div>
        </div>

        <div className="encore-stat-card">
          <div className="encore-stat-icon-wrap blue">💰</div>
          <div className="encore-stat-text">
            <span>Đơn giá bình quân</span>
            <strong style={{ color: '#0284c7' }}>{formatMoney(stats.avgPrice)}</strong>
          </div>
        </div>

        <div className="encore-stat-card">
          <div className="encore-stat-icon-wrap green">🚪</div>
          <div className="encore-stat-text">
            <span>Tổng phòng khách sạn</span>
            <strong>{stats.totalRooms} Phòng</strong>
          </div>
        </div>

        <div className="encore-stat-card">
          <div className="encore-stat-icon-wrap purple">🟢</div>
          <div className="encore-stat-text">
            <span>Phòng sẵn sàng đón khách</span>
            <strong>{stats.availableRooms} / {stats.totalRooms} Trống</strong>
          </div>
        </div>
      </div>

      {/* ===== ENCORE CATEGORY TABS & FILTER BAR ===== */}
      <div className="encore-filter-wrapper">
        <div className="encore-category-tabs">
          <button
            type="button"
            className={`category-tab-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            🏨 Tất cả loại phòng ({roomTypes.length})
          </button>
          <button
            type="button"
            className={`category-tab-btn ${categoryFilter === 'couple' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('couple')}
          >
            💑 Cặp đôi
          </button>
          <button
            type="button"
            className={`category-tab-btn ${categoryFilter === 'family' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('family')}
          >
            👨‍👩‍👧‍👦 Gia đình
          </button>
          <button
            type="button"
            className={`category-tab-btn ${categoryFilter === 'luxury' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('luxury')}
          >
            💎 Sang trọng (Deluxe / Art)
          </button>
          <button
            type="button"
            className={`category-tab-btn ${categoryFilter === 'vip' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('vip')}
          >
            👑 VIP Tổng Thống
          </button>
        </div>

        <div className="encore-controls-row">
          <div className="encore-search-box">
            <span className="search-icon-svg">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên hạng phòng, tiện nghi, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Hiển thị {filteredRoomTypes.length} kết quả
            </span>

            <select
              className="encore-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Thứ tự mặc định</option>
              <option value="price-asc">Thứ tự theo giá: Thấp đến Cao</option>
              <option value="price-desc">Thứ tự theo giá: Cao xuống Thấp</option>
              <option value="capacity-asc">Sức chứa: Ít đến Nhiều</option>
              <option value="capacity-desc">Sức chứa: Nhiều đến Ít</option>
              <option value="name-asc">Tên loại phòng: A - Z</option>
              <option value="name-desc">Tên loại phòng: Z - A</option>
            </select>

            <div className="encore-view-toggles">
              <button
                type="button"
                className={`encore-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Dạng lưới thẻ phong cách Encore"
              >
                ⊞ Lưới
              </button>
              <button
                type="button"
                className={`encore-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Dạng bảng dữ liệu"
              >
                ☰ Bảng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      {loading ? (
        <div className="encore-loading-box">
          <div className="loading-spinner"></div>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Đang tải danh sách phòng nghỉ dưỡng Encore...</p>
        </div>
      ) : filteredRoomTypes.length === 0 ? (
        <div className="encore-empty-box">
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🏛️</div>
          <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#0f172a' }}>
            Không tìm thấy loại phòng nào phù hợp
          </h3>
          <p style={{ color: '#64748b', marginBottom: '18px' }}>
            Thử thay đổi từ khóa tìm kiếm hoặc bấm nút bên dưới để đặt lại bộ lọc.
          </p>
          <button
            type="button"
            className="btn-encore-primary"
            onClick={() => {
              setSearch('')
              setCategoryFilter('all')
            }}
          >
            🔄 Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ===== ENCORE 3-COLUMN CARDS GRID ===== */
        <div className="encore-cards-grid">
          {filteredRoomTypes.map((item) => {
            const imgUrl = getRoomTypeImage(item)
            const meta = getCategoryInfo(item)
            const availablePercent =
              item.totalRooms > 0
                ? Math.round((item.availableRooms / item.totalRooms) * 100)
                : 0

            return (
              <div key={item.id} className="encore-card">
                <div className="encore-card-media">
                  <img
                    src={imgUrl}
                    alt={item.name}
                    className="encore-card-img"
                    loading="lazy"
                  />
                  <div className="encore-card-media-overlay"></div>

                  <span className="encore-cat-badge">{meta.category}</span>

                  <span
                    className={`encore-avail-badge ${
                      item.availableRooms > 0 ? 'available' : 'occupied'
                    }`}
                  >
                    {item.availableRooms > 0
                      ? `🟢 Còn ${item.availableRooms} phòng trống`
                      : '🔴 Hết phòng trống'}
                  </span>

                  <div className="encore-card-price-overlay">
                    <span className="encore-price-num">{formatMoney(item.pricePerNight)}</span>
                    <span className="encore-price-suffix">/ đêm</span>
                  </div>
                </div>

                <div className="encore-card-body">
                  <h3 className="encore-card-title">{item.name}</h3>

                  <div className="encore-specs-row">
                    <span className="encore-spec-item">
                      👥 <strong>{item.capacity} Khách</strong>
                    </span>
                    <span className="encore-spec-item">
                      🛏️ <strong>{meta.bed}</strong>
                    </span>
                    <span className="encore-spec-item">
                      📐 <strong>{meta.area}</strong>
                    </span>
                    <span className="encore-spec-item">
                      🚪 <strong>{item.totalRooms} Phòng</strong>
                    </span>
                  </div>

                  <p className="encore-card-desc">
                    {item.description ||
                      'Không gian phòng lưu trú cao cấp trang bị điều hòa, ban công view thành phố, bồn tắm thư giãn và dịch vụ ẩm thực tại phòng.'}
                  </p>

                  <div className="encore-occupancy-wrap">
                    <div className="encore-occupancy-header">
                      <span>Tình trạng phòng ({item.availableRooms}/{item.totalRooms} trống)</span>
                      <span>{availablePercent}%</span>
                    </div>
                    <div className="encore-occupancy-bar">
                      <div
                        className="occupancy-green"
                        style={{ width: `${availablePercent}%` }}
                      ></div>
                      <div
                        className="occupancy-red"
                        style={{ width: `${100 - availablePercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="encore-card-footer">
                    <button
                      type="button"
                      className="btn-card-view-detail"
                      onClick={() => handleOpenDetail(item.id)}
                    >
                      🔍 Xem danh sách {item.totalRooms} phòng
                    </button>

                    <div className="card-admin-btns">
                      <button
                        type="button"
                        className="btn-icon-action edit"
                        onClick={() => handleOpenEdit(item)}
                        title="Chỉnh sửa thông tin thể loại phòng"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action delete"
                        onClick={() => handleOpenDelete(item)}
                        title="Xóa thể loại phòng"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ===== ENCORE TABLE VIEW ===== */
        <div className="encore-table-card">
          <div className="encore-table-scroll">
            <table className="encore-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Hình ảnh &amp; Thể loại phòng</th>
                  <th>Phân loại</th>
                  <th>Sức chứa</th>
                  <th>Đơn giá / đêm</th>
                  <th>Số lượng phòng</th>
                  <th>Phòng trống</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoomTypes.map((item) => {
                  const imgUrl = getRoomTypeImage(item)
                  const meta = getCategoryInfo(item)
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: '#64748b' }}>#{item.id}</td>
                      <td>
                        <div className="table-room-meta">
                          <img
                            src={imgUrl}
                            alt={item.name}
                            className="table-room-thumb"
                          />
                          <div>
                            <div className="table-room-title">{item.name}</div>
                            <small style={{ color: '#64748b' }}>{meta.bed} • {meta.area}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="encore-cat-badge" style={{ position: 'static' }}>
                          {meta.category}
                        </span>
                      </td>
                      <td>
                        <strong>👥 {item.capacity} người</strong>
                      </td>
                      <td>
                        <span className="table-price-val">{formatMoney(item.pricePerNight)}</span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}> / đêm</span>
                      </td>
                      <td>
                        <strong>{item.totalRooms} phòng</strong>
                      </td>
                      <td>
                        <span
                          className={`encore-avail-badge ${
                            item.availableRooms > 0 ? 'available' : 'occupied'
                          }`}
                          style={{ position: 'static' }}
                        >
                          {item.availableRooms} Trống
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-card-view-detail"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleOpenDetail(item.id)}
                          >
                            🔍 Xem
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action edit"
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action delete"
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

      {/* ===== DETAIL MODAL (ENCORE STYLE) ===== */}
      {detailModal.open && (
        <div
          className="encore-modal-backdrop"
          onClick={() => setDetailModal({ open: false, data: null, loading: false })}
        >
          <div className="encore-modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="encore-modal-header">
              <h3>Chi Tiết Thể Loại Phòng: {detailModal.data?.name || 'Đang tải...'}</h3>
              <button
                type="button"
                className="encore-modal-close"
                onClick={() => setDetailModal({ open: false, data: null, loading: false })}
              >
                ✕
              </button>
            </div>

            <div className="encore-modal-body">
              {detailModal.loading ? (
                <div className="encore-loading-box" style={{ padding: '40px' }}>
                  <div className="loading-spinner"></div>
                  <p>Đang tải danh sách phòng...</p>
                </div>
              ) : detailModal.data ? (
                <>
                  <img
                    src={getRoomTypeImage(detailModal.data)}
                    alt={detailModal.data.name}
                    className="detail-banner-img"
                  />

                  <div className="detail-overview-grid">
                    <div className="detail-item">
                      <span>Đơn giá niêm yết</span>
                      <strong style={{ color: '#0284c7', fontSize: '18px' }}>
                        {formatMoney(detailModal.data.pricePerNight)} / đêm
                      </strong>
                    </div>
                    <div className="detail-item">
                      <span>Sức chứa tối đa</span>
                      <strong>👥 {detailModal.data.capacity} người lớn</strong>
                    </div>
                    <div className="detail-item">
                      <span>Tình trạng phòng</span>
                      <strong>
                        {detailModal.data.availableRooms} trống / {detailModal.data.totalRooms} tổng
                      </strong>
                    </div>
                  </div>

                  <div className="detail-desc-box">
                    <h4>Mô tả tiện nghi &amp; dịch vụ phòng:</h4>
                    <p>{detailModal.data.description || 'Chưa có thông tin mô tả chi tiết.'}</p>
                  </div>

                  <h4 className="rooms-subtable-header">
                    Danh sách phòng cụ thể ({detailModal.data.rooms?.length || 0} phòng):
                  </h4>

                  {(!detailModal.data.rooms || detailModal.data.rooms.length === 0) ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic', margin: '14px 0' }}>
                      Chưa có phòng nào được gán cho thể loại này. Hãy tạo phòng mới trong mục &quot;Thêm phòng&quot;.
                    </p>
                  ) : (
                    <div className="encore-table-scroll">
                      <table className="encore-table">
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

            <div className="encore-modal-footer">
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
        <div
          className="encore-modal-backdrop"
          onClick={() => !formSubmitting && setFormModal({ open: false, isEdit: false, id: null })}
        >
          <div className="encore-modal-card" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmitForm}>
              <div className="encore-modal-header">
                <h3>{formModal.isEdit ? 'Chỉnh Sửa Thể Loại Phòng' : 'Thêm Thể Loại Phòng Mới'}</h3>
                <button
                  type="button"
                  className="encore-modal-close"
                  onClick={() => !formSubmitting && setFormModal({ open: false, isEdit: false, id: null })}
                >
                  ✕
                </button>
              </div>

              <div className="encore-modal-body">
                {formError && <div className="modal-alert-error">⚠️ {formError}</div>}

                <div className="form-group">
                  <label>
                    Tên thể loại phòng <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Double Suite Attic Floor, Family Double Room..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                  <span className="form-hint">Tên định danh hiển thị trên trang web Encore.</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Đơn giá mỗi đêm (VNĐ) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      placeholder="Ví dụ: 1500000"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                      required
                    />
                    <span className="form-hint">
                      {formData.pricePerNight
                        ? `Xem trước: ${formatMoney(formData.pricePerNight)} / đêm`
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
                      max="20"
                      placeholder="Ví dụ: 2"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                    <span className="form-hint">Số khách lưu trú tối đa</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Chọn ảnh đại diện phong cách Encore</label>
                  <div className="image-presets-picker">
                    {ENCORE_IMAGE_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        className={`preset-thumb ${formData.imageUrl === preset.url ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        title={preset.title}
                      >
                        <img src={preset.url} alt={preset.title} />
                      </div>
                    ))}
                  </div>
                  <span className="form-hint">Chọn 1 trong các ảnh khách sạn 5 sao cao cấp ở trên.</span>
                </div>

                <div className="form-group">
                  <label>Mô tả tiện ích &amp; nội thất</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả giường, ban công, bồn tắm nằm, tivi thông minh, máy lạnh, wifi..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="encore-modal-footer">
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
                  className="btn-encore-primary"
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

      {/* ===== DELETE MODAL ===== */}
      {deleteModal.open && deleteModal.item && (
        <div
          className="encore-modal-backdrop"
          onClick={() => !deleteModal.loading && setDeleteModal({ open: false, item: null, loading: false })}
        >
          <div className="encore-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="encore-modal-header">
              <h3>Xác Nhận Xóa Thể Loại Phòng</h3>
              <button
                type="button"
                className="encore-modal-close"
                onClick={() => !deleteModal.loading && setDeleteModal({ open: false, item: null, loading: false })}
              >
                ✕
              </button>
            </div>

            <div className="encore-modal-body">
              <p style={{ margin: '0 0 14px', fontSize: '15px', color: '#1e293b' }}>
                Bạn có chắc chắn muốn xóa thể loại phòng: <strong>{deleteModal.item.name}</strong> không?
              </p>

              {deleteModal.item.totalRooms > 0 ? (
                <div className="modal-alert-error">
                  ⚠️ <strong>Cảnh báo an toàn:</strong> Thể loại phòng này hiện đang có{' '}
                  <strong>{deleteModal.item.totalRooms} phòng</strong> trong hệ thống. Để bảo vệ dữ liệu, hệ thống không cho phép xóa loại phòng đang có phòng liên kết.
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Hành động này sẽ xóa vĩnh viễn thể loại phòng khỏi hệ thống và không thể hoàn tác.
                </p>
              )}
            </div>

            <div className="encore-modal-footer">
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
