const API_BASE = 'http://localhost:5097/api'
export const API_ORIGIN = 'http://localhost:5097'

async function request(path, options = {}) {
  const bodyIsFormData = options.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      ...(bodyIsFormData ? {} : { 'Content-Type': 'application/json' }),
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
  async getRooms() {
    return request('/rooms')
  },

  async getRoom(id) {
    return request(`/rooms/${id}`)
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

  async updateRoom(id, room, image) {
    const formData = new FormData()
    Object.entries(room).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, String(value))
    })
    if (image) formData.append('image', image)
    return request(`/rooms/${id}`, { method: 'PUT', body: formData })
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