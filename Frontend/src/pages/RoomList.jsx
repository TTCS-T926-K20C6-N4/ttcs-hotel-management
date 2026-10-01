import { useEffect, useState } from "react";
import { Link } from 'react-router-dom'

function RoomList() {
  const [rooms, setRooms] = useState([]);

  const loadRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/rooms");
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phòng:", error);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa phòng này không?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/rooms/${id}`,
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

  return (
    <div>
      <h1>Danh sách phòng</h1>

      {rooms.length === 0 ? (
        <p>Chưa có phòng.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Số phòng</th>
              <th>Tầng</th>
              <th>Loại phòng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.roomNumber}</td>
                <td>{room.floor}</td>
                <td>{room.roomType?.name || "Chưa có"}</td>
                <td>{room.status}</td>
                <td>
                  <button onClick={() => handleDelete(room.id)}>
                    Xóa
                  </button>
                  <Link to={`/rooms/${room.id}/edit`} style={{ marginLeft: '8px' }}>
                    Sửa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RoomList;