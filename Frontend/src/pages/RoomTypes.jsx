import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const STORAGE_CUSTOM_IMAGES = 'encore_custom_room_type_images'
const STORAGE_USER_PRESETS = 'encore_user_uploaded_presets'

function getStoredCustomImages() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_IMAGES)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCustomImage(roomTypeId, url) {
  try {
    const cur = getStoredCustomImages()
    cur[roomTypeId] = url
    localStorage.setItem(STORAGE_CUSTOM_IMAGES, JSON.stringify(cur))
  } catch (e) {
    console.warn('Cannot save image to localStorage', e)
  }
}

function getStoredUserPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_PRESETS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUserPreset(url) {
  try {
    const cur = getStoredUserPresets()
    if (!cur.includes(url)) {
      const next = [url, ...cur].slice(0, 10)
      localStorage.setItem(STORAGE_USER_PRESETS, JSON.stringify(next))
      return next
    }
    return cur
  } catch {
    return []
  }
}

function getRoomTypeMeta(item) {
  const name = (item?.name || '').toLowerCase()

  if (name.includes('tổng thống') || name.includes('president') || name.includes('vip')) {
    return {
      category: 'VIP HOÀNG GIA',
      categoryKey: 'vip',
      bed: '1 Giường King Hoàng Gia',
      bedShort: 'Giường King',
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
      bedShort: '1 King + 2 Đơn',
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
      bedShort: 'Giường Queen 1m8',
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
      bedShort: 'Giường Queen 1m8',
      area: '48 m²',
      defaultImage: '/room-types/05.jpg',
      gallery: ['/room-types/05.jpg', '/room-types/032.jpg', '/room-types/03.jpg', '/room-types/031.jpg'],
    }
  }

  return {
    category: 'CẶP ĐÔI',
    categoryKey: 'couple',
    bed: '1 Giường Đôi Tiêu Chuẩn',
    bedShort: 'Giường Đôi',
    area: '38 m²',
    defaultImage: '/room-types/041.jpg',
    gallery: ['/room-types/041.jpg', '/room-types/013.jpg', '/room-types/05.jpg', '/room-types/02.jpg'],
  }
}

function getEffectiveImage(item) {
  const customMap = getStoredCustomImages()
  if (item?.id && customMap[item.id]) {
    return customMap[item.id]
  }
  if (item?.imageUrl) {
    return item.imageUrl
  }
  const meta = getRoomTypeMeta(item)
  return meta.defaultImage
}

function RoomTypes() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'couple' | 'family' | 'luxury' | 'vip'
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sortBy, setSortBy] = useState('default')

  // Modals state
  const [detailModal, setDetailModal] = useState({ open: false, data: null, loading: false })
  const [activeGalleryImg, setActiveGalleryImg] = useState('')
  const [formModal, setFormModal] = useState({ open: false, isEdit: false, id: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, loading: false })

  // Quick Availability Modal (Ảnh 1 feature)
  const [availModal, setAvailModal] = useState({
    open: false,
    item: null,
    rooms: [],
    loading: false,
  })

  // User uploaded presets in Form Modal (Ảnh 2 feature)
  const [userPresets, setUserPresets] = useState(getStoredUserPresets())
  const [customUrlInput, setCustomUrlInput] = useState('')

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

  // Quick stats
  const availableRoomTypesCount = useMemo(() => {
    return roomTypes.filter((rt) => (rt.availableRooms || 0) > 0).length
  }, [roomTypes])

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

    // Only Available Filter
    if (onlyAvailable) {
      result = result.filter((rt) => (rt.availableRooms || 0) > 0)
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
  }, [roomTypes, categoryFilter, onlyAvailable, search, sortBy])

  // Handle View Detail
  const handleOpenDetail = async (item) => {
    const meta = getRoomTypeMeta(item)
    const initialImg = getEffectiveImage(item)
    setActiveGalleryImg(initialImg)
    setDetailModal({ open: true, data: { ...item, meta, effectiveImg: initialImg }, loading: true })

    try {
      const data = await api.getRoomTypeById(item.id)
      setDetailModal({ open: true, data: { ...data, meta, effectiveImg: initialImg }, loading: false })
      if (initialImg) {
        setActiveGalleryImg(initialImg)
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết thể loại phòng:', error)
      showToast(error.message || 'Không thể tải chi tiết thể loại phòng.', 'error')
      setDetailModal((prev) => ({ ...prev, loading: false }))
    }
  }

  // Handle Quick Availability Modal (Ảnh 1 feature)
  const handleOpenAvailabilityModal = async (item) => {
    setAvailModal({ open: true, item, rooms: [], loading: true })
    try {
      const data = await api.getRoomTypeById(item.id)
      setAvailModal({
        open: true,
        item,
        rooms: data?.rooms || [],
        loading: false,
      })
    } catch (error) {
      console.error('Lỗi khi tải danh sách phòng trống:', error)
      showToast('Không thể tải danh sách phòng trống.', 'error')
      setAvailModal((prev) => ({ ...prev, loading: false }))
    }
  }

  // Handle Book Specific Room
  const handleBookRoom = (roomId) => {
    navigate(`/rent-room?roomId=${roomId}`)
  }

  // Handle Open Create / Edit Modal (Ảnh 2 feature)
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      pricePerNight: '',
      capacity: 2,
      description: '',
      imageUrl: '/room-types/013.jpg',
    })
    setCustomUrlInput('')
    setFormError('')
    setFormModal({ open: true, isEdit: false, id: null })
  }

  const handleOpenEdit = (item) => {
    const meta = getRoomTypeMeta(item)
    const curImg = getEffectiveImage(item)
    setFormData({
      name: item.name,
      pricePerNight: item.pricePerNight,
      capacity: item.capacity,
      description: item.description || '',
      imageUrl: curImg,
    })
    setCustomUrlInput('')
    setFormError('')
    setFormModal({ open: true, isEdit: true, id: item.id })
  }

  // Handle Custom File Upload from Computer
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP).', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa 5MB.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }))
      const updatedPresets = saveUserPreset(dataUrl)
      setUserPresets(updatedPresets)
      showToast('Đã tải ảnh lên thành công!')
    }
    reader.readAsDataURL(file)

    // Reset input
    e.target.value = ''
  }

  // Handle Apply Custom Image URL
  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return
    const url = customUrlInput.trim()
    setFormData((prev) => ({ ...prev, imageUrl: url }))
    const updatedPresets = saveUserPreset(url)
    setUserPresets(updatedPresets)
    setCustomUrlInput('')
    showToast('Đã áp dụng đường dẫn ảnh!')
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

      let targetId = formModal.id
      if (formModal.isEdit) {
        await api.updateRoomType(formModal.id, payload)
        showToast('Cập nhật thể loại phòng thành công!')
      } else {
        const created = await api.createRoomType(payload)
        targetId = created?.id
        showToast('Thêm thể loại phòng mới thành công!')
      }

      // Save custom image mapping persistently
      if (formData.imageUrl && targetId) {
        saveCustomImage(targetId, formData.imageUrl)
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

  // Vacant rooms inside availability modal
  const vacantRooms = useMemo(() => {
    return (availModal.rooms || []).filter((r) => r.status === 0)
  }, [availModal.rooms])

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
        <div className="encore-nav-left">
          {/* Category Tabs: Seamless Segmented Control */}
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

          {/* Availability Toggle Button */}
          <button
            type="button"
            className={`btn-filter-avail ${onlyAvailable ? 'active' : ''}`}
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            title="Lọc chỉ các hạng phòng đang còn phòng trống"
          >
            🟢 Còn phòng ({availableRoomTypesCount})
          </button>
        </div>

        {/* Search input: shifted leftwards with clean vector monochrome icon */}
        <div className="encore-search-input-wrap">
          <svg
            className="encore-search-icon-svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm hạng phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ===== 3-COLUMN ENCORE PRODUCT GRID ===== */}
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
              setOnlyAvailable(false)
            }}
          >
            Xem tất cả hạng phòng
          </button>
        </div>
      ) : (
        <div className="encore-products-grid">
          {filteredRoomTypes.map((item) => {
            const meta = getRoomTypeMeta(item)
            const mainImg = getEffectiveImage(item)

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

                  {/* Availability badge with click action (Ảnh 1 feature) */}
                  <div className="encore-image-badges">
                    <button
                      type="button"
                      className={`status-badge-pill interactive ${
                        item.availableRooms > 0 ? 'available' : 'occupied'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenAvailabilityModal(item)
                      }}
                      title={
                        item.availableRooms > 0
                          ? `Bấm để xem ${item.availableRooms} phòng trống và đặt ngay`
                          : 'Bấm để xem tình trạng phòng'
                      }
                    >
                      {item.availableRooms > 0 ? (
                        <>
                          <span className="badge-pulse-dot"></span>
                          Còn {item.availableRooms} phòng trống
                        </>
                      ) : (
                        'Hết phòng'
                      )}
                    </button>
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

                {/* Text Content */}
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

                  {/* Clean Specs Row - No bulky icons, completely fixes text collision */}
                  <div className="encore-product-specs">
                    <span className="spec-val">{item.capacity} khách</span>
                    <span className="spec-sep">•</span>
                    <span className="spec-val">{meta.bedShort || meta.bed}</span>
                    <span className="spec-sep">•</span>
                    <span className="spec-val">{item.totalRooms} phòng</span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="encore-card-actions-row">
                    <button
                      type="button"
                      className="btn-card-detail"
                      onClick={() => handleOpenDetail(item)}
                    >
                      <span>Xem chi tiết</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>

                    <div className="card-quick-actions">
                      <button
                        type="button"
                        className="btn-action-icon edit"
                        onClick={() => handleOpenEdit(item)}
                        title="Chỉnh sửa loại phòng"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon delete"
                        onClick={() => handleOpenDelete(item)}
                        title="Xóa loại phòng"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== MODAL 1: QUICK AVAILABILITY & DIRECT BOOKING MODAL (ẢNH 1 FEATURE) ===== */}
      {availModal.open && availModal.item && (
        <div
          className="encore-modal-overlay"
          onClick={() => setAvailModal({ open: false, item: null, rooms: [], loading: false })}
        >
          <div
            className="avail-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="encore-modal-close-icon"
              onClick={() => setAvailModal({ open: false, item: null, rooms: [], loading: false })}
              aria-label="Đóng"
            >
              ✕
            </button>

            <div className="avail-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  className="status-badge-pill available"
                  style={{ cursor: 'default' }}
                >
                  🟢 {availModal.item.availableRooms} PHÒNG TRỐNG
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Tổng {availModal.item.totalRooms} phòng
                </span>
              </div>
              <h3>{availModal.item.name}</h3>
              <p>
                Đơn giá: <strong style={{ color: '#0f172a' }}>{formatMoney(availModal.item.pricePerNight)}</strong> / đêm • Sức chứa tối đa: <strong style={{ color: '#0f172a' }}>{availModal.item.capacity} khách</strong>
              </p>
            </div>

            {availModal.loading ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#64748b' }}>
                <p>Đang tải danh sách phòng thực tế...</p>
              </div>
            ) : vacantRooms.length > 0 ? (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.04em' }}>
                  Các Phòng Đang Sẵn Sàng Nhận Khách ({vacantRooms.length} phòng):
                </h4>

                {vacantRooms.map((room) => (
                  <div key={room.id} className="avail-room-card">
                    <div className="avail-room-info">
                      <strong>🚪 Phòng {room.roomNumber}</strong>
                      <span>Tầng {room.floor} • {room.note || 'Đầy đủ tiện nghi, sạch sẽ sẵn sàng đón khách'}</span>
                    </div>

                    <button
                      type="button"
                      className="btn-book-room-instant"
                      onClick={() => handleBookRoom(room.id)}
                      title="Chuyển đến trang Thuê Phòng với số phòng này"
                    >
                      ⚡ Thuê ngay
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏨</div>
                <h4 style={{ margin: '0 0 6px', color: '#0f172a' }}>Hiện tại không có phòng nào còn trống</h4>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                  Tất cả các phòng thuộc hạng này đang có khách hoặc đang được dọn dẹp bảo trì.
                </p>
              </div>
            )}

            <div className="encore-modal-footer">
              <button
                type="button"
                className="btn-encore-secondary"
                onClick={() => {
                  const it = availModal.item
                  setAvailModal({ open: false, item: null, rooms: [], loading: false })
                  handleOpenDetail(it)
                }}
              >
                🔍 Xem toàn bộ chi tiết hạng phòng
              </button>
              <button
                type="button"
                className="btn-add-roomtype-encore"
                onClick={() => setAvailModal({ open: false, item: null, rooms: [], loading: false })}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL 2: LUXURY DETAIL MODAL ===== */}
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
                    src={activeGalleryImg || detailModal.data.effectiveImg}
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

              {/* Right Column: Information & Specs (Properly Contained) */}
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

                {/* Specs Box: Icons removed as requested in Image 3 */}
                <div className="detail-specs-box">
                  <div>
                    <span>SỨC CHỨA TỐI ĐA</span>
                    <strong>{detailModal.data.capacity} người lớn</strong>
                  </div>
                  <div>
                    <span>LOẠI GIƯỜNG</span>
                    <strong>{detailModal.data.meta.bed}</strong>
                  </div>
                  <div>
                    <span>DIỆN TÍCH PHÒNG</span>
                    <strong>{detailModal.data.meta.area}</strong>
                  </div>
                  <div>
                    <span>TỔNG SỐ PHÒNG</span>
                    <strong>
                      {detailModal.data.totalRooms} phòng ({detailModal.data.availableRooms} phòng trống)
                    </strong>
                  </div>
                </div>

                {/* Subtable: Rooms in Hotel */}
                <h4 style={{ margin: '14px 0 8px', fontSize: '13.5px', textTransform: 'uppercase', color: '#1c1c1c', letterSpacing: '0.04em' }}>
                  Danh Sách Phòng Khách Sạn:
                </h4>

                {detailModal.loading ? (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Đang tải danh sách phòng...</p>
                ) : !detailModal.data.rooms || detailModal.data.rooms.length === 0 ? (
                  <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '13px', margin: '4px 0 16px' }}>
                    Chưa có phòng nào được gán cho thể loại này trong hệ thống.
                  </p>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '16px' }}>
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
                              {/* Status text: No background colors, clean neutral typography as requested in Image 4 */}
                              <span className="room-status-text">
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

                <div className="encore-modal-footer">
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

      {/* ===== MODAL 3: CREATE / EDIT MODAL WITH IMAGE UPLOAD (ẢNH 2 FEATURE) ===== */}
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

              {/* ===== IMAGE UPLOAD & SELECTION SECTION (ẢNH 2 FEATURE) ===== */}
              <div className="form-group-encore">
                <label>Hình ảnh đại diện phòng</label>

                {/* Live Preview Box */}
                {formData.imageUrl && (
                  <div className="img-live-preview-box">
                    <img src={formData.imageUrl} alt="Xem trước ảnh phòng" />
                    <span className="preview-badge">Ảnh đang chọn</span>
                  </div>
                )}

                {/* Upload Action Toolbar */}
                <div className="img-upload-toolbar">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  {/* Button to upload from computer */}
                  <button
                    type="button"
                    className="btn-upload-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Tải ảnh từ máy tính lên
                  </button>

                  {/* Input for image URL */}
                  <div className="img-url-input-group">
                    <input
                      type="url"
                      placeholder="Hoặc dán URL ảnh trực tuyến..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-apply-url"
                      onClick={handleApplyCustomUrl}
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                {/* Preset and uploaded photos */}
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
                  Hoặc chọn từ thư viện ảnh Encore / Ảnh đã tải lên:
                </label>

                <div className="preset-thumbs-grid">
                  {/* Tile to click and upload */}
                  <div
                    className="preset-add-tile"
                    onClick={() => fileInputRef.current?.click()}
                    title="Nhấp để tải ảnh từ máy tính"
                  >
                    <span>+</span>
                    <small>Tải ảnh</small>
                  </div>

                  {/* User uploaded presets */}
                  {userPresets.map((url, idx) => (
                    <div
                      key={`user-${idx}`}
                      className={`preset-thumb-item ${formData.imageUrl === url ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, imageUrl: url })}
                      title="Ảnh bạn đã tải lên"
                    >
                      <img src={url} alt={`Ảnh tải lên ${idx + 1}`} />
                    </div>
                  ))}

                  {/* Built-in Encore luxury presets */}
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
                  Bạn có thể bấm &quot;📁 Tải ảnh từ máy tính lên&quot;, dán đường dẫn ảnh hoặc chọn ảnh mẫu có sẵn ở trên.
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
