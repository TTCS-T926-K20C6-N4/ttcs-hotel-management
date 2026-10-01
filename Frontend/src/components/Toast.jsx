import { useEffect } from 'react'

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return

    const timer = setTimeout(() => {
      onClose?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const isError = type === 'error'

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        minWidth: '280px',
        maxWidth: '420px',
        padding: '14px 16px',
        borderRadius: '8px',
        background: isError ? '#dc3545' : '#198754',
        color: '#fff',
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <span>{message}</span>

      <button
        type="button"
        onClick={onClose}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          padding: 0,
        }}
        aria-label="Đóng"
      >
        ×
      </button>
    </div>
  )
}

export default Toast