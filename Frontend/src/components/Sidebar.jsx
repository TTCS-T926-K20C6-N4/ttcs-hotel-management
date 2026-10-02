import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

function Sidebar() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const isAdmin = role.toLowerCase() === 'admin'
  const isUser = role.toLowerCase() === 'user'

  useEffect(() => {
    api.getCurrentUser()
      .then((data) => setRole(data.user?.role || ''))
      .catch(() => setRole(''))
  }, [])

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

      api.clearAuthToken()
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
          <h2>HOTEL MANAGER</h2>
          <span>Quản lý khách sạn</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {isAdmin && (
          <>
            <div className="menu-title">QUẢN TRỊ</div>
            <NavLink to="/" className="menu-item">
              🏠 <span>Sơ đồ phòng</span>
            </NavLink>
            <NavLink to="/room-map" className="menu-item">
              🗺️ <span>Bản đồ phòng</span>
            </NavLink>
            <NavLink to="/rooms" className="menu-item">
              🛏️ <span>Danh sách phòng</span>
            </NavLink>
            <NavLink to="/rooms/add" className="menu-item">
              ➕ <span>Thêm phòng</span>
            </NavLink>
            <div className="menu-title">NGHIỆP VỤ</div>
            <NavLink to="/room-types" className="menu-item">
              🏷️ <span>Thể loại phòng</span>
            </NavLink>
            <NavLink to="/rent-room" className="menu-item">
              🔑 <span>Cho thuê phòng</span>
            </NavLink>
            <NavLink to="/checkout" className="menu-item">
              ↩️ <span>Trả phòng</span>
            </NavLink>
            <NavLink to="/statistics" className="menu-item">
              📊 <span>Trạng thái phòng</span>
            </NavLink>
            <NavLink to="/income" className="menu-item">
              💰 <span>Thu nhập</span>
            </NavLink>
          </>
        )}

        {isUser && (
          <>
            <div className="menu-title">DỊCH VỤ CỦA BẠN</div>
            <NavLink to="/rooms" className="menu-item">
              🏨 <span>Khám phá phòng</span>
            </NavLink>
            <NavLink to="/rent-room" className="menu-item">
              🔑 <span>Đặt phòng</span>
            </NavLink>
            <NavLink to="/my-bookings" className="menu-item">
              🧳 <span>Phòng bạn đã đặt</span>
            </NavLink>
          </>
        )}

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