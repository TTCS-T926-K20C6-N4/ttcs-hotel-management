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
import Login from './pages/Login'

import './App.css'


// ==========================================
// PROTECTED ROUTE
// Chặn người chưa đăng nhập
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


  // Đang kiểm tra Session
  if (isLoggedIn === null) {
    return (
      <div style={{ padding: '30px' }}>
        Đang kiểm tra đăng nhập...
      </div>
    )
  }


  // Chưa đăng nhập
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  // Đã đăng nhập
  return <Outlet />
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ============================= */}
        {/* LOGIN */}
        {/* ============================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ============================= */}
        {/* CÁC TRANG PHẢI ĐĂNG NHẬP */}
        {/* ============================= */}

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/rooms"
              element={<RoomList />}
            />

            <Route
              path="/rooms/add"
              element={<AddRoom />}
            />

          </Route>

        </Route>


        {/* ============================= */}
        {/* ROUTE KHÔNG TỒN TẠI */}
        {/* ============================= */}

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