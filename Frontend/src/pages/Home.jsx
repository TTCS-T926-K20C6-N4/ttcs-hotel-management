import { useEffect, useState } from 'react'

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

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      )
    }, 4000)

    return () => clearInterval(timer)
  }, [])

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

  return (
    <div className="home-page">
      <div className="room-slider">

        <img
          src={slides[currentSlide].image}
          alt={slides[currentSlide].title}
          className="slider-image"
        />

        <div className="slider-overlay" />

        <div className="slider-content">
          <h2>{slides[currentSlide].title}</h2>
          <p>{slides[currentSlide].description}</p>
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

      </div>
    </div>
  )
}

export default Home