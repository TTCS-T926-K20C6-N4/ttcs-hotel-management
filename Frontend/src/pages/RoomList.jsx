import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Toast from "../components/Toast";
import { getRoomStatusInfo, ROOM_STATUS } from "../services/roomStatus";
import "./RoomList.css";

const API_ORIGIN = "http://localhost:5097";

function getImageSource(imageUrl) {
  if (!imageUrl) return "";
  return imageUrl.startsWith("/") ? `${API_ORIGIN}${imageUrl}` : imageUrl;
}

function RoomList() {
  const location = useLocation();

  const [rooms, setRooms] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState(() =>
    location.state?.roomCheckedOut
      ? {
          type: "success",
          message: `Đã trả phòng ${location.state.roomCheckedOut}. Phòng hiện đã trống.`,
        }
      : location.state?.roomUpdated
        ? {
            type: "success",
            message: `Đã cập nhật thông tin phòng ${location.state.roomUpdated}.`,
          }
        : location.state?.roomRented
          ? {
              type: "success",
              message: `Đã cho thuê phòng ${location.state.roomRented} thành công.`,
            }
          : null,
  );

  const loadData = async (isRetry = false) => {
    try {
      if (isRetry) {
        setLoading(true);
        setError("");
      }

      // ============================
      // LẤY DANH SÁCH PHÒNG
      // ============================
      const roomsResponse = await fetch(
        "http://localhost:5097/api/rooms",
        {
          credentials: "include",
        },
      );

      if (!roomsResponse.ok) {
        throw new Error("Không thể tải danh sách phòng.");
      }

      const roomsData = await roomsResponse.json();
      setRooms(roomsData);

      // ============================
      // LẤY BOOKING ĐANG HOẠT ĐỘNG
      // ============================
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
          },
        );

        if (bookingsResponse.ok) {
          setActiveBookings(await bookingsResponse.json());
        } else {
          console.warn(
            `Không thể tải booking (${bookingsResponse.status}).`,
          );
          setActiveBookings([]);
        }
      } catch (bookingError) {
        console.warn("Lỗi khi tải booking:", bookingError);
        setActiveBookings([]);
      }
    } catch (loadError) {
      console.error("Lỗi khi tải danh sách phòng:", loadError);
      setError("Không thể tải danh sách phòng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================
  // TÌM BOOKING THEO PHÒNG
  // ============================
  const findActiveBooking = (roomId) =>
    activeBookings.find(
      (booking) => Number(booking.roomId) === Number(roomId),
    );

  // ============================
  // FORMAT NGÀY GIỜ
  // ============================
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

  // ============================
  // THÔNG TIN TRẠNG THÁI PHÒNG
  // ============================
  const getRoomInfo = (room) => {
    const booking = findActiveBooking(room.id);
    const statusInfo = getRoomStatusInfo(room.status);

    return {
      ...statusInfo,
      statusText: statusInfo.label,
      booking:
        Number(room.status) === ROOM_STATUS.Occupied
          ? booking
          : null,
    };
  };

  // ============================
  // XÓA PHÒNG
  // ============================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa phòng này không?",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5097/api/rooms/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Không thể xóa phòng.");
        return;
      }

      alert(data.message || "Xóa phòng thành công.");

      setRooms((currentRooms) =>
        currentRooms.filter((room) => room.id !== id),
      );
    } catch (deleteError) {
      console.error("Lỗi khi xóa phòng:", deleteError);
      alert("Không thể kết nối đến máy chủ.");
    }
  };

  // ============================
  // LOADING
  // ============================
  if (loading) {
    return (
      <div className="room-list-page">
        <div className="room-list-message">
          Đang tải danh sách phòng...
        </div>
      </div>
    );
  }

  // ============================
  // ERROR
  // ============================
  if (error) {
    return (
      <div className="room-list-page">
        <div className="room-list-message room-list-message-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => loadData(true)}
          >
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // ĐẾM PHÒNG TRỐNG
  // ============================
  const availableRooms = rooms.filter(
    (room) =>
      Number(room.status) === ROOM_STATUS.Available,
  ).length;

  return (
    <div className="room-list-page">

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {/* ============================
          HEADER
      ============================ */}
      <div className="room-list-header">
        <div>
          <div className="room-list-eyebrow">
            TỔNG QUAN KHÁCH SẠN
          </div>

          <h1>Danh sách phòng</h1>

          <p>
            Theo dõi trạng thái và thông tin các phòng
            trong khách sạn.
          </p>
        </div>

        <Link
          to="/rooms/add"
          className="room-add-button"
        >
          <span aria-hidden="true">＋</span>
          Thêm phòng
        </Link>
      </div>

      {/* ============================
          THỐNG KÊ
      ============================ */}
      <div className="room-list-summary">

        <div
          className="room-summary-icon"
          aria-hidden="true"
        >
          ▦
        </div>

        <div>
          <span>Tổng số phòng</span>
          <strong>{rooms.length}</strong>
        </div>

        <div className="room-summary-divider" />

        <div
          className="room-summary-icon room-summary-available"
          aria-hidden="true"
        >
          ✓
        </div>

        <div>
          <span>Sẵn sàng cho thuê</span>
          <strong>{availableRooms}</strong>
        </div>

      </div>

      {/* ============================
          DANH SÁCH PHÒNG
      ============================ */}
      {rooms.length === 0 ? (

        <div className="room-empty">

          <div
            className="room-empty-icon"
            aria-hidden="true"
          >
            ⌂
          </div>

          <h2>Chưa có phòng nào</h2>

          <p>
            Thêm phòng đầu tiên để bắt đầu quản lý
            khách sạn.
          </p>

          <Link
            to="/rooms/add"
            className="room-add-button"
          >
            Thêm phòng ngay
          </Link>

        </div>

      ) : (

        <div className="room-grid">

          {rooms.map((room) => {

            const info = getRoomInfo(room);
            const imageSource =
              getImageSource(room.imageUrl);

            const isAvailable =
              Number(room.status) ===
              ROOM_STATUS.Available;

            return (

              <article
                className={`room-list-card ${info.className}`}
                key={room.id}
              >

                {/* ẢNH PHÒNG */}
                <div className="room-list-card-cover">

                  {imageSource ? (

                    <img
                      src={imageSource}
                      alt={`Phòng ${room.roomNumber}`}
                    />

                  ) : (

                    <div
                      className="room-list-card-placeholder"
                      aria-hidden="true"
                    >
                      <span>⌂</span>
                      <small>HOTEL MANAGER</small>
                    </div>

                  )}

                  <span className="room-list-card-status">
                    {info.statusText}
                  </span>

                </div>

                {/* THÔNG TIN PHÒNG */}
                <div className="room-list-card-content">

                  <div className="room-list-card-title">

                    <div>
                      <span className="room-list-card-kicker">
                        PHÒNG
                      </span>

                      <h2>{room.roomNumber}</h2>
                    </div>

                    <span className="room-list-card-floor">
                      Tầng {room.floor ?? "--"}
                    </span>

                  </div>

                  <div className="room-list-card-type">

                    <span aria-hidden="true">◇</span>

                    {room.roomType?.name ||
                      "Chưa phân loại"}

                  </div>

                  {/* THỜI GIAN THUÊ */}
                  <div className="room-list-card-booking">

                    <div>
                      <span>Giờ vào</span>

                      <strong>
                        {info.booking
                          ? formatDateTime(
                              info.booking.checkInDate,
                            )
                          : "--"}
                      </strong>
                    </div>

                    <div>
                      <span>Giờ ra</span>

                      <strong>
                        {info.booking
                          ? formatDateTime(
                              info.booking.actualCheckOutDate ||
                                info.booking.expectedCheckOutDate,
                            )
                          : "--"}
                      </strong>
                    </div>

                  </div>

                  {/* GHI CHÚ */}
                  {room.note && (
                    <p className="room-list-card-note">
                      {room.note}
                    </p>
                  )}

                  {/* ============================
                      CÁC NÚT THAO TÁC
                  ============================ */}
                  <div className="room-list-card-actions">

                    {/* CHỈ PHÒNG TRỐNG MỚI ĐƯỢC CHO THUÊ */}
                    {isAvailable && (
                      <Link
                        to={`/rent-room/${room.id}`}
                        className="room-rent-button"
                      >
                        Cho thuê
                      </Link>
                    )}

                    {info.booking && (
                      <Link
                        to={`/checkout?bookingId=${info.booking.id}`}
                        className="room-edit-button"
                      >
                        Trả phòng
                      </Link>
                    )}

                    <Link
                      to={`/rooms/${room.id}/edit`}
                      className="room-edit-button"
                    >
                      <span aria-hidden="true">↻</span>
                      Cập nhật
                    </Link>

                    <button
                      type="button"
                      className="room-delete-button"
                      onClick={() =>
                        handleDelete(room.id)
                      }
                    >
                      Xóa phòng
                    </button>

                  </div>

                </div>

              </article>
            );
          })}

        </div>

      )}

    </div>
  );
}

export default RoomList;