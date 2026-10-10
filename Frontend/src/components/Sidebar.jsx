import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

function Sidebar() {
  const navigate = useNavigate()

  // Trạng thái hiển thị hộp xác nhận đăng xuất
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // ==========================================
  // ĐĂNG XUẤT
  // ==========================================
  const handleLogout = async () => {
    try {
      const response = await fetch(
        'http://localhost:5097/api/auth/logout',
        {
          method: 'POST',

          // Gửi cookie Session sang Backend
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Đăng xuất thất bại')
      }

      // Đóng hộp xác nhận
      setShowLogoutConfirm(false)

      // Backend đã HttpContext.Session.Clear()
      // Chuyển về trang đăng nhập
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Lỗi đăng xuất:', error)

      alert('Không thể đăng xuất. Vui lòng thử lại.')
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">H</div>

        <div>
          <h2>QUẢN LÝ KHÁCH SẠN</h2>
        </div>
      </div>

      <nav className="sidebar-menu">

        <div className="menu-title">QUẢN LÝ PHÒNG</div>
        
<NavLink to="/room-map" className="menu-item">
          🏠 <span>Sơ đồ phòng</span>
        </NavLink>

        <NavLink to="/rooms" className="menu-item">
          🛏️ <span>Danh sách phòng</span>
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

        <NavLink to="/room-status" className="menu-item">
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

        {/* ================================
            NÚT ĐĂNG XUẤT
        ================================= */}
        <button
          type="button"
          className="logout-menu"
          onClick={() => setShowLogoutConfirm(true)}
        >
          🚪 <span>Đăng xuất</span>
        </button>

      </nav>

      {/* ================================
          HỘP XÁC NHẬN ĐĂNG XUẤT
      ================================= */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">

            <div className="logout-modal-icon">
              🚪
            </div>

            <h3>Xác nhận đăng xuất</h3>

            <p>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>

            <div className="logout-modal-actions">

              {/* KHÔNG */}
              <button
                type="button"
                className="logout-cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Không
              </button>

              {/* ĐỒNG Ý */}
              <button
                type="button"
                className="logout-confirm-btn"
                onClick={handleLogout}
              >
                Đồng ý
              </button>

            </div>
          </div>
        </div>
      )}

    </aside>
  )
}

export default Sidebar