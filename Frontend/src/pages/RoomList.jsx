import { useEffect, useState } from "react";
import "./RoomList.css";

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
  try {
    setLoading(true);
    setError("");

    // Danh sách phòng là dữ liệu chính
    const roomsResponse = await fetch(
      "http://localhost:5097/api/rooms",
      {
        credentials: "include",
      }
    );

    if (!roomsResponse.ok) {
      throw new Error("Không thể tải danh sách phòng.");
    }

    const roomsData = await roomsResponse.json();
    setRooms(roomsData);

    // Booking là dữ liệu bổ sung.
    // Nếu API booking bị 401 thì vẫn hiển thị danh sách phòng.
    try {
      const token = localStorage.getItem("token");

      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const bookingsResponse = await fetch(
        "http://localhost:5097/api/bookings/active",
        {
          credentials: "include",
          headers,
        }
      );

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setActiveBookings(bookingsData);
      } else {
        console.warn(
          `Không thể tải booking (${bookingsResponse.status}).`
        );
        setActiveBookings([]);
      }
    } catch (bookingError) {
      console.warn("Lỗi khi tải booking:", bookingError);
      setActiveBookings([]);
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách phòng:", error);
    setError("Không thể tải danh sách phòng.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadData();
  }, []);

  const findActiveBooking = (roomId) => {
    return activeBookings.find(
      (booking) => Number(booking.roomId) === Number(roomId)
    );
  };

  const formatDateTime = (value) => {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "--";
    }

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRoomInfo = (room) => {
    const booking = findActiveBooking(room.id);

    switch (room.status) {
      case 0:
        return {
          className: "available",
          statusText: "Phòng trống",
          booking: null,
        };

      case 1:
        return {
          className: "occupied",
          statusText: "Đã có người thuê",
          booking,
        };

      case 2:
        return {
          className: "maintenance",
          statusText: "Bảo trì",
          booking: null,
        };

      case 3:
        return {
          className: "reserved",
          statusText: "Đã đặt trước",
          booking: null,
        };

      default:
        return {
          className: "other",
          statusText: "Không xác định",
          booking: null,
        };
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa phòng này không?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5097/api/rooms/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể xóa phòng.");
        return;
      }

      alert(data.message || "Xóa phòng thành công.");

      setRooms((currentRooms) =>
        currentRooms.filter((room) => room.id !== id)
      );
    } catch (error) {
      console.error("Lỗi khi xóa phòng:", error);
      alert("Không thể kết nối đến máy chủ.");
    }
  };

  if (loading) {
    return (
      <div className="room-list-page">
        <p>Đang tải danh sách phòng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-list-page">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="room-list-page">
      <div className="room-list-header">
        <h1>Danh sách phòng</h1>
        <p>Theo dõi trạng thái các phòng trong khách sạn</p>
      </div>

      {rooms.length === 0 ? (
        <div className="room-empty">
          Chưa có phòng.
        </div>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => {
            const info = getRoomInfo(room);

            return (
              <div
                className={`room-card ${info.className}`}
                key={room.id}
              >
                <h3>Phòng {room.roomNumber}</h3>

                <p className="room-card-status">
                  {info.statusText}
                </p>

                <p>
                  <strong>Giờ vào:</strong>{" "}
                  {info.booking
                    ? formatDateTime(info.booking.checkInDate)
                    : "--"}
                </p>

                <p>
                  <strong>Giờ ra:</strong>{" "}
                  {info.booking
                    ? formatDateTime(
                        info.booking.actualCheckOutDate ||
                          info.booking.expectedCheckOutDate
                      )
                    : "--"}
                </p>

                <button
                  className="room-delete-button"
                  onClick={() => handleDelete(room.id)}
                >
                  Xóa
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RoomList;