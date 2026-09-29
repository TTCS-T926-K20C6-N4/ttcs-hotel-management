import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AddRoom() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "",
    price: "",
    capacity: "",
    description: "",
    status: "Available",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Giải phóng URL preview khi đổi ảnh/rời trang
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // =========================
  // THAY ĐỔI INPUT
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // CHỌN ẢNH
  // =========================
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được lớn hơn 5MB.");
      e.target.value = "";
      return;
    }

    setError("");

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // Kiểm tra dữ liệu
    if (
      !formData.roomNumber.trim() ||
      !formData.roomType ||
      !formData.price ||
      !formData.capacity
    ) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (Number(formData.price) <= 0) {
      setError("Giá phòng phải lớn hơn 0.");
      return;
    }

    if (
      Number(formData.capacity) < 1 ||
      Number(formData.capacity) > 20
    ) {
      setError("Sức chứa phải từ 1 đến 20 người.");
      return;
    }

    try {
      setSubmitting(true);

      // =========================
      // TẠO FORMDATA
      // =========================
      const data = new FormData();

      data.append(
        "RoomNumber",
        formData.roomNumber.trim()
      );

      data.append(
        "RoomType",
        formData.roomType
      );

      data.append(
        "Price",
        formData.price
      );

      data.append(
        "Capacity",
        formData.capacity
      );

      data.append(
        "Description",
        formData.description
      );

      data.append(
        "Status",
        formData.status
      );

      // Gửi file ảnh
      if (imageFile) {
        data.append(
          "Image",
          imageFile
        );
      }

      // =========================
      // GỌI API
      // =========================
      const response = await fetch(
        "http://localhost:5097/api/rooms",
        {
          method: "POST",

          // KHÔNG tự đặt Content-Type
          // Browser sẽ tự tạo multipart/form-data
          body: data,
        }
      );

      if (!response.ok) {
        const result =
          await response.json().catch(() => null);

        throw new Error(
          result?.message ||
            result?.title ||
            "Không thể thêm phòng."
        );
      }

      const createdRoom = await response.json();

      console.log(
        "Phòng vừa tạo:",
        createdRoom
      );

      setMessage("Thêm phòng thành công!");

      setTimeout(() => {
        navigate("/rooms");
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Có lỗi xảy ra khi thêm phòng."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-room-page">

      {/* ===== TIÊU ĐỀ ===== */}
      <div className="page-heading">
        <div>
          <h1>Thêm mới phòng</h1>
        </div>

        <p>Nhập thông tin phòng cho thuê mới</p>
      </div>

      {/* ===== FORM ===== */}
      <form
        className="room-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >

        {/* THÔNG BÁO LỖI */}
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* THÔNG BÁO THÀNH CÔNG */}
        {message && (
          <div className="form-success">
            {message}
          </div>
        )}

        {/* ===== HÀNG 1 ===== */}
        <div className="form-row">

          <div className="form-group">
            <label>
              Số phòng <span>*</span>
            </label>

            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              placeholder="Ví dụ: 101"
            />
          </div>

          <div className="form-group">
            <label>
              Loại phòng <span>*</span>
            </label>

            <select
              name="roomType"
              value={formData.roomType}
              onChange={handleChange}
            >
              <option value="">
                -- Chọn loại phòng --
              </option>

              <option value="Phòng đơn">
                Phòng đơn
              </option>

              <option value="Phòng đôi">
                Phòng đôi
              </option>

              <option value="Phòng VIP">
                Phòng VIP
              </option>
            </select>
          </div>

        </div>

        {/* ===== HÀNG 2 ===== */}
        <div className="form-row">

          <div className="form-group">
            <label>
              Giá phòng <span>*</span>
            </label>

            <input
              type="number"
              name="price"
              min="1"
              value={formData.price}
              onChange={handleChange}
              placeholder="Ví dụ: 500000"
            />
          </div>

          <div className="form-group">
            <label>
              Sức chứa <span>*</span>
            </label>

            <input
              type="number"
              name="capacity"
              min="1"
              max="20"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="Ví dụ: 2"
            />
          </div>

        </div>

        {/* ===== MÔ TẢ ===== */}
        <div className="form-group">
          <label>Mô tả</label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Nhập mô tả phòng..."
            rows="4"
          />
        </div>

        {/* ===== ẢNH ===== */}
        <div className="form-group">
          <label>Ảnh phòng</label>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleImageChange}
          />

          {imagePreview && (
            <div className="image-preview">

              <img
                src={imagePreview}
                alt="Xem trước phòng"
              />

              <p>
                {imageFile?.name}
              </p>

            </div>
          )}
        </div>

        {/* ===== TRẠNG THÁI ===== */}
        <div className="form-group">
          <label>Trạng thái</label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Available">
              Phòng trống
            </option>

            <option value="Maintenance">
              Bảo trì
            </option>
          </select>
        </div>

        {/* ===== BUTTON ===== */}
        <div className="form-actions">

          <button
            type="button"
            className="btn-cancel"
            disabled={submitting}
            onClick={() => navigate("/rooms")}
          >
            Hủy
          </button>

          <button
            type="submit"
            className="btn-save"
            disabled={submitting}
          >
            {submitting
              ? "Đang thêm..."
              : "+ Thêm phòng"}
          </button>

        </div>

      </form>
    </div>
  );
}

export default AddRoom;