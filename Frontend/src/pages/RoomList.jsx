import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function RoomList() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("http://localhost:5097/api/rooms")

      if (!response.ok) {
        throw new Error("Không thể tải danh sách phòng.")
      }

      const data = await response.json()
      setRooms(data)
    } catch (err) {
      setError("Không thể kết nối đến Backend.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ"
  }

  const getStatusText = (status) => {
    switch (status) {
      case "Available":
        return "Còn trống"
      case "Occupied":
        return "Đang thuê"
      case "Maintenance":
        return "Bảo trì"
      default:
        return status
    }
  }

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return null
    }

    if (imageUrl.startsWith("http")) {
      return imageUrl
    }

    return `http://localhost:5097${imageUrl}`
  }

  return (
    <div className="room-list-page">

      <div className="room-list-header">
        <div>
          <h1>Danh sách phòng</h1>
          <p>Quản lý thông tin các phòng cho thuê</p>
        </div>

        <button
          className="add-room-button"
          onClick={() => navigate("/rooms/add")}
        >
          + Thêm phòng
        </button>
      </div>

      {loading && (
        <div className="room-message">
          Đang tải danh sách phòng...
        </div>
      )}

      {error && (
        <div className="room-message room-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="room-table-card">

          <table className="room-table">

            <thead>
              <tr>
                <th>STT</th>
                <th>Ảnh</th>
                <th>Số phòng</th>
                <th>Loại phòng</th>
                <th>Giá phòng</th>
                <th>Sức chứa</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>

              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-room">
                    Chưa có phòng nào.
                  </td>
                </tr>
              ) : (
                rooms.map((room, index) => (
                  <tr key={room.id}>

                    {/* STT */}
                    <td>{index + 1}</td>

                    {/* ẢNH PHÒNG */}
                    <td>
                      {room.imageUrl ? (
                        <img
                          src={getImageUrl(room.imageUrl)}
                          alt={`Phòng ${room.roomNumber}`}
                          className="room-thumbnail"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <span className="no-room-image">
                          Chưa có ảnh
                        </span>
                      )}
                    </td>

                    {/* SỐ PHÒNG */}
                    <td>
                      <strong>{room.roomNumber}</strong>
                    </td>

                    {/* LOẠI PHÒNG */}
                    <td>{room.roomType}</td>

                    {/* GIÁ */}
                    <td className="room-price">
                      {formatPrice(room.price)}
                    </td>

                    {/* SỨC CHỨA */}
                    <td>
                      {room.capacity} người
                    </td>

                    {/* TRẠNG THÁI */}
                    <td>
                      <span
                        className={`room-status ${
                          room.status === "Available"
                            ? "status-available"
                            : room.status === "Occupied"
                            ? "status-occupied"
                            : "status-maintenance"
                        }`}
                      >
                        {getStatusText(room.status)}
                      </span>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  )
}

export default RoomList