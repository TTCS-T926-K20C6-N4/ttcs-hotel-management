import { useEffect, useState } from 'react'
import { api } from '../services/api'

function Header() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.getCurrentUser()
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null))
  }, [])

  const displayName = user?.fullName || user?.email || 'Tài khoản'
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const roleLabel = isAdmin
    ? 'Quản trị viên'
    : user?.role?.toLowerCase() === 'user'
      ? 'Người dùng'
      : 'Nhân viên'

  return (
    <header className="topbar">

      <div>
        <h3>Quản lý phòng cho thuê</h3>
        <p>Hệ thống quản lý khách sạn</p>
      </div>

      <div className="user-box">
        <div className="avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div>
          <strong>{displayName}</strong>
          <span>{roleLabel}</span>
        </div>
      </div>

    </header>
  )
}

export default Header