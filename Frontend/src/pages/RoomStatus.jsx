import { useEffect, useState } from "react";
import "./RoomStatus.css";

const STATUS_MAP = {
  0: {
    name: "Phòng trống",
    eng: "Available",
    badgeClass: "badge-available",
    cardClass: "card-available",
    icon: "🟢",
    desc: "Sẵn sàng đón khách mới",
  },
  1: {
    name: "Đang có khách",
    eng: "Occupied",
    badgeClass: "badge-occupied",
    cardClass: "card-occupied",
    icon: "🔴",
    desc: "Khách đang lưu trú",
  },
  2: {
    name: "Đang bảo trì",
    eng: "Maintenance",
    badgeClass: "badge-maintenance",
    cardClass: "card-maintenance",
    icon: "🛠️",
    desc: "Đang sửa chữa / vệ sinh",
  },
  3: {
    name: "Đã đặt trước",
    eng: "Reserved",
    badgeClass: "badge-reserved",
    cardClass: "card-reserved",
    icon: "🟡",
    desc: "Chờ khách làm thủ tục nhận phòng",
  },
};

function RoomStatus() {
  const [statusCounts, setStatusCounts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null); // null = tất cả
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Lấy dữ liệu gom nhóm số lượng theo trạng thái
      const countRes = await fetch("http://localhost:5097/api/rooms/status-count", {
        credentials: "include",
      });

      if (!countRes.ok) {
        throw new Error("Không thể tải thống kê trạng thái phòng.");
      }
      const countData = await countRes.json();
      setStatusCounts(countData);

      // 2. Lấy toàn bộ danh sách phòng
      const roomsRes = await fetch("http://localhost:5097/api/rooms", {
        credentials: "include",
      });

      if (!roomsRes.ok) {
        throw new Error("Không thể tải danh sách phòng.");
      }
      const roomsData = await roomsRes.json();
      setRooms(roomsData);
    } catch (err) {
      console.error("Lỗi tải dữ liệu trạng thái phòng:", err);
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalRooms = rooms.length;

  // Lọc phòng theo trạng thái đã click chọn
  const filteredRooms =
    selectedStatus === null
      ? rooms
      : rooms.filter((room) => room.status === selectedStatus);

  if (loading) {
    return (
      <div className="status-page-container">
        <div className="status-loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu trạng thái phòng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-page-container">
        <div className="status-error-alert">
          <p>⚠️ {error}</p>
          <button onClick={fetchData}>Tải lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="status-page-container">
      {/* HEADER */}
      <div className="status-page-header">
        <div>
          <h1>Trạng thái phòng</h1>
          <p>Theo dõi tỷ lệ và danh sách phòng theo từng trạng thái vận hành</p>
        </div>
        <div className="total-rooms-badge">
          <span>Tổng số phòng:</span>
          <strong>{totalRooms}</strong>
        </div>
      </div>

      {/* BANNER THỐNG KÊ & CLICK ĐỂ LỌC */}
      <div className="status-overview-section">
        <div className="overview-title">
          <span>BẢNG THỐNG KÊ SỐ LƯỢNG:</span>
          <small>Nhấp chuột vào từng thẻ trạng thái để xem danh sách phòng</small>
        </div>

        <div className="overview-cards">
          {/* Nút Xem tất cả */}
          <div
            className={`overview-card card-all ${
              selectedStatus === null ? "active" : ""
            }`}
            onClick={() => setSelectedStatus(null)}
          >
            <div className="card-header">
              <span className="card-icon">🏨</span>
              <span className="card-title">Tất cả phòng</span>
            </div>
            <div className="card-number">{totalRooms}</div>
            <div className="card-footer">
              <span>Toàn bộ hệ thống</span>
              {selectedStatus === null && <span className="active-badge">✓ Đang xem</span>}
            </div>
          </div>

          {/* Các thẻ theo từng trạng thái */}
          {statusCounts.map((item) => {
            const config = STATUS_MAP[item.status] || {
              name: item.displayName || item.statusName,
              cardClass: "card-other",
              badgeClass: "badge-other",
              icon: "📌",
              desc: "",
            };

            const isSelected = selectedStatus === item.status;

            return (
              <div
                key={item.status}
                className={`overview-card ${config.cardClass} ${
                  isSelected ? "active" : ""
                }`}
                onClick={() =>
                  setSelectedStatus(isSelected ? null : item.status)
                }
              >
                <div className="card-header">
                  <span className="card-icon">{config.icon}</span>
                  <span className="card-title">{config.name}</span>
                </div>
                <div className="card-number">{item.count}</div>
                <div className="card-footer">
                  <span>{config.desc}</span>
                  {isSelected && <span className="active-badge">✓ Đang lọc</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DANH SÁCH PHÒNG THEO TRẠNG THÁI ĐÃ CHỌN */}
      <div className="status-rooms-section">
        <div className="section-header">
          <h2>
            Danh sách phòng{" "}
            {selectedStatus !== null ? (
              <span className="current-status-title">
                — {STATUS_MAP[selectedStatus]?.name} ({filteredRooms.length} phòng)
              </span>
            ) : (
              <span>(Tất cả {totalRooms} phòng)</span>
            )}
          </h2>

          {selectedStatus !== null && (
            <button
              className="btn-clear-status"
              onClick={() => setSelectedStatus(null)}
            >
              Hiển thị tất cả phòng
            </button>
          )}
        </div>

        {filteredRooms.length === 0 ? (
          <div className="no-rooms-box">
            <p>
              Không có phòng nào thuộc trạng thái &quot;
              {STATUS_MAP[selectedStatus]?.name}&quot;.
            </p>
          </div>
        ) : (
          <div className="status-rooms-grid">
            {filteredRooms.map((room) => {
              const statusInfo = STATUS_MAP[room.status] || {
                name: "Không xác định",
                badgeClass: "badge-other",
              };

              return (
                <div key={room.id} className="status-room-card">
                  <div className="status-room-top">
                    <span className="room-num">Phòng {room.roomNumber}</span>
                    <span className={`status-badge ${statusInfo.badgeClass}`}>
                      {statusInfo.name}
                    </span>
                  </div>

                  <div className="status-room-body">
                    <p>
                      <strong>Tầng:</strong> Tầng {room.floor}
                    </p>
                    {room.roomType && (
                      <p>
                        <strong>Loại phòng:</strong> {room.roomType.name}
                      </p>
                    )}
                    {room.roomType?.pricePerNight && (
                      <p>
                        <strong>Đơn giá:</strong>{" "}
                        {Number(room.roomType.pricePerNight).toLocaleString("vi-VN")} đ/đêm
                      </p>
                    )}
                    {room.note && (
                      <p className="room-note-text">
                        <strong>Ghi chú:</strong> {room.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomStatus;
