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
import RoomTypes from './pages/RoomTypes'
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


            {/* Thêm phòng */}

            <Route
              path="/rooms/add"
              element={<AddRoom />}
            />


            {/* Thể loại phòng */}

            <Route
              path="/room-types"
              element={<RoomTypes />}
            />


            {/* Thuê phòng */}

            <Route
              path="/rent-room"
              element={<RentRoom />}
            />


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