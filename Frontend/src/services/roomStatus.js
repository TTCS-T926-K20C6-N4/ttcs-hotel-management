export const ROOM_STATUS = Object.freeze({
  Available: 0,
  Occupied: 1,
  Maintenance: 2,
  Reserved: 3,
})

export const ROOM_STATUS_INFO = Object.freeze({
  [ROOM_STATUS.Available]: {
    label: 'Phòng trống',
    className: 'available',
    icon: '✓',
  },
  [ROOM_STATUS.Occupied]: {
    label: 'Đang có khách',
    className: 'occupied',
    icon: '●',
  },
  [ROOM_STATUS.Maintenance]: {
    label: 'Bảo trì',
    className: 'maintenance',
    icon: '⚙',
  },
  [ROOM_STATUS.Reserved]: {
    label: 'Đã đặt trước',
    className: 'reserved',
    icon: '◷',
  },
})

export function getRoomStatusInfo(status) {
  return ROOM_STATUS_INFO[Number(status)] ?? {
    label: 'Không xác định',
    className: 'other',
    icon: '?',
  }
}
