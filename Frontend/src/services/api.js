const API_BASE = 'http://localhost:5097/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  // Tự động gửi JWT cho các API có [Authorize]
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  let data = null
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    const text = await response.text()
    data = text || null
  }

  if (!response.ok) {
    let message = 'Có lỗi xảy ra.'

    if (data?.message) {
      message = data.message
    } else if (data?.title) {
      message = data.title
    } else if (typeof data === 'string' && data.trim()) {
      message = data
    }

    if (response.status === 401) {
      message = 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
    }

    throw new Error(message)
  }

  return data
}

export const api = {
  // ==========================================
  // THỂ LOẠI PHÒNG
  // ==========================================

  async getRoomTypes(search = '') {
    const query = search
      ? `?search=${encodeURIComponent(search)}`
      : ''

    return request(`/rooms/room-types${query}`)
  },

  async getRoomTypeById(id) {
    return request(`/rooms/room-types/${id}`)
  },

  async createRoomType(payload) {
    return request('/rooms/room-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateRoomType(id, payload) {
    return request(`/rooms/room-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        id,
      }),
    })
  },

  async deleteRoomType(id) {
    return request(`/rooms/room-types/${id}`, {
      method: 'DELETE',
    })
  },

  // ==========================================
  // PHÒNG
  // ==========================================

  async createRoom(payload) {
    return request('/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getRoomById(id) {
    return request(`/rooms/${id}`)
  },

  async updateRoom(id, payload) {
    return request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  // ==========================================
  // PHÒNG TRỐNG
  // ==========================================

  async getAvailableRooms() {
    const rooms = await request('/rooms')

    if (!Array.isArray(rooms)) {
      return []
    }

    return rooms
      .filter(
        (room) =>
          room.status === 'Available' ||
          Number(room.status) === 0
      )
      .map((room) => ({
        ...room,

        roomTypeName:
          room.roomType?.name || 'Chưa phân loại',

        pricePerNight:
          Number(room.roomType?.pricePerNight) || 0,

        capacity:
          Number(room.roomType?.capacity) || 0,
      }))
  },

  // ==========================================
  // KHÁCH HÀNG
  // ==========================================

  // Backend hiện chưa có GET /api/customers
  async getCustomers() {
    return []
  },

  // ==========================================
  // BOOKING / CHO THUÊ PHÒNG
  // ==========================================

  async getBookings(status = '') {
    const query = status
      ? `?status=${encodeURIComponent(status)}`
      : ''

    return request(`/bookings${query}`)
  },

  async getActiveBookings() {
    return request('/bookings/active')
  },

  async rentRoom(payload) {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  // ==========================================
  // UPLOAD ẢNH PHÒNG
  // ==========================================

  async uploadRoomImage(file) {
    const formData = new FormData()
    formData.append('image', file)

    const token = localStorage.getItem('token')

    const headers = {}

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(
      `${API_BASE}/rooms/upload-image`,
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      }
    )

    let data = null
    const contentType =
      response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      data = text || null
    }

    if (!response.ok) {
      let message = 'Không thể tải hình ảnh lên.'

      if (data?.message) {
        message = data.message
      } else if (data?.title) {
        message = data.title
      } else if (
        typeof data === 'string' &&
        data.trim()
      ) {
        message = data
      }

      throw new Error(message)
    }

    return data
  },

  // ==========================================
  // DỊCH VỤ PHÒNG
  // ==========================================

  async addService(bookingId, payload) {
    return request(
      `/bookings/${bookingId}/services`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  async removeService(serviceId) {
    return request(
      `/bookings/services/${serviceId}`,
      {
        method: 'DELETE',
      }
    )
  },

  // ==========================================
  // TRẢ PHÒNG
  // ==========================================

  async checkout(bookingId, payload) {
    return request(
      `/bookings/${bookingId}/checkout`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
  },

  // ==========================================
  // HỦY BOOKING
  // ==========================================

  async cancelBooking(bookingId) {
    return request(`/bookings/${bookingId}`, {
      method: 'DELETE',
    })
  },

  // ==========================================
  // ĐỔI MẬT KHẨU
  // ==========================================

  async changePassword(payload) {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getCurrentUser() {
    const current = await request('/auth/me')
    return current.user || current
  },

  async updateProfile(payload) {
    return request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async uploadProfileImage(file) {
    const formData = new FormData()
    formData.append('avatar', file)

    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await fetch(
      `${API_BASE}/auth/profile/avatar`,
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      }
    )

    let data = null
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      const message = data?.message || data?.title || data || 'Không thể tải ảnh đại diện.'
      throw new Error(message)
    }
    return data
  },
}

// ==========================================
// FORMAT TIỀN
// ==========================================

export function formatMoney(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '0 ₫'
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

// ==========================================
// FORMAT NGÀY
// ==========================================

export function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN').format(date)
}

// ==========================================
// FORMAT DATE CHO INPUT
// ==========================================

export function toInputDate(value) {
  if (!value) return ''

  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}