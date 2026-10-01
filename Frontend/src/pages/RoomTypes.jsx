import { useEffect, useMemo, useState } from 'react'
import { api, formatMoney } from '../services/api'
import Toast from '../components/Toast'
import './RoomTypes.css'

// High-resolution Encore image library
const ENCORE_IMAGE_PRESETS = [
  { id: '013', url: '/room-types/013.jpg', title: 'Double Suite Attic Floor (Skyline View)' },
  { id: '06', url: '/room-types/06.jpg', title: 'Presidential Suite (Grand Piano & Fireplace)' },
  { id: '05', url: '/room-types/05.jpg', title: 'Luxury Art Living Suite' },
  { id: '02', url: '/room-types/02.jpg', title: 'Family Double Room Suite' },
  { id: '032', url: '/room-types/032.jpg', title: 'Luxury Double Room Suite' },
  { id: '041', url: '/room-types/041.jpg', title: 'Deluxe Executive Living Suite' },
]

function getRoomTypeMeta(item) {
  const name = (item?.name || '').toLowerCase()

  if (name.includes('tổng thống') || name.includes('president') || name.includes('vip')) {
    return {
      category: 'VIP HOÀNG GIA',
      categoryKey: 'vip',
      bed: '1 Giường King Hoàng Gia',
      area: '120 m²',
      defaultImage: '/room-types/06.jpg',
      gallery: ['/room-types/06.jpg', '/room-types/032.jpg', '/room-types/05.jpg', '/room-types/013.jpg'],
    }
  }

  if (name.includes('gia đình') || name.includes('family') || item?.capacity >= 4) {
    return {
      category: 'GIA ĐÌNH',
      categoryKey: 'family',
      bed: '1 King + 2 Giường Đơn',
      area: '85 m²',
      defaultImage: '/room-types/02.jpg',
      gallery: ['/room-types/02.jpg', '/room-types/06.jpg', '/room-types/05.jpg', '/room-types/033.jpg'],
    }
  }

  if (name.includes('attic') || name.includes('sang trọng') || name.includes('deluxe')) {
    return {
      category: 'SANG TRỌNG',
      categoryKey: 'luxury',
      bed: '1 Giường Queen Đôi 1m8',
      area: '55 m²',
      defaultImage: '/room-types/013.jpg',
      gallery: ['/room-types/013.jpg', '/room-types/032.jpg', '/room-types/03.jpg', '/room-types/031.jpg'],
    }
  }

  if (name.includes('cao cấp') || name.includes('superior') || name.includes('art')) {
    return {
      category: 'SANG TRỌNG',
      categoryKey: 'luxury',
      bed: '1 Giường Queen 1m8',
      area: '48 m²',
      defaultImage: '/room-types/05.jpg',
      gallery: ['/room-types/05.jpg', '/room-types/032.jpg', '/room-types/03.jpg', '/room-types/031.jpg'],
    }
  }

  return {
    category: 'CẶP ĐÔI',
    categoryKey: 'couple',
    bed: '1 Giường Đôi Tiêu Chuẩn',
    area: '38 m²',
    defaultImage: '/room-types/041.jpg',
    gallery: ['/room-types/041.jpg', '/room-types/013.jpg', '/room-types/05.jpg', '/room-types/02.jpg'],
  }
}

function RoomTypes() {
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'couple' | 'family' | 'luxury' | 'vip'
  const [sortBy, setSortBy] = useState('default')

  // Modals state
  const [detailModal, setDetailModal] = useState({ open: false, data: null, loading: false })
  const [activeGalleryImg, setActiveGalleryImg] = useState('')
  const [formModal, setFormModal] = useState({ open: false, isEdit: false, id: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, loading: false })

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    pricePerNight: '',
    capacity: 2,
    description: '',
    imageUrl: '/room-types/013.jpg',
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

  // Filtered & Sorted List
  const filteredRoomTypes = useMemo(() => {
    let result = [...roomTypes]

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter((rt) => {
        const { categoryKey } = getRoomTypeMeta(rt)
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
  const handleOpenDetail = async (item) => {
    const meta = getRoomTypeMeta(item)
    const initialImg = item.imageUrl || meta.defaultImage
    setActiveGalleryImg(initialImg)
    setDetailModal({ open: true, data: { ...item, meta }, loading: true })

    try {
      const data = await api.getRoomTypeById(item.id)
      setDetailModal({ open: true, data: { ...data, meta }, loading: false })
      if (data?.imageUrl) {
        setActiveGalleryImg(data.imageUrl)
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết thể loại phòng:', error)
      showToast(error.message || 'Không thể tải chi tiết thể loại phòng.', 'error')
      setDetailModal((prev) => ({ ...prev, loading: false }))
    }
  }

  // Handle Open Create / Edit Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      pricePerNight: '',
      capacity: 2,
      description: '',
      imageUrl: '/room-types/013.jpg',
    })
    setFormError('')
    setFormModal({ open: true, isEdit: false, id: null })
  }

  const handleOpenEdit = (item) => {
    const meta = getRoomTypeMeta(item)
    setFormData({
      name: item.name,
      pricePerNight: item.pricePerNight,
      capacity: item.capacity,
      description: item.description || '',
      imageUrl: item.imageUrl || meta.defaultImage,
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
    <div className="encore-page">
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      {/* ===== ENCORE PAGE TITLE BANNER ===== */}
      <div
        className="encore-page-title-banner"
        style={{ backgroundImage: `url('/room-types/06.jpg')` }}
      >
        <div className="encore-title-inner">
          <div className="encore-title-center">
            <h1>LOẠI PHÒNG &amp; SUITES</h1>
            <div className="encore-breadcrumbs">
              <span>TRANG CHỦ</span>
              <span className="divider">/</span>
              <strong>LOẠI PHÒNG ENCORE</strong>
            </div>
          </div>

          <div className="encore-title-right">
            <p className="encore-result-count">
              Hiển thị {filteredRoomTypes.length} trên {roomTypes.length} kết quả
            </p>

            <select
              className="encore-orderby-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Thứ tự mặc định</option>
              <option value="price-asc">Thứ tự theo giá: thấp đến cao</option>
              <option value="price-desc">Thứ tự theo giá: cao xuống thấp</option>
              <option value="name-asc">Tên loại phòng: A - Z</option>
              <option value="name-desc">Tên loại phòng: Z - A</option>
              <option value="capacity-desc">Sức chứa: nhiều đến ít</option>
            </select>

            <button
              type="button"
              className="btn-add-roomtype-encore"
              onClick={handleOpenCreate}
            >
              ➕ Thêm loại phòng
            </button>
          </div>
        </div>
      </div>

      {/* ===== FILTER TABS & SEARCH BAR ===== */}
      <div className="encore-nav-bar">
        <div className="encore-category-nav">
          <button
            type="button"
            className={`encore-cat-item ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            TẤT CẢ ({roomTypes.length})
          </button>
          <button
            type="button"
            className={`encore-cat-item ${categoryFilter === 'couple' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('couple')}
          >
            CẶP ĐÔI
          </button>
          <button
            type="button"
            className={`encore-cat-item ${categoryFilter === 'family' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('family')}
          >
            GIA ĐÌNH
          </button>
          <button
            type="button"
            className={`encore-cat-item ${categoryFilter === 'luxury' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('luxury')}
          >
            SANG TRỌNG
          </button>
          <button
            type="button"
            className={`encore-cat-item ${categoryFilter === 'vip' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('vip')}
          >
            VIP HOÀNG GIA
          </button>
        </div>

        <div className="encore-search-input-wrap">
          <span className="encore-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm hạng phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ===== 3-COLUMN ENCORE PRODUCT GRID (EXACTLY LIKE SCREENSHOT) ===== */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <p>Đang tải danh sách thể loại phòng Encore...</p>
        </div>
      ) : filteredRoomTypes.length === 0 ? (
        <div className="encore-empty-results">
          <h3>Không tìm thấy loại phòng nào</h3>
          <p>Hãy thử từ khóa khác hoặc bấm nút bên dưới để xem tất cả.</p>
          <button
            type="button"
            className="btn-add-roomtype-encore"
            style={{ marginTop: '12px' }}
            onClick={() => {
              setSearch('')
              setCategoryFilter('all')
            }}
          >
            Xem tất cả hạng phòng
          </button>
        </div>
      ) : (
        <div className="encore-products-grid">
          {filteredRoomTypes.map((item) => {
            const meta = getRoomTypeMeta(item)
            const mainImg = item.imageUrl || meta.defaultImage

            return (
              <div key={item.id} className="encore-product-item">
                {/* Photo box with 900x543 ratio */}
                <div
                  className="encore-box-image"
                  onClick={() => handleOpenDetail(item)}
                >
                  <img
                    src={mainImg}
                    alt={item.name}
                    loading="lazy"
                  />

                  {/* Availability badge */}
                  <div className="encore-image-badges">
                    <span
                      className={`status-badge-pill ${
                        item.availableRooms > 0 ? 'available' : 'occupied'
                      }`}
                    >
                      {item.availableRooms > 0
                        ? `Còn ${item.availableRooms} phòng trống`
                        : 'Hết phòng'}
                    </span>
                  </div>

                  {/* Hover Quick Action */}
                  <div className="encore-image-hover-actions">
                    <button
                      type="button"
                      className="btn-hover-quick view"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDetail(item)
                      }}
                    >
                      XEM CHI TIẾT
                    </button>
                  </div>
                </div>

                {/* Text Content (Matching screenshot typography & spacing) */}
                <div className="encore-box-text">
                  <div className="encore-product-category">{meta.category}</div>
                  <h3
                    className="encore-product-name"
                    onClick={() => handleOpenDetail(item)}
                  >
                    {item.name}
                  </h3>
                  <div className="encore-product-price">
                    {formatMoney(item.pricePerNight)}
                  </div>

                  {/* Specs row */}
                  <div className="encore-product-meta-row">
                    <div className="encore-meta-spec">
                      👥 <strong>{item.capacity} khách</strong>
                    </div>
                    <div className="encore-meta-spec">
                      🛏️ <strong>{meta.bed}</strong>
                    </div>
                    <div className="encore-meta-spec">
                      🚪 <strong>{item.totalRooms} phòng</strong>
                    </div>
                  </div>

                  {/* Admin text actions */}
                  <div className="encore-card-admin-row">
                    <button
                      type="button"
                      className="btn-encore-text-action"
                      onClick={() => handleOpenDetail(item)}
                    >
                      🔍 Xem chi tiết
                    </button>
                    <div>
                      <button
                        type="button"
                        className="btn-encore-text-action"
                        onClick={() => handleOpenEdit(item)}
                        title="Chỉnh sửa loại phòng"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        className="btn-encore-text-action delete"
                        onClick={() => handleOpenDelete(item)}
                        title="Xóa loại phòng"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== LUXURY DETAIL MODAL (MATCHING LUXURY DOUBLE ROOM SUITE ENCORE) ===== */}
      {detailModal.open && detailModal.data && (
        <div
          className="encore-modal-overlay"
          onClick={() => setDetailModal({ open: false, data: null, loading: false })}
        >
          <div
            className="encore-detail-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="encore-modal-close-icon"
              onClick={() => setDetailModal({ open: false, data: null, loading: false })}
              aria-label="Đóng"
            >
              ✕
            </button>

            <div className="encore-detail-inner">
              {/* Left Column: Gallery */}
              <div>
                <div className="detail-gallery-main">
                  <img
                    src={activeGalleryImg || detailModal.data.imageUrl || detailModal.data.meta.defaultImage}
                    alt={detailModal.data.name}
                  />
                </div>

                <div className="detail-gallery-thumbs">
                  {detailModal.data.meta.gallery.map((thumbUrl, idx) => (
                    <div
                      key={idx}
                      className={`gallery-thumb-item ${activeGalleryImg === thumbUrl ? 'active' : ''}`}
                      onClick={() => setActiveGalleryImg(thumbUrl)}
                    >
                      <img src={thumbUrl} alt={`Thumbnail ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Information & Specs */}
              <div className="detail-info-col">
                <span className="detail-cat-tag">
                  {detailModal.data.meta.category}
                </span>

                <h2 className="detail-title">{detailModal.data.name}</h2>

                <div className="detail-price-text">
                  {formatMoney(detailModal.data.pricePerNight)}
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                    {' '}
                    / đêm
                  </span>
                </div>

                <div className="detail-divider"></div>

                <p className="detail-short-desc">
                  {detailModal.data.description ||
                    'Không gian nghỉ dưỡng sang trọng với tầm nhìn khoáng đạt, thiết kế hoàng gia và trang thiết bị hiện đại bậc nhất. Dịch vụ ẩm thực phòng và chăm sóc khách hàng 24/7.'}
                </p>

                <div className="detail-specs-box">
                  <div>
                    <span>SỨC CHỨA TỐI ĐA</span>
                    <strong>👥 {detailModal.data.capacity} người lớn</strong>
                  </div>
                  <div>
                    <span>LOẠI GIƯỜNG</span>
                    <strong>🛏️ {detailModal.data.meta.bed}</strong>
                  </div>
                  <div>
                    <span>DIỆN TÍCH PHÒNG</span>
                    <strong>📐 {detailModal.data.meta.area}</strong>
                  </div>
                  <div>
                    <span>TỔNG SỐ PHÒNG</span>
                    <strong>
                      🚪 {detailModal.data.totalRooms} phòng (
                      {detailModal.data.availableRooms} phòng trống)
                    </strong>
                  </div>
                </div>

                {/* Subtable: Rooms in Hotel */}
                <h4 style={{ margin: '14px 0 8px', fontSize: '14px', textTransform: 'uppercase', color: '#1c1c1c' }}>
                  Danh Sách Phòng Khách Sạn:
                </h4>

                {detailModal.loading ? (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Đang tải danh sách phòng...</p>
                ) : !detailModal.data.rooms || detailModal.data.rooms.length === 0 ? (
                  <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                    Chưa có phòng nào được gán cho thể loại này trong hệ thống.
                  </p>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <table className="detail-rooms-table">
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
                              <strong>Phòng {room.roomNumber}</strong>
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
                            <td style={{ color: '#64748b' }}>{room.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="encore-modal-footer" style={{ marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn-encore-secondary"
                    onClick={() => {
                      const item = detailModal.data
                      setDetailModal({ open: false, data: null, loading: false })
                      handleOpenEdit(item)
                    }}
                  >
                    ✏️ Sửa loại phòng này
                  </button>
                  <button
                    type="button"
                    className="btn-add-roomtype-encore"
                    onClick={() => setDetailModal({ open: false, data: null, loading: false })}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE / EDIT MODAL ===== */}
      {formModal.open && (
        <div
          className="encore-modal-overlay"
          onClick={() => !formSubmitting && setFormModal({ open: false, isEdit: false, id: null })}
        >
          <div
            className="encore-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{formModal.isEdit ? 'Chỉnh Sửa Thể Loại Phòng' : 'Thêm Thể Loại Phòng Mới'}</h3>

            {formError && <div className="modal-alert-encore">⚠️ {formError}</div>}

            <form onSubmit={handleSubmitForm}>
              <div className="form-group-encore">
                <label>
                  Tên thể loại phòng <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Double Suite Attic Floor, Family Double Room Suite..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row-encore">
                <div className="form-group-encore">
                  <label>
                    Đơn giá mỗi đêm (VNĐ) <span style={{ color: '#dc2626' }}>*</span>
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
                  <span className="form-hint-encore">
                    {formData.pricePerNight
                      ? `Xem trước: ${formatMoney(formData.pricePerNight)}`
                      : 'Nhập số tiền VNĐ'}
                  </span>
                </div>

                <div className="form-group-encore">
                  <label>
                    Sức chứa tối đa (Khách) <span style={{ color: '#dc2626' }}>*</span>
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
                </div>
              </div>

              <div className="form-group-encore">
                <label>Chọn ảnh đại diện phong cách Encore</label>
                <div className="preset-thumbs-grid">
                  {ENCORE_IMAGE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className={`preset-thumb-item ${formData.imageUrl === preset.url ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                      title={preset.title}
                    >
                      <img src={preset.url} alt={preset.title} />
                    </div>
                  ))}
                </div>
                <span className="form-hint-encore">
                  Nhấp chọn 1 trong 6 hình ảnh phòng nghỉ dưỡng cao cấp Encore ở trên.
                </span>
              </div>

              <div className="form-group-encore">
                <label>Mô tả tiện ích &amp; nội thất</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả nội thất, tầm nhìn, bồn tắm thư giãn, trang thiết bị..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="encore-modal-footer">
                <button
                  type="button"
                  className="btn-encore-secondary"
                  onClick={() => setFormModal({ open: false, isEdit: false, id: null })}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-add-roomtype-encore"
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

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {deleteModal.open && deleteModal.item && (
        <div
          className="encore-modal-overlay"
          onClick={() => !deleteModal.loading && setDeleteModal({ open: false, item: null, loading: false })}
        >
          <div
            className="encore-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Xác Nhận Xóa Thể Loại Phòng</h3>

            <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#1c1c1c' }}>
              Bạn có chắc chắn muốn xóa thể loại phòng: <strong>{deleteModal.item.name}</strong> không?
            </p>

            {deleteModal.item.totalRooms > 0 ? (
              <div className="modal-alert-encore warning">
                ⚠️ <strong>Không thể xóa:</strong> Thể loại phòng này đang có{' '}
                <strong>{deleteModal.item.totalRooms} phòng</strong> trong khách sạn. Hãy chuyển các
                phòng này sang loại phòng khác trước khi xóa.
              </div>
            ) : (
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                Hành động này sẽ xóa vĩnh viễn thể loại phòng khỏi hệ thống và không thể hoàn tác.
              </p>
            )}

            <div className="encore-modal-footer">
              <button
                type="button"
                className="btn-encore-secondary"
                onClick={() => setDeleteModal({ open: false, item: null, loading: false })}
                disabled={deleteModal.loading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-encore-danger"
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
