import { useEffect, useMemo, useState } from "react";

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5097/api/rooms", {
  method: "GET",
  credentials: "include",
});

        if (!response.ok) {
          throw new Error(`Không thể tải danh sách phòng (${response.status})`);
        }

        const data = await response.json();
        setRooms(data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách phòng.");
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const keyword = search.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        room.roomNumber?.toLowerCase().includes(keyword) ||
        room.roomType?.name?.toLowerCase().includes(keyword);

      const matchStatus =
        status === "All" || room.status === status;

      return matchSearch && matchStatus;
    });
  }, [rooms, search, status]);

  const statusInfo = {
    Available: {
      text: "Phòng trống",
      background: "#dcfce7",
      color: "#15803d",
    },
    Occupied: {
      text: "Đang thuê",
      background: "#fee2e2",
      color: "#dc2626",
    },
    Reserved: {
      text: "Đã đặt",
      background: "#fef3c7",
      color: "#b45309",
    },
    Maintenance: {
      text: "Bảo trì",
      background: "#e5e7eb",
      color: "#4b5563",
    },
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat("vi-VN").format(value || 0) + " ₫";
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Danh sách phòng</h1>
          <p style={styles.subtitle}>
            Quản lý và theo dõi tình trạng các phòng trong khách sạn
          </p>
        </div>

        <button
          style={styles.addButton}
          onClick={() => (window.location.href = "/rooms/add")}
        >
          + Thêm phòng
        </button>
      </div>

      {/* THỐNG KÊ */}
      <div style={styles.stats}>
        <StatCard
          title="Tổng số phòng"
          value={rooms.length}
          icon="🏨"
        />

        <StatCard
          title="Phòng trống"
          value={rooms.filter((r) => r.status === "Available").length}
          icon="✅"
        />

        <StatCard
          title="Đang thuê"
          value={rooms.filter((r) => r.status === "Occupied").length}
          icon="🔑"
        />

        <StatCard
          title="Đã đặt"
          value={rooms.filter((r) => r.status === "Reserved").length}
          icon="📅"
        />
      </div>

      {/* TÌM KIẾM */}
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          type="text"
          placeholder="🔍  Tìm theo số phòng hoặc loại phòng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Available">Phòng trống</option>
          <option value="Occupied">Đang thuê</option>
          <option value="Reserved">Đã đặt</option>
          <option value="Maintenance">Bảo trì</option>
        </select>
      </div>

      {/* DANH SÁCH */}
      <div style={styles.content}>
        {loading && (
          <div style={styles.message}>
            Đang tải danh sách phòng...
          </div>
        )}

        {!loading && error && (
          <div style={styles.error}>{error}</div>
        )}

        {!loading && !error && filteredRooms.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: "45px" }}>🏨</div>
            <h3>Chưa có phòng</h3>
            <p>Không tìm thấy phòng phù hợp.</p>
          </div>
        )}

        {!loading && !error && filteredRooms.length > 0 && (
          <div style={styles.grid}>
            {filteredRooms.map((room) => {
              const currentStatus =
                statusInfo[room.status] || statusInfo.Available;

              return (
                <div key={room.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.roomLabel}>PHÒNG</div>
                      <div style={styles.roomNumber}>
                        {room.roomNumber}
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.badge,
                        background: currentStatus.background,
                        color: currentStatus.color,
                      }}
                    >
                      {currentStatus.text}
                    </span>
                  </div>

                  <div style={styles.divider} />

                 <div style={styles.infoRow}>
  <span>🕐 Giờ vào</span>
  <strong>
    {room.currentBooking?.checkIn
      ? new Date(room.currentBooking.checkIn).toLocaleString("vi-VN")
      : "--"}
  </strong>
</div>

<div style={styles.infoRow}>
  <span>🕐 Giờ ra</span>
  <strong>
    {room.currentBooking?.checkOut
      ? new Date(room.currentBooking.checkOut).toLocaleString("vi-VN")
      : "--"}
  </strong>
</div>

                  <div style={styles.infoRow}>
                    <span>🏷️ Loại phòng</span>
                    <strong>
                      {room.roomType?.name || "Chưa xác định"}
                    </strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>🏢 Tầng</span>
                    <strong>{room.floor}</strong>
                  </div>

                  <div style={styles.infoRow}>
                    <span>👥 Sức chứa</span>
                    <strong>
                      {room.roomType?.capacity || 0} người
                    </strong>
                  </div>

                  <div style={styles.priceBox}>
                    <span>Giá phòng / đêm</span>
                    <strong>
                      {formatMoney(room.roomType?.pricePerNight)}
                    </strong>
                  </div>

                  {room.note && (
                    <div style={styles.note}>
                      📝 {room.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>

      <div>
        <div style={styles.statTitle}>{title}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "32px",
    minHeight: "100%",
    background: "#f5f7fb",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#172033",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
  },

  addButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "12px 20px",
    borderRadius: "9px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  statCard: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    gap: "15px",
    alignItems: "center",
    border: "1px solid #e5e7eb",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },

  statTitle: {
    color: "#64748b",
    fontSize: "14px",
  },

  statValue: {
    color: "#172033",
    fontSize: "26px",
    fontWeight: 700,
    marginTop: "3px",
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    background: "white",
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px 12px 0 0",
  },

  search: {
    flex: 1,
    padding: "12px 15px",
    border: "1px solid #dbe1ea",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
  },

  select: {
    width: "200px",
    padding: "12px",
    border: "1px solid #dbe1ea",
    borderRadius: "8px",
    background: "white",
  },

  content: {
    background: "white",
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderTop: "none",
    borderRadius: "0 0 12px 12px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: "18px",
  },

  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    background: "#fff",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  roomLabel: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
  },

  roomNumber: {
    fontSize: "28px",
    fontWeight: 750,
    color: "#1e293b",
    marginTop: "2px",
  },

  badge: {
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },

  divider: {
    height: "1px",
    background: "#edf0f4",
    margin: "17px 0",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#64748b",
  },

  priceBox: {
    marginTop: "16px",
    padding: "13px",
    background: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    color: "#475569",
    fontSize: "14px",
  },

  note: {
    marginTop: "12px",
    fontSize: "13px",
    color: "#64748b",
  },

  message: {
    textAlign: "center",
    padding: "50px",
    color: "#64748b",
  },

  error: {
    padding: "18px",
    borderRadius: "8px",
    background: "#fef2f2",
    color: "#b91c1c",
  },

  empty: {
    padding: "60px",
    textAlign: "center",
    color: "#64748b",
  },
};

export default RoomList;