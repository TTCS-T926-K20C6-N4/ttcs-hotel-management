const API_BASE = 'http://localhost:5097/api'
const AUTH_TOKEN_KEY = 'hotelAuthToken'
export const API_ORIGIN = new URL(API_BASE).origin

async function request(path, options = {}) {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
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

    throw new Error(message)
  }

  return data
}

export const api = {
  setAuthToken(token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  },

  clearAuthToken() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
  },

  async getCurrentUser() {
    return request('/auth/me')
  },

  async getRooms() {
    return request('/rooms')
  },

  async getRoom(id) {
    return request(`/rooms/${id}`)
  },

  async updateRoom(id, payload) {
    return request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async deleteRoom(id) {
    return request(`/rooms/${id}`, {
      method: 'DELETE',
    })
  },

  async getRoomTypes() {
    return request('/rooms/room-types')
  },

  async createRoom(payload) {
    return request('/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async getAvailableRooms() {
    const rooms = await request('/rooms')

    return Array.isArray(rooms)
      ? rooms.filter(
          (room) =>
            room.status === 'Available' ||
            room.status === 0
        )
      : []
  },

  // Backend hiện chưa có GET /api/customers.
  // Tạm trả [] để màn hình thuê phòng vẫn chạy và cho nhập khách mới.
  async getCustomers() {
    return []
  },

  async getBookings(status = '') {
    const query = status
      ? `?status=${encodeURIComponent(status)}`
      : ''

    return request(`/bookings${query}`)
  },

  async getMyBookings() {
    return request('/bookings/mine')
  },

  async getBooking(id) {
    return request(`/bookings/${id}`)
  },

  async updateBookedRoom(bookingId, payload) {
    return request(`/bookings/${bookingId}/room`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async uploadBookedRoomImage(bookingId, file) {
    const formData = new FormData()
    formData.append('image', file)
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY)
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/room-image`, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.message || 'Không thể tải ảnh phòng lên.')
    }

    return data
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
async uploadRoomImage(file) {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE}/rooms/upload-image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
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
    let message = 'Không thể tải hình ảnh lên.'

    if (data?.message) {
      message = data.message
    } else if (data?.title) {
      message = data.title
    } else if (typeof data === 'string' && data.trim()) {
      message = data
    }

    throw new Error(message)
  }

  return data
},
  async addService(bookingId, payload) {
    return request(`/bookings/${bookingId}/services`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async removeService(serviceId) {
    return request(`/bookings/services/${serviceId}`, {
      method: 'DELETE',
    })
  },

  async checkout(bookingId, payload) {
    return request(`/bookings/${bookingId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async cancelBooking(bookingId) {
    return request(`/bookings/${bookingId}`, {
      method: 'DELETE',
    })
  },
}

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

export function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN').format(date)
}

export function toInputDate(value) {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}