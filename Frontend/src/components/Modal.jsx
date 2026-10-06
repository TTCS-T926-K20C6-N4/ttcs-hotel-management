import { useEffect, useId } from 'react'

const sizeWidths = {
  sm: '420px',
  md: '600px',
  lg: '800px',
}

function Modal({ title, size = 'md', onClose, footer, children }) {
  const titleId = useId()

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(15, 23, 42, 0.55)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: '100%',
          maxWidth: sizeWidths[size] || sizeWidths.md,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          borderRadius: 12,
          background: '#fff',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '18px 22px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2 id={titleId} style={{ margin: 0, fontSize: 18 }}>
            {title}
          </h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            style={{
              border: 0,
              background: 'transparent',
              color: '#64748b',
              fontSize: 24,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </header>

        <div style={{ padding: 22 }}>
          {children}
        </div>

        {footer && (
          <footer
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '14px 22px',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            {footer}
          </footer>
        )}
      </section>
    </div>
  )
}

export default Modal
