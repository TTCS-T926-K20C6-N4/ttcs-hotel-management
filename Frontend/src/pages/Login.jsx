import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import './Login.css'


function Login() {

  const navigate = useNavigate()


  // ==========================================
  // STATE
  // ==========================================

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [loginError, setLoginError] =
    useState('')

  const [errors, setErrors] =
    useState({
      email: '',
      password: ''
    })


  // ==========================================
  // NẾU ĐÃ LOGIN THÌ KHÔNG CHO VỀ LOGIN
  // ==========================================

  useEffect(() => {

    const checkExistingSession = async () => {

      try {

        const response = await fetch(
          'http://localhost:5097/api/auth/me',
          {
            method: 'GET',

            credentials: 'include'
          }
        )

        if (response.ok) {

          navigate('/', {
            replace: true
          })

        }

      } catch (error) {

        console.log(
          'Chưa có phiên đăng nhập.',
          error
        )

      }

    }

    checkExistingSession()

  }, [navigate])


  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {

    const newErrors = {
      email: '',
      password: ''
    }


    // Email
    if (!email.trim()) {

      newErrors.email =
        'Vui lòng nhập Email'

    } else {

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email)) {

        newErrors.email =
          'Email không hợp lệ'

      }

    }


    // Password
    if (!password.trim()) {

      newErrors.password =
        'Vui lòng nhập Password'

    }


    setErrors(newErrors)


    return (
      !newErrors.email &&
      !newErrors.password
    )

  }


  // ==========================================
  // ĐĂNG NHẬP
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault()

    setLoginError('')


    // Kiểm tra dữ liệu trước
    if (!validateForm()) {
      return
    }


    setLoading(true)


    try {

      // ======================================
      // GỌI BACKEND
      // ======================================

      const response = await fetch(
        'http://localhost:5097/api/auth/login',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          // Bắt buộc để nhận Session Cookie
          credentials: 'include',

          body: JSON.stringify({
            email: email.trim(),
            password: password
          })
        }
      )


      const data =
        await response.json()


      // ======================================
      // BACKEND BÁO LỖI
      // ======================================

      if (!response.ok) {

        setLoginError(
          data.message ||
          'Đăng nhập không thành công.'
        )

        return

      }


      // ======================================
      // ĐĂNG NHẬP THÀNH CÔNG
      // ======================================

      console.log(
        'Đăng nhập thành công:',
        data.user
      )


      // Backend đã lưu Session.
      // Chuyển vào Home.

      navigate('/', {
        replace: true
      })


    } catch (error) {

      console.error(error)

      setLoginError(
        'Không thể kết nối đến máy chủ.'
      )

    } finally {

      setLoading(false)

    }

  }


  // ==========================================
  // GIAO DIỆN
  // ==========================================

  return (

    <div className="login-page">

      <div className="login-card">


        {/* LOGO */}

        <div className="login-logo">
          H
        </div>


        <div className="hotel-name">
          HOTEL MANAGER
        </div>


        <h1>
          Đăng nhập
        </h1>


        <p className="login-subtitle">

          Đăng nhập để tiếp tục sử dụng hệ thống

        </p>


        <form
          onSubmit={handleSubmit}
          noValidate
        >


          {/* ========================= */}
          {/* EMAIL */}
          {/* ========================= */}

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>


            <input
              id="email"
              type="email"

              placeholder="Nhập email của bạn"

              value={email}

              className={
                errors.email
                  ? 'input-error'
                  : ''
              }

              onChange={(e) => {

                setEmail(
                  e.target.value
                )

                setErrors({
                  ...errors,
                  email: ''
                })

                setLoginError('')

              }}
            />


            {errors.email && (

              <span className="error-message">

                {errors.email}

              </span>

            )}

          </div>


          {/* ========================= */}
          {/* PASSWORD */}
          {/* ========================= */}

          <div className="form-group">

            <label htmlFor="password">
              Mật khẩu
            </label>


            <div className="password-wrapper">

              <input
                id="password"

                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }

                placeholder="Nhập mật khẩu"

                value={password}

                className={
                  errors.password
                    ? 'input-error'
                    : ''
                }

                onChange={(e) => {

                  setPassword(
                    e.target.value
                  )

                  setErrors({
                    ...errors,
                    password: ''
                  })

                  setLoginError('')

                }}
              />


              <button
                type="button"

                className="eye-button"

                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
              >

                {
                  showPassword
                    ? 'Ẩn'
                    : 'Hiện'
                }

              </button>

            </div>


            {errors.password && (

              <span className="error-message">

                {errors.password}

              </span>

            )}

          </div>


          {/* ========================= */}
          {/* LỖI ĐĂNG NHẬP */}
          {/* ========================= */}

          {loginError && (

            <div className="error-message">

              {loginError}

            </div>

          )}


          {/* ========================= */}
          {/* QUÊN MẬT KHẨU */}
          {/* ========================= */}

          <div className="forgot-password">

            <a href="#">
              Quên mật khẩu?
            </a>

          </div>


          {/* ========================= */}
          {/* BUTTON */}
          {/* ========================= */}

          <button
            type="submit"

            className="login-button"

            disabled={loading}
          >

            {
              loading
                ? 'Đang đăng nhập...'
                : 'Đăng nhập'
            }

          </button>

        </form>

      </div>

    </div>

  )

}

export default Login