import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">H</div>

        <div>
          <h2>HOTEL MANAGER</h2>
          <span>Quản lý khách sạn</span>
        </div>
      </div>

      <nav className="sidebar-menu">

        <div className="menu-title">QUẢN LÝ PHÒNG</div>

        <NavLink to="/" className="menu-item">
          🏠 <span>Sơ đồ phòng</span>
        </NavLink>

        <NavLink to="/rooms" className="menu-item">
          🛏️ <span>Danh sách phòng</span>
        </NavLink>

        <NavLink to="/rooms/add" className="menu-item">
          ➕ <span>Thêm phòng</span>
        </NavLink>

        <div className="menu-title">DANH MỤC</div>

        <NavLink to="/room-types" className="menu-item">
          🏷️ <span>Thể loại phòng</span>
        </NavLink>

        <div className="menu-title">THUÊ PHÒNG</div>

        <NavLink to="/rent-room" className="menu-item">
          🔑 <span>Cho thuê phòng</span>
        </NavLink>

        <NavLink to="/checkout" className="menu-item">
          ↩️ <span>Trả phòng</span>
        </NavLink>

        <div className="menu-title">THỐNG KÊ</div>

        <NavLink to="/statistics" className="menu-item">
          📊 <span>Trạng thái phòng</span>
        </NavLink>

        <NavLink to="/income" className="menu-item">
          💰 <span>Thu nhập</span>
        </NavLink>

        <div className="menu-title">TÀI KHOẢN</div>

        <NavLink to="/profile" className="menu-item">
          👤 <span>Thông tin cá nhân</span>
        </NavLink>

        <NavLink to="/change-password" className="menu-item">
          🔒 <span>Đổi mật khẩu</span>
        </NavLink>

        <button className="logout-menu">
          🚪 <span>Đăng xuất</span>
        </button>

      </nav>
    </aside>
  )
}

export default Sidebar