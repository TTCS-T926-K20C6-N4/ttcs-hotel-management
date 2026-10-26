
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Grid2X2,
  BedDouble,
  Tags,
  ChartNoAxesColumnIncreasing,
  UserRound,
  LockKeyhole,
  LogOut
} from 'lucide-react'

function Sidebar({ user }) {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const isAdmin = user?.role === 'Admin'

  const iconStyle = {
    width: 19,
    height: 19,
    flexShrink: 0,
    strokeWidth: 1.8
  }

  const handleLogout = async () => {
    try {
      const response = await fetch(
        'http://localhost:5097/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Đăng xuất thất bại')
      }

      setShowLogoutConfirm(false)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Lỗi đăng xuất:', error)
      alert('Không thể đăng xuất. Vui lòng thử lại.')
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">G</div>
        <div>
          <h2>The Grand Hotel</h2>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/" end className="menu-item">
          <LayoutDashboard style={iconStyle} />
          <span>Tổng quan</span>
        </NavLink>

        <div className="menu-title">QUẢN LÝ PHÒNG</div>

        <NavLink to="/room-map" className="menu-item">
          <Grid2X2 style={iconStyle} />
          <span>Sơ đồ phòng</span>
        </NavLink>

        <NavLink to="/rooms" className="menu-item">
          <BedDouble style={iconStyle} />
          <span>Danh sách phòng</span>
        </NavLink>

        {isAdmin && (
          <>
            <div className="menu-title">DANH MỤC</div>

            <NavLink to="/room-types" className="menu-item">
              <Tags style={iconStyle} />
              <span>Thể loại phòng</span>
            </NavLink>

            <div className="menu-title">THỐNG KÊ</div>

            <NavLink to="/income" className="menu-item">
              <ChartNoAxesColumnIncreasing style={iconStyle} />
              <span>Thống kê thu nhập</span>
            </NavLink>
          </>
        )}

        <div className="menu-title">TÀI KHOẢN</div>

        <NavLink to="/profile" className="menu-item">
          <UserRound style={iconStyle} />
          <span>Thông tin cá nhân</span>
        </NavLink>

        <NavLink to="/change-password" className="menu-item">
          <LockKeyhole style={iconStyle} />
          <span>Đổi mật khẩu</span>
        </NavLink>

        <button
          type="button"
          className="logout-menu"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut style={iconStyle} />
          <span>Đăng xuất</span>
        </button>
      </nav>

      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="logout-modal-icon">
              <LogOut size={30} strokeWidth={1.8} />
            </div>

            <h3>Xác nhận đăng xuất</h3>

            <p>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Không
              </button>

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
