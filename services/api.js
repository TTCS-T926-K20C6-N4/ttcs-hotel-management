const API_BASE = 'http://localhost:5097/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
  // =========================
  // BOOKING
  // =========================

  async getBookings(status = '') {
    const query = status
      ? `?status=${encodeURIComponent(status)}`
      : ''

    return request(`/bookings${query}`)
  },

  async getActiveBookings() {
    return request('/bookings/active')
  },

  async getBooking(id) {
    return request(`/bookings/${id}`)
  },

  async rentRoom(payload) {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
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

  async checkout(bookingId, payload = {}) {
    return request(`/bookings/${bookingId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({
        discount: Number(payload.discount) || 0,
      }),
    })
  },

  async cancelBooking(bookingId) {
    return request(`/bookings/${bookingId}`, {
      method: 'DELETE',
    })
  },

  // =========================
  // ROOM
  // =========================

  async getAvailableRooms() {
    return request('/rooms/available')
  },

  // =========================
  // CUSTOMER
  // =========================

  async getCustomers() {
    return request('/customers')
  },
}

// =========================
// FORMAT MONEY
// =========================

export function formatMoney(value) {
  const number = Number(value) || 0

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(number)
}

// =========================
// FORMAT DATE
// =========================

export function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

// =========================
// DATE FOR INPUT
// =========================

export function toInputDate(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
