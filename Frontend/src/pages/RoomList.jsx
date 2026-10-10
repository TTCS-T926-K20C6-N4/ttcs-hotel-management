import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import Modal from "../components/Modal";
import { formatDate, formatMoney } from "../services/api";
import { getRoomStatusInfo, ROOM_STATUS } from "../services/roomStatus";
import "./RoomList.css";

const API_ORIGIN = "http://localhost:5097";

function getImageSource(imageUrl) {
  if (!imageUrl) return "";
  return imageUrl.startsWith("/") ? `${API_ORIGIN}${imageUrl}` : imageUrl;
}

function RoomList() {
  const location = useLocation();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState(() =>
    location.state?.toast
      ? location.state.toast
      : location.state?.roomCheckedOut
      ? {
          type: location.state.checkoutInvoiceError ? "error" : "success",
          message: location.state.checkoutInvoiceError
            ? `Đã trả phòng ${location.state.roomCheckedOut}, nhưng không nhận được thông tin hoá đơn.`
            : `Đã trả phòng ${location.state.roomCheckedOut}. Phòng hiện đã trống.`,
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
// LẤY SỐ LƯỢNG PHÒNG THEO TRẠNG THÁI
// ============================
const statusResponse = await fetch(
  "http://localhost:5097/api/rooms/status-count",
  {
    credentials: "include",
  }
);

if (!statusResponse.ok) {
  throw new Error("Không thể tải số lượng phòng theo trạng thái.");
}

const statusData = await statusResponse.json();
setStatusCounts(statusData);
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
  // BỘ LỌC TRẠNG THÁI PHÒNG
  // ============================

  const getStatusLabel = (status) => {
    const item = statusCounts.find((s) => Number(s.status) === Number(status));
    if (!item) return "đã chọn";
    const statusLabels = {
      Available: "Phòng trống",
      Occupied: "Đang thuê",
      Maintenance: "Bảo trì",
      Reserved: "Đã đặt trước",
    };
    return statusLabels[item.statusName] || item.statusName;
  };

  const filteredRooms =
    selectedStatus === null
      ? rooms
      : rooms.filter(
          (room) => Number(room.status) === Number(selectedStatus),
        );

  return (
    <div className="room-list-page">

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {location.state?.checkoutInvoice && (
        <Modal
          title="Hoá đơn thanh toán"
          onClose={() =>
            navigate("/rooms", {
              replace: true,
              state: { roomCheckedOut: location.state.roomCheckedOut },
            })
          }
          footer={
            <button
              type="button"
              className="room-add-button"
              onClick={() =>
                navigate("/rooms", {
                  replace: true,
                  state: { roomCheckedOut: location.state.roomCheckedOut },
                })
              }
            >
              Đóng — xem phòng trống
            </button>
          }
        >
          <p>
            Trả phòng hoàn tất. Phòng {location.state.checkoutInvoice.roomNumber} hiện đã được chuyển về trạng thái trống.
          </p>
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px 20px" }}>
            <div>
              <dt>Mã hoá đơn</dt>
              <dd>{location.state.checkoutInvoice.code}</dd>
            </div>
            <div>
              <dt>Phòng</dt>
              <dd>{location.state.checkoutInvoice.roomNumber}</dd>
            </div>
            <div>
              <dt>Khách hàng</dt>
              <dd>{location.state.checkoutInvoice.customerName}</dd>
            </div>
            <div>
              <dt>Thời điểm lập</dt>
              <dd>{formatDate(location.state.checkoutInvoice.createdAt)}</dd>
            </div>
          </dl>
          <div>
            <p>Tiền phòng ({location.state.checkoutInvoice.nights} ngày): {formatMoney(location.state.checkoutInvoice.roomAmount)}</p>
            <p>Tiền dịch vụ: {formatMoney(location.state.checkoutInvoice.serviceAmount)}</p>
            <p>Giảm giá: -{formatMoney(location.state.checkoutInvoice.discount)}</p>
            <strong>Tổng thanh toán: {formatMoney(location.state.checkoutInvoice.totalAmount)}</strong>
          </div>
        </Modal>
      )}

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

        <div
          className={`aurora-total-card ${selectedStatus === null ? "is-active" : ""}`}
          onClick={() => setSelectedStatus(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedStatus(null);
            }
          }}
          title="Nhấp để hiển thị tất cả các phòng"
        >
          <div className="aurora-status-icon" aria-hidden="true">
            🏨
          </div>
          <strong>{rooms.length}</strong>
          <span>Tổng số phòng</span>
        </div>

        <div className="room-summary-divider" />

        {statusCounts.map((item) => {
          const statusConfig = {
            Available: {
              label: "Phòng trống",
              icon: "✓",
              className: "available",
            },
            Occupied: {
              label: "Đang thuê",
              icon: "🛏",
              className: "occupied",
            },
            Maintenance: {
              label: "Bảo trì",
              icon: "🔧",
              className: "maintenance",
            },
            Reserved: {
              label: "Đã đặt trước",
              icon: "📅",
              className: "reserved",
            },
          };

          const config = statusConfig[item.statusName] || {
            label: item.statusName,
            icon: "🏨",
            className: "other",
          };

          const isItemActive = selectedStatus === item.status;

          return (
            <div
              key={item.status}
              className={`room-status-count aurora-${config.className} ${isItemActive ? "is-active" : ""}`}
              onClick={() =>
                setSelectedStatus((prev) => (prev === item.status ? null : item.status))
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedStatus((prev) => (prev === item.status ? null : item.status));
                }
              }}
              title={`Nhấp để lọc danh sách: ${config.label}`}
            >
              <div className="aurora-status-icon">{config.icon}</div>
              <strong className="aurora-status-number">{item.count}</strong>
              <span className="aurora-status-label">{config.label}</span>
            </div>
          );
        })}

      </div>

      {/* ============================
          THANH THÔNG BÁO BỘ LỌC
      ============================ */}
      {selectedStatus !== null && (
        <div className="room-filter-status-bar">
          <span className="room-filter-indicator-text">
            Đang lọc theo trạng thái: <strong>{getStatusLabel(selectedStatus)}</strong> ({filteredRooms.length} phòng)
          </span>
          <button
            type="button"
            className="room-filter-reset-button"
            onClick={() => setSelectedStatus(null)}
          >
            ✕ Bỏ lọc (Xem tất cả {rooms.length} phòng)
          </button>
        </div>
      )}

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

      ) : filteredRooms.length === 0 ? (

        <div className="room-empty">

          <div
            className="room-empty-icon"
            aria-hidden="true"
          >
            ⌂
          </div>

          <h2>Không có phòng nào ở trạng thái "{getStatusLabel(selectedStatus)}"</h2>

          <p>
            Hiện tại chưa có phòng nào thuộc trạng thái này. Bạn có thể chuyển sang trạng thái khác hoặc xem lại tất cả phòng.
          </p>

          <button
            type="button"
            className="room-add-button"
            onClick={() => setSelectedStatus(null)}
          >
            Xem tất cả phòng
          </button>

        </div>

      ) : (

        <div className="room-grid">

          {filteredRooms.map((room) => {

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