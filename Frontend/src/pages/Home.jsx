import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { ROOM_STATUS } from '../services/roomStatus'
import { ErrorBox, Loading } from '../components/Feedback'

import room1 from '../assets/rooms/room1.jpg'
import room2 from '../assets/rooms/room2.jpg'
import room3 from '../assets/rooms/room3.jpg'
import room4 from '../assets/rooms/room4.jpg'
import room5 from '../assets/rooms/room5.jpg'
import room6 from '../assets/rooms/room6.jpg'
import room7 from '../assets/rooms/room7.jpg'
import room8 from '../assets/rooms/room8.jpg'
import room9 from '../assets/rooms/room9.jpg'
import room10 from '../assets/rooms/room10.jpg'

import './Home.css'

const slides = [
  {
    image: room1,
    title: 'Phòng nghỉ tiện nghi',
    description: 'Không gian thoải mái và đầy đủ tiện nghi'
  },
  {
    image: room2,
    title: 'Không gian hiện đại',
    description: 'Thiết kế hiện đại mang đến trải nghiệm thư giãn'
  },
  {
    image: room3,
    title: 'Phòng nghỉ sang trọng',
    description: 'Không gian tinh tế dành cho kỳ nghỉ thoải mái'
  },
  {
    image: room4,
    title: 'Không gian rộng rãi',
    description: 'Phòng nghỉ thoáng mát và thuận tiện'
  },
  {
    image: room5,
    title: 'Phòng đôi tiện nghi',
    description: 'Không gian phù hợp cho khách lưu trú'
  },
  {
    image: room6,
    title: 'Không gian nghỉ dưỡng',
    description: 'Mang đến cảm giác thư giãn và dễ chịu'
  },
  {
    image: room7,
    title: 'Phòng nghỉ cao cấp',
    description: 'Trang thiết bị hiện đại và tiện nghi'
  },
  {
    image: room8,
    title: 'Không gian ấm cúng',
    description: 'Thiết kế gần gũi và thoải mái'
  },
  {
    image: room9,
    title: 'Trải nghiệm tiện nghi',
    description: 'Đáp ứng nhu cầu lưu trú của khách hàng'
  },
  {
    image: room10,
    title: 'Dịch vụ chuyên nghiệp',
    description: 'Mang đến trải nghiệm lưu trú tốt nhất'
  }
]

const dashboardDate = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
}).format(new Date())

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRooms = useCallback(async () => {
    const roomList = await api.getRooms()

    if (!Array.isArray(roomList)) {
      throw new Error('Dữ liệu phòng không hợp lệ.')
    }

    return roomList
  }, [])

  const loadRooms = async () => {
    setLoading(true)
    setError('')

    try {
      setRooms(await fetchRooms())
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải dữ liệu tổng quan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    fetchRooms()
      .then((roomList) => {
        if (active) setRooms(roomList)
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải dữ liệu tổng quan.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [fetchRooms])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      )
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const roomCounts = useMemo(() => {
    const counts = {
      total: rooms.length,
      available: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
    }

    rooms.forEach((room) => {
      const status = Number(room.status)

      if (status === ROOM_STATUS.Available) counts.available += 1
      if (status === ROOM_STATUS.Occupied) counts.occupied += 1
      if (status === ROOM_STATUS.Reserved) counts.reserved += 1
      if (status === ROOM_STATUS.Maintenance) counts.maintenance += 1
    })

    return counts
  }, [rooms])

  const occupancyRate = roomCounts.total
    ? Math.round((roomCounts.occupied / roomCounts.total) * 100)
    : 0

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === slides.length - 1 ? 0 : prev + 1
    )
  }

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    )
  }

  if (loading) {
    return <Loading message="Đang tải tổng quan khách sạn..." />
  }

  if (error) {
    return <ErrorBox message={error} onRetry={loadRooms} />
  }

  return (
    <div className="home-page">
      <section className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">TỔNG QUAN HỆ THỐNG</span>
          <h1>The Grand Hotel</h1>
          <p>Theo dõi tình hình phòng và truy cập nhanh các chức năng vận hành.</p>
        </div>
        <div className="dashboard-date">
          <span>HÔM NAY</span>
          <strong>{dashboardDate}</strong>
        </div>
      </section>

      <section className="room-slider" aria-label="Giới thiệu khách sạn">
        <img
          src={slides[currentSlide].image}
          alt={slides[currentSlide].title}
          className="slider-image"
        />

        <div className="slider-overlay" />

        <div className="slider-content">
          <span className="slider-kicker">THE GRAND HOTEL</span>
          <h2>Vận hành thuận tiện,<br />trải nghiệm trọn vẹn</h2>
          <p>Quản lý phòng nghỉ và tình hình lưu trú tại một nơi.</p>
          <Link to="/rooms" className="dashboard-hero-link">
            Quản lý phòng <span aria-hidden="true">→</span>
          </Link>
        </div>

        <button
          type="button"
          className="slider-button slider-prev"
          onClick={prevSlide}
          aria-label="Ảnh trước"
        >
          ‹
        </button>

        <button
          type="button"
          className="slider-button slider-next"
          onClick={nextSlide}
          aria-label="Ảnh tiếp theo"
        >
          ›
        </button>

        <div className="slider-dots">
          {slides.map((_, index) => (
            <button
              type="button"
              key={index}
              className={
                index === currentSlide
                  ? 'slider-dot active'
                  : 'slider-dot'
              }
              onClick={() => setCurrentSlide(index)}
              aria-label={`Chuyển đến ảnh ${index + 1}`}
            />
          ))}
        </div>

      </section>

      <section className="dashboard-stats" aria-label="Thống kê phòng">
        <article className="dashboard-stat dashboard-stat-total">
          <div className="dashboard-stat-icon">▦</div>
          <div>
            <span>Tổng số phòng</span>
            <strong>{roomCounts.total}</strong>
            <small>Toàn bộ hệ thống</small>
          </div>
        </article>
        <article className="dashboard-stat dashboard-stat-available">
          <div className="dashboard-stat-icon">✓</div>
          <div>
            <span>Phòng trống</span>
            <strong>{roomCounts.available}</strong>
            <small>Sẵn sàng đón khách</small>
          </div>
        </article>
        <article className="dashboard-stat dashboard-stat-occupied">
          <div className="dashboard-stat-icon">⌂</div>
          <div>
            <span>Đang có khách</span>
            <strong>{roomCounts.occupied}</strong>
            <small>{occupancyRate}% công suất phòng</small>
          </div>
        </article>
        <article className="dashboard-stat dashboard-stat-attention">
          <div className="dashboard-stat-icon">◷</div>
          <div>
            <span>Cần theo dõi</span>
            <strong>{roomCounts.reserved + roomCounts.maintenance}</strong>
            <small>{roomCounts.reserved} đặt trước · {roomCounts.maintenance} bảo trì</small>
          </div>
        </article>
      </section>

      <section className="dashboard-lower">
        <article className="dashboard-occupancy">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">TÌNH HÌNH PHÒNG</span>
              <h2>Công suất hoạt động</h2>
            </div>
            <strong>{occupancyRate}%</strong>
          </div>
          <div
            className="dashboard-progress"
            role="progressbar"
            aria-label="Công suất phòng"
            aria-valuenow={occupancyRate}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span style={{ width: `${occupancyRate}%` }} />
          </div>
          <div className="dashboard-progress-caption">
            <span>{roomCounts.occupied} phòng đang có khách</span>
            <span>{roomCounts.total} phòng tổng cộng</span>
          </div>
        </article>

        <article className="dashboard-shortcuts">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-eyebrow">TRUY CẬP NHANH</span>
              <h2>Chức năng quản lý</h2>
            </div>
          </div>
          <div className="dashboard-shortcut-list">
            <Link to="/rooms" className="dashboard-shortcut">
              <span className="dashboard-shortcut-icon">▤</span>
              <span><strong>Danh sách phòng</strong><small>Thông tin và thao tác phòng</small></span>
              <span className="dashboard-shortcut-arrow">→</span>
            </Link>
            <Link to="/room-map" className="dashboard-shortcut">
              <span className="dashboard-shortcut-icon">⌖</span>
              <span><strong>Sơ đồ phòng</strong><small>Quan sát phòng theo tầng</small></span>
              <span className="dashboard-shortcut-arrow">→</span>
            </Link>
            <Link to="/room-types" className="dashboard-shortcut">
              <span className="dashboard-shortcut-icon">◇</span>
              <span><strong>Thể loại phòng</strong><small>Quản lý loại phòng và giá</small></span>
              <span className="dashboard-shortcut-arrow">→</span>
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}

export default Home