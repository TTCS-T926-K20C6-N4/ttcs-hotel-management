import { useEffect, useState } from "react";

function RoomStatus() {
  const [statusCounts, setStatusCounts] = useState([]);
  const [rooms, setRooms] = useState([]);
const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStatusCounts = async () => {
      try {
        const response = await fetch(
          "http://localhost:5097/api/rooms/status-count",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Không thể tải trạng thái phòng.");
        }

        const data = await response.json();
        setStatusCounts(data);
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStatusCounts();
  }, []);

  if (loading) {
    return <div>Đang tải trạng thái phòng...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const totalRooms = statusCounts.reduce(
    (total, item) => total + item.count,
    0
  );
const filteredRooms = selectedStatus === null
  ? rooms
  : rooms.filter((room) => room.status === selectedStatus);
  return (
    <div>
      <h1>Trạng thái phòng</h1>
      <p>Theo dõi số lượng phòng theo từng trạng thái.</p>

      <h2>Tổng số phòng: {totalRooms}</h2>

      <div>
       {statusCounts.map((item) => (
  <div
    key={item.status}
    onClick={() => setSelectedStatus(item.status)}
    style={{ cursor: "pointer" }}
  >
    <h3>{item.statusName}</h3>
    <strong>{item.count}</strong>
  </div>
))}
      </div>
      <h2>Danh sách phòng</h2>

{filteredRooms.length === 0 ? (
  <p>Không có phòng thuộc trạng thái này.</p>
) : (
  <div>
    {filteredRooms.map((room) => (
      <div key={room.id}>
        <strong>Phòng {room.roomNumber}</strong>
        <p>Tầng: {room.floor}</p>
        <p>Trạng thái: {room.status}</p>
      </div>
    ))}
  </div>
)}
    </div>
  );
}

export default RoomStatus;