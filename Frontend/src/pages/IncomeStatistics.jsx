
import { useEffect, useState } from 'react'

const STATISTICS_YEARS = [2026, 2025, 2024, 2023, 2022]

function IncomeStatistics() {
  const [selectedYear, setSelectedYear] = useState(() =>
    Math.min(Math.max(new Date().getFullYear(), 2022), 2026)
  )
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadIncome = async () => {
      setLoading(true)
      setError('')
      setData(null)

      try {
        const response = await fetch(
          `http://localhost:5097/api/statistics/income?year=${selectedYear}`,
          {
            credentials: 'include',
            signal: controller.signal
          }
        )

        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu thu nhập. Vui lòng thử lại.')
        }

        const result = await response.json()

        if (Number(result.year) !== selectedYear) {
          throw new Error(
            `Backend đang trả thống kê năm ${result.year} thay vì năm ${selectedYear}. Vui lòng khởi động lại Backend rồi thử lại.`
          )
        }

        setData(result)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadIncome()

    return () => controller.abort()
  }, [selectedYear])

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString('vi-VN') + ' ₫'

  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const monthData = data?.months?.find(
      (item) => Number(item.month) === month
    )

    return {
      month,
      totalAmount: Number(monthData?.totalAmount || 0)
    }
  })
  const totalAmount = months.reduce((total, item) => total + item.totalAmount, 0)

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          <h2 style={styles.title}>Thống kê thu nhập</h2>
          <p style={styles.subtitle}>
            Theo dõi doanh thu khách sạn theo từng tháng trong năm.
          </p>
        </div>

        <label style={styles.yearSelector}>
          <span style={styles.yearLabel}>Chọn năm xem</span>
          <select
            aria-label="Chọn năm xem thống kê thu nhập"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            style={styles.yearSelect}
          >
            {STATISTICS_YEARS.map((year) => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p role="status">Đang tải dữ liệu thu nhập năm {selectedYear}...</p>}

      {error && (
        <p role="alert" style={{ color: '#dc2626' }}>{error}</p>
      )}

      {!loading && !error && data && (
        <>
          <div style={styles.summary}>
            <div>
              <div style={styles.summaryLabel}>
                TỔNG DOANH THU NĂM {data.year}
              </div>
              <div style={styles.summaryAmount}>
                {formatMoney(totalAmount)}
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
                  {months.map((item, index) => (
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
                      {formatMoney(totalAmount)}
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
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
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
  yearSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#334155',
    fontSize: '14px',
    fontWeight: 600
  },
  yearLabel: {
    whiteSpace: 'nowrap'
  },
  yearSelect: {
    minWidth: '120px',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#172b4d',
    cursor: 'pointer'
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
