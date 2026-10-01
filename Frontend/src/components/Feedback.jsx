export function Loading({ message = 'Đang tải dữ liệu...' }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <p>{message}</p>
    </div>
  )
}

export function ErrorBox({ message = 'Có lỗi xảy ra.', onRetry }) {
  return (
    <div
      style={{
        padding: '16px',
        margin: '16px 0',
        border: '1px solid #dc3545',
        borderRadius: '8px',
      }}
    >
      <strong>Lỗi: </strong>
      <span>{message}</span>

      {onRetry && (
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onRetry}
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  )
}

export function EmptyState({ message = 'Không có dữ liệu.' }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <p>{message}</p>
    </div>
  )
}

export function StatusBadge({ status }) {
  const text = status ?? 'Không xác định'

  return (
    <span className="badge bg-secondary">
      {text}
    </span>
  )
}