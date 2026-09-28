function RoomList() {
  const rooms = [
    {
      id: 1,
      code: "P101",
      status: "Trống",
      checkIn: "--",
      checkOut: "--",
    },
    {
      id: 2,
      code: "P102",
      status: "Đang thuê",
      checkIn: "14:00",
      checkOut: "12:00",
    },
    {
      id: 3,
      code: "P103",
      status: "Trống",
      checkIn: "--",
      checkOut: "--",
    },
    {
      id: 4,
      code: "P104",
      status: "Đang thuê",
      checkIn: "15:00",
      checkOut: "12:00",
    },
  ]

  return (
    <div style={{ padding: "24px" }}>
      <h1>Danh sách phòng</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {rooms.map((room) => (
          <div
            key={room.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              backgroundColor:
                room.status === "Trống" ? "#e8f5e9" : "#ffebee",
            }}
          >
            <h2>{room.code}</h2>

            <p>
              <strong>Trạng thái:</strong>{" "}
              <span
                style={{
                  color: room.status === "Trống" ? "green" : "red",
                  fontWeight: "bold",
                }}
              >
                {room.status}
              </span>
            </p>

            <p>
              <strong>Giờ vào:</strong> {room.checkIn}
            </p>

            <p>
              <strong>Giờ ra:</strong> {room.checkOut}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RoomList