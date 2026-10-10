import { useLocation } from 'react-router-dom'

const pageDetails = [
  { path: '/', title: 'Tổng quan', icon: '▦' },
  { path: '/room-map', title: 'Sơ đồ phòng', icon: '⌖' },
  { path: '/rooms/add', title: 'Thêm phòng', icon: '＋' },
  { path: '/rooms', title: 'Danh sách phòng', icon: '▤' },
  { path: '/room-types', title: 'Thể loại phòng', icon: '◇' },
  { path: '/rent-room', title: 'Cho thuê phòng', icon: '⌂' },
  { path: '/checkout', title: 'Trả phòng', icon: '↗' },
  { path: '/room-status', title: 'Trạng thái phòng', icon: '◷' },
  { path: '/income', title: 'Thu nhập', icon: '₫' },
  { path: '/profile', title: 'Thông tin cá nhân', icon: '○' },
  { path: '/change-password', title: 'Đổi mật khẩu', icon: '⌑' },
]

function Header() {
  const { pathname } = useLocation()
  const page = pageDetails.find(
    (item) =>
      item.path === pathname ||
      (item.path !== '/' && pathname.startsWith(`${item.path}/`))
  ) || pageDetails[0]

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <div className="topbar-page-icon" aria-hidden="true">
          {page.icon}
        </div>
        <div>
          <span className="topbar-context">The Grand Hotel</span>
          <h3>{page.title}</h3>
        </div>
      </div>

      <div className="user-box">
        <div className="user-box-info">
          <strong>Admin</strong>
          <span>Quản trị viên</span>
        </div>
        <div className="avatar">A</div>
      </div>
    </header>
  )
}

export default Header