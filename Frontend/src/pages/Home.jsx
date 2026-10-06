import hotelBackground from '../assets/hotel-bg.jpg'
import './Home.css'

function Home() {
  return (
    <section
      className="home-hero"
      style={{ '--home-background': `url(${hotelBackground})` }}
    >
      <div className="home-hero-content">
        <p className="home-hero-eyebrow">ENCORE HOTEL &amp; RESORT</p>
        <h1>Quản lý khách sạn, thật gọn gàng.</h1>
        <p className="home-hero-subtitle">
          Hệ thống quản lý phòng cho thuê
        </p>
      </div>
    </section>
  )
}

export default Home