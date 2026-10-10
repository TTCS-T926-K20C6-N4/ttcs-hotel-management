
import { useEffect, useState } from 'react'

function IncomeStatistics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadIncome = async () => {
      try {
        const response = await fetch(
          'http://localhost:5097/api/statistics/income',
          { credentials: 'include' }
        )

        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu thu nhập')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadIncome()
  }, [])

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString('vi-VN') + ' ₫'

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <h2 style={styles.title}>Thống kê thu nhập</h2>
        <p style={styles.subtitle}>
          Theo dõi doanh thu khách sạn theo 12 tháng của năm hiện tại.
        </p>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}

      {error && (
        <p style={{ color: '#dc2626' }}>{error}</p>
      )}

      {!loading && !error && data && (
        <>
          <div style={styles.summary}>
            <div>
              <div style={styles.summaryLabel}>
                TỔNG DOANH THU NĂM {data.year}
              </div>
              <div style={styles.summaryAmount}>
                {formatMoney(data.totalAmount)}
              </div>
              <div style={styles.summaryNote}>
                Tổng thu nhập từ tháng 1 đến tháng 12
              </div>
            </div>

            <div style={styles.yearTag}>
              Năm {data.year}
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeading}>
              <div>
                <h3 style={styles.tableTitle}>
                  Chi tiết doanh thu
                </h3>
                <p style={styles.tableSubtitle}>
                  Báo cáo thu nhập theo từng tháng
                </p>
              </div>

              <span style={styles.monthTag}>12 tháng</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.numberHeader}>STT</th>
                    <th style={styles.header}>Tháng</th>
                    <th style={styles.moneyHeader}>Tổng tiền</th>
                  </tr>
                </thead>

                <tbody>
                  {data.months.map((item, index) => (
                    <tr
                      key={item.month}
                      style={{
                        background:
                          index % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <td style={styles.numberCell}>
                        {String(index + 1).padStart(2, '0')}
                      </td>

                      <td style={styles.cell}>
                        Tháng {item.month}
                      </td>

                      <td
                        style={{
                          ...styles.moneyCell,
                          color:
                            item.totalAmount > 0
                              ? '#1d4ed8'
                              : '#64748b',
                          fontWeight:
                            item.totalAmount > 0 ? 700 : 400
                        }}
                      >
                        {formatMoney(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr style={styles.totalRow}>
                    <td style={styles.totalCell}></td>
                    <td style={styles.totalCell}>
                      Tổng thu nhập 12 tháng
                    </td>
                    <td style={styles.totalMoney}>
                      {formatMoney(data.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  page: {
    padding: '28px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  heading: {
    marginBottom: '24px'
  },
  title: {
    margin: '0 0 8px',
    fontSize: '26px',
    fontWeight: 700,
    color: '#142b49'
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: '14px'
  },
  summary: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderLeft: '4px solid #2563eb',
    borderRadius: '12px',
    padding: '22px 26px',
    marginBottom: '22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.03)'
  },
  summaryLabel: {
    fontSize: '12px',
    letterSpacing: '1px',
    fontWeight: 700,
    color: '#64748b'
  },
  summaryAmount: {
    fontSize: '30px',
    fontWeight: 750,
    color: '#172b4d',
    marginTop: '10px'
  },
  summaryNote: {
    color: '#94a3b8',
    fontSize: '13px',
    marginTop: '6px'
  },
  yearTag: {
    background: '#eff6ff',
    color: '#2563eb',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600
  },
  tableCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 3px 12px rgba(0,0,0,0.03)'
  },
  tableHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px'
  },
  tableTitle: {
    margin: '0 0 5px',
    fontSize: '19px',
    color: '#172b4d'
  },
  tableSubtitle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '13px'
  },
  monthTag: {
    padding: '7px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '7px',
    color: '#64748b',
    fontSize: '13px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '420px'
  },
  header: {
    background: '#eef2f7',
    color: '#334155',
    padding: '14px 18px',
    textAlign: 'left',
    fontSize: '14px'
  },
  numberHeader: {
    background: '#eef2f7',
    color: '#334155',
    padding: '14px 18px',
    textAlign: 'center',
    width: '70px',
    fontSize: '14px'
  },
  moneyHeader: {
    background: '#eef2f7',
    color: '#334155',
    padding: '14px 18px',
    textAlign: 'right',
    fontSize: '14px'
  },
  numberCell: {
    padding: '13px 18px',
    textAlign: 'center',
    color: '#94a3b8',
    borderBottom: '1px solid #e9edf3'
  },
  cell: {
    padding: '13px 18px',
    color: '#334155',
    borderBottom: '1px solid #e9edf3'
  },
  moneyCell: {
    padding: '13px 18px',
    textAlign: 'right',
    borderBottom: '1px solid #e9edf3'
  },
  totalRow: {
    background: '#e8f1ff'
  },
  totalCell: {
    padding: '16px 18px',
    fontWeight: 700,
    color: '#172b4d'
  },
  totalMoney: {
    padding: '16px 18px',
    textAlign: 'right',
    fontWeight: 700,
    color: '#1d4ed8'
  }
}

export default IncomeStatistics
