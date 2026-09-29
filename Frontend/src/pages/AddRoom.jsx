import { useState } from "react";

function AddRoom() {
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "",
    price: "",
    capacity: "",
    description: "",
    imageUrl: "",
    status: "Available",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.roomNumber ||
      !formData.roomType ||
      !formData.price ||
      !formData.capacity
    ) {
      setMessage("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    const roomData = {
      roomNumber: formData.roomNumber,
      roomType: formData.roomType,
      price: Number(formData.price),
      capacity: Number(formData.capacity),
      description: formData.description,
      imageUrl: formData.imageUrl,
      status: formData.status,
    };

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("http://localhost:5097/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error("Không thể thêm phòng.");
      }

      setMessage("Thêm phòng thành công!");

      setFormData({
        roomNumber: "",
        roomType: "",
        price: "",
        capacity: "",
        description: "",
        imageUrl: "",
        status: "Available",
      });
    } catch (error) {
      console.error(error);
      setMessage("Có lỗi xảy ra khi thêm phòng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-room-page">
      <div className="page-heading">
        <div>
          <h1>Thêm mới phòng</h1>
          <p>Nhập thông tin phòng cho thuê vào hệ thống</p>
        </div>

        <span className="page-badge">Quản lý phòng</span>
      </div>

      <div className="room-form-card">
        <div className="form-card-header">
          <h2>Thông tin phòng</h2>
          <p>Các trường có dấu * là bắt buộc.</p>
        </div>

        {message && <div className="form-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group">
              <label>Số phòng *</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="Ví dụ: 101"
              />
            </div>

            <div className="form-group">
              <label>Loại phòng *</label>
              <select
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
              >
                <option value="">-- Chọn loại phòng --</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div className="form-group">
              <label>Giá phòng *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                placeholder="Ví dụ: 500000"
              />
            </div>

            <div className="form-group">
              <label>Số người tối đa *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                max="20"
                placeholder="Ví dụ: 2"
              />
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Available">Phòng trống</option>
                <option value="Occupied">Đang thuê</option>
                <option value="Maintenance">Bảo trì</option>
              </select>
            </div>

            <div className="form-group">
              <label>URL hình ảnh</label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="Nhập đường dẫn hình ảnh"
              />
            </div>

            <div className="form-group form-full">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="Nhập mô tả phòng..."
              />
            </div>

          </div>

          <div className="form-actions">
            <button
              type="reset"
              className="btn-cancel"
              onClick={() =>
                setFormData({
                  roomNumber: "",
                  roomType: "",
                  price: "",
                  capacity: "",
                  description: "",
                  imageUrl: "",
                  status: "Available",
                })
              }
            >
              Làm mới
            </button>

            <button
              type="submit"
              className="btn-save"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "+ Thêm phòng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRoom;