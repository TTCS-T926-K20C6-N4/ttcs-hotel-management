import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom'

import MainLayout from './layouts/MainLayout'

import Home from './pages/Home'
import RoomList from './pages/RoomList'
import AddRoom from './pages/AddRoom'
import EditRoom from './pages/EditRoom'
import MyBookings from './pages/MyBookings'
import EditBookedRoom from './pages/EditBookedRoom'
import RentRoom from './pages/RentRoom'
import Login from './pages/Login'
import Register from './pages/Register'

import './App.css'


// ==========================================
// PROTECTED ROUTE
// Chỉ cho phép truy cập khi đã đăng nhập
// ==========================================

function ProtectedRoute() {

  const [isLoggedIn, setIsLoggedIn] = useState(null)


  useEffect(() => {

    const checkLogin = async () => {

      try {

        const response = await fetch(
          'http://localhost:5097/api/auth/me',
          {
            method: 'GET',

            // Bắt buộc để gửi Session Cookie
            credentials: 'include'
          }
        )


        if (response.ok) {

          setIsLoggedIn(true)

        } else {

          setIsLoggedIn(false)

        }

      } catch (error) {

        console.error(
          'Không thể kết nối Backend:',
          error
        )

        setIsLoggedIn(false)

      }

    }


    checkLogin()

  }, [])


  // ========================================
  // ĐANG KIỂM TRA SESSION
  // ========================================

  if (isLoggedIn === null) {

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        Đang kiểm tra đăng nhập...
      </div>
    )

  }


  // ========================================
  // CHƯA ĐĂNG NHẬP
  // ========================================

  if (!isLoggedIn) {

    return (
      <Navigate
        to="/login"
        replace
      />
    )

  }


  // ========================================
  // ĐÃ ĐĂNG NHẬP
  // ========================================

  return <Outlet />
}

function AdminRoute() {
  const [isAdmin, setIsAdmin] = useState(null)

  useEffect(() => {
    fetch('http://localhost:5097/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return false
        const data = await response.json()
        return data.user?.role?.toLowerCase() === 'admin'
      })
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
  }, [])

  if (isAdmin === null) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang kiểm tra quyền quản trị...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/rooms" replace />
  }

  return <Outlet />
}

function UserRoute() {
  const [isUser, setIsUser] = useState(null)

  useEffect(() => {
    fetch('http://localhost:5097/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return false
        const data = await response.json()
        return data.user?.role?.toLowerCase() === 'user'
      })
      .then(setIsUser)
      .catch(() => setIsUser(false))
  }, [])

  if (isUser === null) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải phòng đã đặt...</div>
  }

  if (!isUser) {
    return <Navigate to="/rooms" replace />
  }

  return <Outlet />
}


// ==========================================
// APP
// ==========================================

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* ================================== */}
        {/* TRANG CÔNG KHAI */}
        {/* Không cần đăng nhập */}
        {/* ================================== */}


        <Route
          path="/login"
          element={<Login />}
        />


        <Route
          path="/register"
          element={<Register />}
        />


        {/* ================================== */}
        {/* TRANG BẮT BUỘC PHẢI ĐĂNG NHẬP */}
        {/* ================================== */}


        <Route element={<ProtectedRoute />}>


          <Route element={<MainLayout />}>


            {/* Trang chủ */}

            <Route
              path="/"
              element={<Home />}
            />


            {/* Danh sách phòng */}

            <Route
              path="/rooms"
              element={<RoomList />}
            />

            <Route element={<UserRoute />}>
              <Route
                path="/my-bookings"
                element={<MyBookings />}
              />

              <Route
                path="/my-bookings/:bookingId/edit"
                element={<EditBookedRoom />}
              />
            </Route>

            <Route
              path="/rent-room"
              element={<RentRoom />}
            />


            {/* Thêm phòng */}

            <Route element={<AdminRoute />}>
              <Route
                path="/rooms/add"
                element={<AddRoom />}
              />

              <Route
                path="/rooms/:id/edit"
                element={<EditRoom />}
              />
            </Route>


          </Route>


        </Route>


        {/* ================================== */}
        {/* ROUTE KHÔNG TỒN TẠI */}
        {/* ================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />


      </Routes>

    </BrowserRouter>

  )

}

export default App