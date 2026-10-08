import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RoomList.css";

// Hình ảnh dự phòng chất lượng cao theo từng hạng phòng (Unsplash Hotel Photography)
const FALLBACK_IMAGES = {
  standard:
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
  superior:
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  deluxe:
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  suite:
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
  vip:
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
};

const getRoomImage = (room) => {
  if (room.imageUrl) {
    if (room.imageUrl.startsWith("http")) return room.imageUrl;
    return `http://localhost:5097${room.imageUrl}`;
  }
  const typeName = (room.roomType?.name || "").toLowerCase();
  if (typeName.includes("tiêu chuẩn") || typeName.includes("standard")) {
    return FALLBACK_IMAGES.standard;
  }
  if (typeName.includes("cao cấp") || typeName.includes("superior")) {
    return FALLBACK_IMAGES.superior;
  }
  if (typeName.includes("sang trọng") || typeName.includes("deluxe")) {
    return FALLBACK_IMAGES.deluxe;
  }
  if (typeName.includes("gia đình") || typeName.includes("suite")) {
    return FALLBACK_IMAGES.suite;
  }
  if (typeName.includes("tổng thống") || typeName.includes("vip")) {
    return FALLBACK_IMAGES.vip;
  }
  return FALLBACK_IMAGES.default;
};

const STATUS_CONFIG = {
  all: {
    id: null,
    label: "Tất cả phòng",
    icon: "🏢",
    color: "#2563eb",
  },
  0: {
    id: 0,
    label: "Phòng trống",
    icon: "🟢",
    color: "#16a34a",
  },
  1: {
    id: 1,
    label: "Đang có khách",
    icon: "🔴",
    color: "#dc2626",
  },
  2: {
    id: 2,
    label: "Đang bảo trì",
    icon: "🛠️",
    color: "#ea580c",
  },
  3: {
    id: 3,
    label: "Đã đặt trước",
    icon: "🟡",
    color: "#d97706",
  },
};

function RoomList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null); // null = Tất cả
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Tải danh sách phòng
      const roomsResponse = await fetch("http://localhost:5097/api/rooms", {
        credentials: "include",
      });

      if (!roomsResponse.ok) {
        throw new Error("Không thể tải danh sách phòng.");
      }

      const roomsData = await roomsResponse.json();
      setRooms(roomsData);

      // 2. Tải số lượng phòng gom nhóm theo trạng thái
      try {
        const countResponse = await fetch(
          "http://localhost:5097/api/rooms/status-count",
          { credentials: "include" }
        );
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setStatusCounts(countData);
        }
      } catch (countErr) {
        console.warn("Lỗi tải status-count:", countErr);
      }

      // 3. Tải active bookings nếu có
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

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
          setActiveBookings([]);
        }
      } catch (bookingError) {
        console.warn("Lỗi khi tải booking:", bookingError);
        setActiveBookings([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu phòng:", err);
      setError("Không thể kết nối đến máy chủ Backend.");
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
    if (Number.isNaN(date.getTime())) return "--";

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
          badgeClass: "badge-available",
          booking: null,
        };
      case 1:
        return {
          className: "occupied",
          statusText: "Đang có khách",
          badgeClass: "badge-occupied",
          booking,
        };
      case 2:
        return {
          className: "maintenance",
          statusText: "Bảo trì",
          badgeClass: "badge-maintenance",
          booking: null,
        };
      case 3:
        return {
          className: "reserved",
          statusText: "Đã đặt trước",
          badgeClass: "badge-reserved",
          booking: null,
        };
      default:
        return {
          className: "other",
          statusText: "Khác",
          badgeClass: "badge-other",
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
      const response = await fetch(`http://localhost:5097/api/rooms/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Không thể xóa phòng.");
        return;
      }

      alert(data.message || "Xóa phòng thành công.");
      setRooms((currentRooms) => currentRooms.filter((room) => room.id !== id));
      loadData();
    } catch (err) {
      console.error("Lỗi khi xóa phòng:", err);
      alert("Không thể kết nối đến máy chủ.");
    }
  };

  // Lấy số lượng phòng theo status
  const getCountForStatus = (statusId) => {
    if (statusId === null) return rooms.length;
    const foundFromApi = statusCounts.find((item) => item.status === statusId);
    if (foundFromApi !== undefined) return foundFromApi.count;
    return rooms.filter((r) => r.status === statusId).length;
  };

  // Toggle lọc theo trạng thái
  const handleStatusFilterClick = (statusId) => {
    if (selectedStatus === statusId) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(statusId);
    }
  };

  // Danh sách tầng có trong phòng
  const availableFloors = Array.from(
    new Set(rooms.map((r) => r.floor))
  ).sort((a, b) => a - b);

  // Lọc theo trạng thái, tìm kiếm và tầng
  const filteredRooms = rooms.filter((room) => {
    const matchesStatus =
      selectedStatus === null ? true : room.status === selectedStatus;

    const matchesFloor =
      floorFilter === "all" ? true : String(room.floor) === String(floorFilter);

    const matchesSearch =
      !searchQuery.trim() ||
      room.roomNumber
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase()) ||
      (room.roomType?.name &&
        room.roomType.name
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())) ||
      (room.note &&
        room.note.toLowerCase().includes(searchQuery.trim().toLowerCase()));

    return matchesStatus && matchesFloor && matchesSearch;
  });

  if (loading) {
    return (
      <div className="room-list-page">
        <div className="room-loading">
          <div className="luxury-spinner"></div>
          <p>Đang tải dữ liệu phòng & trạng thái...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-list-page">
        <div className="room-error-box">
          <p>⚠️ {error}</p>
          <button className="retry-btn" onClick={loadData}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-list-page">
      {/* HEADER SECTION */}
      <div className="room-list-header">
        <div className="header-titles">
          <h1>Danh Sách Phòng Khách Sạn</h1>
          <p>Quản lý trạng thái, hình ảnh và hoạt động phòng nghỉ theo thời gian thực</p>
        </div>

        {/* CÔNG CỤ TÌM KIẾM & LỌC TẦNG & THÊM PHÒNG */}
        <div className="header-toolbar">
          <div className="floor-filter-box">
            <span>Tầng:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="floor-select"
            >
              <option value="all">Tất cả tầng</option>
              {availableFloors.map((fl) => (
                <option key={fl} value={fl}>
                  Tầng {fl}
                </option>
              ))}
            </select>
          </div>

          <div className="header-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="room-search-input"
              placeholder="Tìm theo số phòng, hạng phòng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          <Link to="/rooms/add" className="btn-add-room-header">
            ➕ Thêm phòng
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* HÀNG THẺ LỌC TRẠNG THÁI: CLICK VÀO SỐ LƯỢNG ĐỂ LỌC */}
      {/* ======================================================== */}
      <div className="status-filter-container">
        <div className="status-cards-row">
          {/* 1. TẤT CẢ PHÒNG */}
          <div
            className={`status-metric-card card-all ${
              selectedStatus === null ? "active" : ""
            }`}
            onClick={() => setSelectedStatus(null)}
          >
            <div className="metric-header">
              <span className="metric-icon">🏢</span>
              <span className="metric-title">Tất cả</span>
            </div>
            <div className="metric-body">
              <span className="metric-count">{getCountForStatus(null)}</span>
              <span className="metric-label">phòng</span>
            </div>
            {selectedStatus === null && (
              <span className="metric-pill">Đang xem tất cả</span>
            )}
          </div>

          {/* 2. PHÒNG TRỐNG */}
          <div
            className={`status-metric-card card-available ${
              selectedStatus === 0 ? "active" : ""
            }`}
            onClick={() => handleStatusFilterClick(0)}
          >
            <div className="metric-header">
              <span className="metric-icon">🟢</span>
              <span className="metric-title">Phòng trống</span>
            </div>
            <div className="metric-body">
              <span className="metric-count">{getCountForStatus(0)}</span>
              <span className="metric-label">phòng</span>
            </div>
            {selectedStatus === 0 && (
              <span className="metric-pill">Đang lọc</span>
            )}
          </div>

          {/* 3. ĐANG CÓ KHÁCH */}
          <div
            className={`status-metric-card card-occupied ${
              selectedStatus === 1 ? "active" : ""
            }`}
            onClick={() => handleStatusFilterClick(1)}
          >
            <div className="metric-header">
              <span className="metric-icon">🔴</span>
              <span className="metric-title">Đang có khách</span>
            </div>
            <div className="metric-body">
              <span className="metric-count">{getCountForStatus(1)}</span>
              <span className="metric-label">phòng</span>
            </div>
            {selectedStatus === 1 && (
              <span className="metric-pill">Đang lọc</span>
            )}
          </div>

          {/* 4. BẢO TRÌ */}
          <div
            className={`status-metric-card card-maintenance ${
              selectedStatus === 2 ? "active" : ""
            }`}
            onClick={() => handleStatusFilterClick(2)}
          >
            <div className="metric-header">
              <span className="metric-icon">🛠️</span>
              <span className="metric-title">Đang bảo trì</span>
            </div>
            <div className="metric-body">
              <span className="metric-count">{getCountForStatus(2)}</span>
              <span className="metric-label">phòng</span>
            </div>
            {selectedStatus === 2 && (
              <span className="metric-pill">Đang lọc</span>
            )}
          </div>

          {/* 5. ĐÃ ĐẶT TRƯỚC */}
          <div
            className={`status-metric-card card-reserved ${
              selectedStatus === 3 ? "active" : ""
            }`}
            onClick={() => handleStatusFilterClick(3)}
          >
            <div className="metric-header">
              <span className="metric-icon">🟡</span>
              <span className="metric-title">Đã đặt trước</span>
            </div>
            <div className="metric-body">
              <span className="metric-count">{getCountForStatus(3)}</span>
              <span className="metric-label">phòng</span>
            </div>
            {selectedStatus === 3 && (
              <span className="metric-pill">Đang lọc</span>
            )}
          </div>
        </div>
      </div>

      {/* THANH THÔNG TIN LỌC HIỆN TẠI */}
      <div className="filter-summary-bar">
        <div className="summary-left">
          <span className="summary-result-count">
            Tìm thấy <strong>{filteredRooms.length}</strong> / {rooms.length} phòng
          </span>

          {selectedStatus !== null && (
            <span className="active-tag tag-status">
              Trạng thái: <strong>{STATUS_CONFIG[selectedStatus]?.label}</strong>
              <button
                type="button"
                onClick={() => setSelectedStatus(null)}
                title="Bỏ lọc trạng thái"
              >
                ✕
              </button>
            </span>
          )}

          {floorFilter !== "all" && (
            <span className="active-tag tag-floor">
              Tầng: <strong>Tầng {floorFilter}</strong>
              <button
                type="button"
                onClick={() => setFloorFilter("all")}
                title="Bỏ lọc tầng"
              >
                ✕
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="active-tag tag-search">
              Từ khóa: &quot;{searchQuery}&quot;
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="Xóa từ khóa"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {(selectedStatus !== null || floorFilter !== "all" || searchQuery) && (
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              setSelectedStatus(null);
              setFloorFilter("all");
              setSearchQuery("");
            }}
          >
            🔄 Hiển thị tất cả
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* DANH SÁCH PHÒNG KÈM HÌNH ẢNH SANG TRỌNG */}
      {/* ======================================================== */}
      {filteredRooms.length === 0 ? (
        <div className="room-empty-luxury">
          <div className="empty-icon-box">🛏️</div>
          <h3>Không có phòng nào thỏa mãn điều kiện</h3>
          <p>
            {selectedStatus !== null
              ? `Không tìm thấy phòng thuộc trạng thái "${STATUS_CONFIG[selectedStatus]?.label}".`
              : "Vui lòng thử tìm kiếm với từ khóa hoặc bộ lọc khác."}
          </p>
          <button
            type="button"
            className="btn-reset-luxury"
            onClick={() => {
              setSelectedStatus(null);
              setFloorFilter("all");
              setSearchQuery("");
            }}
          >
            Quay lại tất cả phòng
          </button>
        </div>
      ) : (
        <div className="luxury-room-grid">
          {filteredRooms.map((room) => {
            const info = getRoomInfo(room);
            const imageUrl = getRoomImage(room);

            return (
              <div
                key={room.id}
                className={`luxury-room-card card-border-${info.className}`}
              >
                {/* ẢNH PHÒNG & BADGES ĐẶT NỔI */}
                <div className="card-image-wrapper">
                  <img
                    src={imageUrl}
                    alt={`Phòng ${room.roomNumber}`}
                    className="card-room-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGES.default;
                    }}
                  />
                  <div className="image-overlay-gradient"></div>

                  {/* BADGE SỐ PHÒNG & TẦNG (GÓC TRÁI TRÊN) */}
                  <div className="floating-room-badge">
                    <span className="room-tag">PHÒNG</span>
                    <strong className="room-num">{room.roomNumber}</strong>
                    <span className="floor-tag">• Tầng {room.floor}</span>
                  </div>

                  {/* BADGE TRẠNG THÁI (GÓC PHẢI TRÊN) */}
                  <div className={`floating-status-badge ${info.badgeClass}`}>
                    <span className="status-dot"></span>
                    <span>{info.statusText}</span>
                  </div>

                  {/* GIÁ PHÒNG NỔI BẬT TRÊN GÓC DƯỚI CỦA ẢNH */}
                  {room.roomType?.pricePerNight && (
                    <div className="floating-price-badge">
                      <strong>
                        {Number(room.roomType.pricePerNight).toLocaleString("vi-VN")}{" "}
                        ₫
                      </strong>
                      <small>/đêm</small>
                    </div>
                  )}
                </div>

                {/* NỘI DUNG THẺ */}
                <div className="card-content-body">
                  <div className="room-type-row">
                    <h3 className="room-type-title">
                      {room.roomType?.name || "Phòng Tiêu Chuẩn"}
                    </h3>
                    {room.roomType?.capacity && (
                      <span className="capacity-pill" title="Sức chứa tối đa">
                        👤 {room.roomType.capacity} khách
                      </span>
                    )}
                  </div>

                  {/* TIỆN ÍCH PHÒNG NHANH */}
                  <div className="room-amenities">
                    <span className="amenity-item">📶 WiFi 5G</span>
                    <span className="amenity-item">❄️ Điều hòa</span>
                    <span className="amenity-item">🚿 Nước nóng</span>
                  </div>

                  {/* KHỐI THÔNG TIN KHÁCH THUÊ (NẾU ĐANG CÓ NGƯỜI THUÊ) */}
                  {info.booking && (
                    <div className="active-guest-banner">
                      <div className="guest-header">
                        <span className="guest-icon">👤</span>
                        <strong>Khách đang ở:</strong>{" "}
                        <span className="guest-name">
                          {info.booking.customerName || "Khách lưu trú"}
                        </span>
                      </div>
                      <div className="guest-dates">
                        <div>
                          <span>Check-in:</span>{" "}
                          <strong>{formatDateTime(info.booking.checkInDate)}</strong>
                        </div>
                        <div>
                          <span>Check-out:</span>{" "}
                          <strong>
                            {formatDateTime(
                              info.booking.actualCheckOutDate ||
                                info.booking.expectedCheckOutDate
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GHI CHÚ NẾU CÓ */}
                  {room.note && (
                    <div className="room-note-pill">
                      <span>📌</span>
                      <em>{room.note}</em>
                    </div>
                  )}
                </div>

                {/* THAO TÁC / NÚT HÀNH ĐỘNG */}
                <div className="card-action-footer">
                  {room.status === 0 ? (
                    <button
                      type="button"
                      className="btn-action btn-rent"
                      onClick={() => navigate(`/rent-room`)}
                      title="Thuê phòng này"
                    >
                      🔑 Thuê phòng
                    </button>
                  ) : room.status === 1 ? (
                    <button
                      type="button"
                      className="btn-action btn-checkout"
                      onClick={() => navigate(`/checkout`)}
                      title="Trả phòng này"
                    >
                      ↩️ Trả phòng
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-action btn-view"
                      onClick={() =>
                        alert(
                          `Phòng ${room.roomNumber} đang ở trạng thái: ${info.statusText}`
                        )
                      }
                    >
                      ℹ️ Chi tiết
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-action-delete"
                    onClick={() => handleDelete(room.id)}
                    title="Xóa phòng khỏi hệ thống"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RoomList;