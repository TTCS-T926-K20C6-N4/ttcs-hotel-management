import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import notoSansBoldUrl from '../assets/fonts/NotoSans-Bold.ttf?url'
import notoSansRegularUrl from '../assets/fonts/NotoSans-Regular.ttf?url'

const STATISTICS_YEARS = [2026, 2025, 2024, 2023, 2022]

const loadFontAsBase64 = async (fontUrl) => {
  const response = await fetch(fontUrl)

  if (!response.ok) {
    throw new Error('Không tải được phông chữ tiếng Việt cho báo cáo PDF.')
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + chunkSize)
    )
  }

  return btoa(binary)
}

function IncomeStatistics() {
  const [selectedYear, setSelectedYear] = useState(() =>
    Math.min(Math.max(new Date().getFullYear(), 2022), 2026)
  )

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportError, setExportError] = useState('')

  // =====================================================
  // LOAD DATA
  // =====================================================

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
          throw new Error(
            'Không thể tải dữ liệu thu nhập. Vui lòng thử lại.'
          )
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

  // =====================================================
  // FORMAT
  // =====================================================

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString('vi-VN') + ' ₫'

  // =====================================================
  // DATA 12 THÁNG
  // =====================================================

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

  const totalAmount = months.reduce(
    (total, item) => total + item.totalAmount,
    0
  )

  const highestMonth = months.reduce(
    (highest, item) =>
      item.totalAmount > highest.totalAmount
        ? item
        : highest,
    months[0]
  )

  const activeMonths = months.filter(
    (item) => item.totalAmount > 0
  ).length

  const averageAmount = totalAmount / 12

  const maxRevenue = Math.max(
    ...months.map((item) => item.totalAmount),
    1
  )

  // =====================================================
  // EXPORT PDF
  // =====================================================

  const handleExportPDF = async () => {
    if (!data) return

    setExportError('')

    let regularFont
    let boldFont

    try {
      [regularFont, boldFont] = await Promise.all([
        loadFontAsBase64(notoSansRegularUrl),
        loadFontAsBase64(notoSansBoldUrl)
      ])
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : 'Không thể tạo báo cáo PDF. Vui lòng thử lại.'
      )
      return
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const formatPdfMoney = (amount) =>
      `${Number(amount || 0).toLocaleString('vi-VN')} VND`
    const generatedAt = new Date().toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short'
    })

    doc.setProperties({
      title: `Thong ke thu nhap nam ${selectedYear}`,
      subject: 'Bao cao doanh thu theo thang',
      author: 'Hotel Management'
    })

    doc.addFileToVFS('NotoSans-Regular.ttf', regularFont)
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
    doc.addFileToVFS('NotoSans-Bold.ttf', boldFont)
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')

    doc.setFillColor(18, 38, 58)
    doc.rect(0, 0, pageWidth, 51, 'F')
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, 3, 51, 'F')

    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(147, 197, 253)
    doc.text('HOTEL MANAGEMENT  /  BÁO CÁO TÀI CHÍNH', 16, 14)

    doc.setFontSize(19)
    doc.setTextColor(255, 255, 255)
    doc.text('THỐNG KÊ THU NHẬP', 16, 26)

    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    doc.text('Tổng quan doanh thu theo tháng', 16, 34)

    doc.setFillColor(30, 55, 79)
    doc.roundedRect(pageWidth - 54, 12, 38, 25, 3, 3, 'F')
    doc.setFont('NotoSans', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(191, 219, 254)
    doc.text('NĂM BÁO CÁO', pageWidth - 35, 20, { align: 'center' })
    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text(String(selectedYear), pageWidth - 35, 30, { align: 'center' })

    const summaryCards = [
      {
        label: 'TỔNG DOANH THU',
        value: formatPdfMoney(totalAmount),
        note: `Trong năm ${selectedYear}`
      },
      {
        label: 'THÁNG CAO NHẤT',
        value: totalAmount > 0 ? `Tháng ${highestMonth.month}` : '--',
        note: formatPdfMoney(totalAmount > 0 ? highestMonth.totalAmount : 0)
      },
      {
        label: 'TRUNG BÌNH / THÁNG',
        value: formatPdfMoney(averageAmount),
        note: 'Tính trên 12 tháng'
      }
    ]

    const cardGap = 5
    const cardWidth = (pageWidth - 32 - cardGap * 2) / 3

    summaryCards.forEach((card, index) => {
      const x = 16 + index * (cardWidth + cardGap)

      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.roundedRect(x, 59, cardWidth, 34, 2, 2, 'FD')
      doc.setFillColor(59, 130, 246)
      doc.roundedRect(x, 59, 1.5, 34, 0.7, 0.7, 'F')

      doc.setFont('NotoSans', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text(card.label, x + 5, 67)

      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      doc.text(card.value, x + 5, 77, {
        maxWidth: cardWidth - 10
      })

      doc.setFont('NotoSans', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text(card.note, x + 5, 86, {
        maxWidth: cardWidth - 10
      })
    })

    doc.setFont('NotoSans', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text('CHI TIẾT DOANH THU THEO THÁNG', 16, 106)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(16, 109, pageWidth - 16, 109)

    const tableData = months.map((item, index) => [
      String(index + 1).padStart(2, '0'),
      `Tháng ${item.month}`,
      formatPdfMoney(item.totalAmount),
      `${totalAmount > 0
        ? ((item.totalAmount / totalAmount) * 100).toFixed(1)
        : '0.0'}%`
    ])

    autoTable(doc, {
      startY: 114,
      margin: { left: 16, right: 16 },

      head: [
        ['STT', 'THÁNG', 'DOANH THU', 'TỶ TRỌNG']
      ],

      body: tableData,

      foot: [
        [
          '',
          'TỔNG DOANH THU NĂM',
          formatPdfMoney(totalAmount),
          totalAmount > 0 ? '100.0%' : '0.0%'
        ]
      ],

      styles: {
        font: 'NotoSans',
        fontSize: 8,
        cellPadding: 3.5,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },

      headStyles: {
        fillColor: [37, 99, 170],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        cellPadding: 4
      },

      alternateRowStyles: {
        fillColor: [244, 248, 252]
      },

      columnStyles: {
        0: {
          halign: 'center',
          cellWidth: 18
        },

        1: {
          halign: 'left',
          cellWidth: 66
        },

        2: {
          halign: 'right',
          cellWidth: 56,
          fontStyle: 'bold'
        },

        3: {
          halign: 'right',
          cellWidth: 38
        }
      },

      footStyles: {
        fillColor: [18, 38, 58],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 4
      },

      didDrawPage: () => {
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.3)
        doc.line(16, pageHeight - 15, pageWidth - 16, pageHeight - 15)

        doc.setFont('NotoSans', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.text(
          'BÁO CÁO NỘI BỘ  |  HOTEL MANAGEMENT',
          16,
          pageHeight - 9
        )
        doc.text(
          `Ngày xuất: ${generatedAt}`,
          pageWidth - 16,
          pageHeight - 9,
          { align: 'right' }
        )
      }
    })

    doc.save(
      `thong-ke-thu-nhap-${selectedYear}.pdf`
    )
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            BÁO CÁO TÀI CHÍNH
          </div>

          <h1 style={styles.title}>
            Thống kê thu nhập
          </h1>

          <p style={styles.subtitle}>
            Tổng quan và phân tích doanh thu khách sạn theo từng tháng.
          </p>
        </div>

        <div style={styles.actions}>
          <div style={styles.yearControl}>
            <span style={styles.calendarIcon}>
              ◫
            </span>

            <div>
              <div style={styles.yearControlLabel}>
                Năm thống kê
              </div>

              <select
                value={selectedYear}
                onChange={(event) =>
                  setSelectedYear(
                    Number(event.target.value)
                  )
                }
                style={styles.yearSelect}
              >
                {STATISTICS_YEARS.map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={loading || !data}
            style={{
              ...styles.exportButton,
              opacity: loading || !data ? 0.55 : 1,
              cursor:
                loading || !data
                  ? 'not-allowed'
                  : 'pointer'
            }}
          >
            <span style={styles.exportIcon}>
              ↓
            </span>

            Xuất PDF
          </button>
        </div>
      </div>

      {exportError && (
        <div role="alert" style={styles.errorCard}>
          <div style={styles.errorIcon}>!</div>
          <div>
            <div style={styles.errorTitle}>Không thể xuất PDF</div>
            <div style={styles.errorText}>{exportError}</div>
          </div>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div style={styles.stateCard}>
          <div style={styles.loadingCircle}>
            ↻
          </div>

          <div>
            <div style={styles.stateTitle}>
              Đang tải báo cáo
            </div>

            <div style={styles.stateText}>
              Đang tổng hợp doanh thu năm {selectedYear}...
            </div>
          </div>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            !
          </div>

          <div>
            <div style={styles.errorTitle}>
              Không thể tải dữ liệu
            </div>

            <div style={styles.errorText}>
              {error}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>

          {/* ================================================= */}
          {/* HERO REVENUE */}
          {/* ================================================= */}

          <div style={styles.heroGrid}>

            <div style={styles.heroCard}>
              <div style={styles.heroGlowOne} />
              <div style={styles.heroGlowTwo} />

              <div style={styles.heroContent}>
                <div style={styles.heroTop}>
                  <div>
                    <div style={styles.heroLabel}>
                      TỔNG DOANH THU NĂM {data.year}
                    </div>

                    <div style={styles.heroAmount}>
                      {formatMoney(totalAmount)}
                    </div>

                    <div style={styles.heroDescription}>
                      Tổng doanh thu ghi nhận trong 12 tháng
                    </div>
                  </div>

                  <div style={styles.heroMoneyIcon}>
                    ₫
                  </div>
                </div>

                <div style={styles.heroBottom}>
                  <div style={styles.heroMiniStat}>
                    <div style={styles.heroMiniLabel}>
                      Tháng hoạt động
                    </div>

                    <div style={styles.heroMiniValue}>
                      {activeMonths}/12
                    </div>
                  </div>

                  <div style={styles.heroVerticalLine} />

                  <div style={styles.heroMiniStat}>
                    <div style={styles.heroMiniLabel}>
                      Trung bình / tháng
                    </div>

                    <div style={styles.heroMiniValue}>
                      {formatMoney(averageAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT CARDS */}

            <div style={styles.rightStats}>

              <div style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <div style={styles.metricIconGreen}>
                    ↗
                  </div>

                  <span style={styles.greenBadge}>
                    Cao nhất
                  </span>
                </div>

                <div style={styles.metricLabel}>
                  THÁNG DOANH THU CAO NHẤT
                </div>

                <div style={styles.metricMain}>
                  {totalAmount > 0
                    ? `Tháng ${highestMonth.month}`
                    : 'Chưa có'}
                </div>

                <div style={styles.metricMoney}>
                  {formatMoney(
                    totalAmount > 0
                      ? highestMonth.totalAmount
                      : 0
                  )}
                </div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <div style={styles.metricIconBlue}>
                    ≈
                  </div>

                  <span style={styles.blueBadge}>
                    Bình quân
                  </span>
                </div>

                <div style={styles.metricLabel}>
                  DOANH THU TRUNG BÌNH
                </div>

                <div style={styles.metricMain}>
                  {formatMoney(averageAmount)}
                </div>

                <div style={styles.metricNote}>
                  Tính trên tổng 12 tháng
                </div>
              </div>

            </div>
          </div>

          {/* ================================================= */}
          {/* CHART */}
          {/* ================================================= */}

          <div style={styles.chartCard}>

            <div style={styles.chartHeader}>
              <div>
                <div style={styles.chartTitle}>
                  Doanh thu theo tháng
                </div>

                <div style={styles.chartSubtitle}>
                  So sánh doanh thu 12 tháng trong năm {data.year}
                </div>
              </div>

              <div style={styles.chartLegend}>
                <span style={styles.legendDot} />
                Doanh thu
              </div>
            </div>

            {/* COLUMN CHART */}

            <div style={styles.chartBody}>

              <div style={styles.yAxis}>
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              <div style={styles.chartContent}>

                <div style={styles.gridLines}>
                  <div style={styles.gridLine} />
                  <div style={styles.gridLine} />
                  <div style={styles.gridLine} />
                  <div style={styles.gridLine} />
                  <div style={styles.gridLine} />
                </div>

                <div style={styles.columns}>
                  {months.map((item) => {
                    const hasRevenue =
                      item.totalAmount > 0

                    const height =
                      hasRevenue
                        ? Math.max(
                            (item.totalAmount / maxRevenue) * 100,
                            8
                          )
                        : 2

                    const isHighest =
                      totalAmount > 0 &&
                      item.month === highestMonth.month

                    return (
                      <div
                        key={item.month}
                        style={styles.columnItem}
                      >
                        <div style={styles.columnArea}>

                          {hasRevenue && (
                            <div style={styles.columnTooltip}>
                              {formatMoney(item.totalAmount)}
                            </div>
                          )}

                          <div
                            style={{
                              ...styles.column,

                              height: `${height}%`,

                              background: isHighest
                                ? 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)'
                                : hasRevenue
                                  ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)'
                                  : '#e8eef6',

                              boxShadow: isHighest
                                ? '0 8px 18px rgba(37,99,235,0.25)'
                                : 'none'
                            }}
                          />
                        </div>

                        <div
                          style={{
                            ...styles.columnMonth,

                            color: isHighest
                              ? '#1d4ed8'
                              : '#64748b',

                            fontWeight: isHighest
                              ? 800
                              : 600
                          }}
                        >
                          T{item.month}
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>

            {/* CHART FOOTER */}

            <div style={styles.chartFooter}>

              <div style={styles.summaryItem}>
                <div style={styles.summaryIcon}>
                  ₫
                </div>

                <div>
                  <div style={styles.summaryLabel}>
                    Tổng doanh thu
                  </div>

                  <div style={styles.summaryValue}>
                    {formatMoney(totalAmount)}
                  </div>
                </div>
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.summaryItem}>
                <div style={styles.summaryIcon}>
                  ↗
                </div>

                <div>
                  <div style={styles.summaryLabel}>
                    Tháng cao nhất
                  </div>

                  <div style={styles.summaryValue}>
                    {totalAmount > 0
                      ? `Tháng ${highestMonth.month}`
                      : '--'}
                  </div>
                </div>
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.summaryItem}>
                <div style={styles.summaryIcon}>
                  ◷
                </div>

                <div>
                  <div style={styles.summaryLabel}>
                    Có doanh thu
                  </div>

                  <div style={styles.summaryValue}>
                    {activeMonths}/12 tháng
                  </div>
                </div>
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.summaryItem}>
                <div style={styles.summaryIcon}>
                  ≈
                </div>

                <div>
                  <div style={styles.summaryLabel}>
                    Bình quân
                  </div>

                  <div style={styles.summaryValue}>
                    {formatMoney(averageAmount)}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================================================= */}
          {/* MONTHLY REVENUE */}
          {/* ================================================= */}

          <div style={styles.monthSection}>

            <div style={styles.monthSectionHeader}>
              <div>
                <div style={styles.monthSectionTitle}>
                  Chi tiết doanh thu
                </div>

                <div style={styles.monthSectionSubtitle}>
                  Doanh thu thực tế của từng tháng
                </div>
              </div>

              <div style={styles.monthCount}>
                {activeMonths} tháng có doanh thu
              </div>
            </div>

            <div style={styles.monthGrid}>
              {months.map((item) => {
                const hasRevenue =
                  item.totalAmount > 0

                const isHighest =
                  totalAmount > 0 &&
                  item.month === highestMonth.month

                return (
                  <div
                    key={item.month}
                    style={{
                      ...styles.monthCard,

                      ...(isHighest
                        ? styles.highestMonthCard
                        : {})
                    }}
                  >
                    <div style={styles.monthCardTop}>
                      <div
                        style={{
                          ...styles.monthNumber,

                          ...(hasRevenue
                            ? styles.activeMonthNumber
                            : {})
                        }}
                      >
                        {String(item.month).padStart(2, '0')}
                      </div>

                      {isHighest && (
                        <span style={styles.bestBadge}>
                          Cao nhất
                        </span>
                      )}
                    </div>

                    <div style={styles.monthName}>
                      Tháng {item.month}
                    </div>

                    <div
                      style={{
                        ...styles.monthMoney,

                        color: hasRevenue
                          ? '#172b4d'
                          : '#94a3b8'
                      }}
                    >
                      {formatMoney(item.totalAmount)}
                    </div>

                    <div style={styles.monthProgress}>
                      <div
                        style={{
                          ...styles.monthProgressValue,

                          width: hasRevenue
                            ? `${Math.max(
                                (item.totalAmount / maxRevenue) * 100,
                                4
                              )}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </>
      )}
    </div>
  )
}

// =====================================================
// STYLE
// =====================================================

const styles = {
  page: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '30px'
  },

  // =====================================================
  // HEADER
  // =====================================================

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    flexWrap: 'wrap',
    marginBottom: '26px'
  },

  eyebrow: {
    marginBottom: '7px',
    color: '#2563eb',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '1.7px'
  },

  title: {
    margin: 0,
    color: '#172b4d',
    fontSize: '29px',
    lineHeight: 1.25,
    fontWeight: 800
  },

  subtitle: {
    margin: '7px 0 0',
    color: '#64748b',
    fontSize: '13px',
    lineHeight: 1.6
  },

  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },

  yearControl: {
    minHeight: '48px',
    padding: '7px 13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow:
      '0 3px 10px rgba(15,23,42,0.04)'
  },

  calendarIcon: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: '15px'
  },

  yearControlLabel: {
    marginBottom: '1px',
    color: '#94a3b8',
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  yearSelect: {
    minWidth: '78px',
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#172b4d',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer'
  },

  exportButton: {
    minHeight: '48px',
    padding: '0 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '12px',
    background: '#172b4d',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    boxShadow:
      '0 7px 18px rgba(23,43,77,0.16)'
  },

  exportIcon: {
    fontSize: '17px'
  },

  // =====================================================
  // STATE
  // =====================================================

  stateCard: {
    padding: '22px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px'
  },

  loadingCircle: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: '20px',
    fontWeight: 800
  },

  stateTitle: {
    color: '#172b4d',
    fontSize: '14px',
    fontWeight: 700
  },

  stateText: {
    marginTop: '3px',
    color: '#94a3b8',
    fontSize: '12px'
  },

  errorCard: {
    padding: '22px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: '#fff7f7',
    border: '1px solid #fecaca',
    borderRadius: '16px'
  },

  errorIcon: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: '#fee2e2',
    color: '#dc2626',
    fontWeight: 800
  },

  errorTitle: {
    color: '#991b1b',
    fontSize: '14px',
    fontWeight: 700
  },

  errorText: {
    marginTop: '3px',
    color: '#b91c1c',
    fontSize: '12px'
  },

  // =====================================================
  // HERO
  // =====================================================

  heroGrid: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(420px, 1.6fr) minmax(400px, 1fr)',
    gap: '18px',
    marginBottom: '20px'
  },

  heroCard: {
    position: 'relative',
    minHeight: '245px',
    overflow: 'hidden',
    borderRadius: '20px',
    background:
      'linear-gradient(135deg, #172554 0%, #1e3a8a 42%, #2563eb 100%)',
    boxShadow:
      '0 16px 34px rgba(30,64,175,0.20)'
  },

  heroGlowOne: {
    position: 'absolute',
    width: '240px',
    height: '240px',
    top: '-100px',
    right: '-60px',
    borderRadius: '50%',
    background: 'rgba(96,165,250,0.20)'
  },

  heroGlowTwo: {
    position: 'absolute',
    width: '180px',
    height: '180px',
    right: '80px',
    bottom: '-120px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.07)'
  },

  heroContent: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    boxSizing: 'border-box',
    padding: '27px'
  },

  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px'
  },

  heroLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px'
  },

  heroAmount: {
    marginTop: '10px',
    color: '#ffffff',
    fontSize: '38px',
    lineHeight: 1.2,
    fontWeight: 800
  },

  heroDescription: {
    marginTop: '8px',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '12px'
  },

  heroMoneyIcon: {
    width: '54px',
    height: '54px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.11)',
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: 800
  },

  heroBottom: {
    marginTop: '30px',
    paddingTop: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    borderTop: '1px solid rgba(255,255,255,0.14)'
  },

  heroMiniStat: {
    flex: 1
  },

  heroMiniLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: '10px'
  },

  heroMiniValue: {
    marginTop: '5px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700
  },

  heroVerticalLine: {
    width: '1px',
    height: '32px',
    background: 'rgba(255,255,255,0.14)'
  },

  rightStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '18px'
  },

  metricCard: {
    minWidth: 0,
    padding: '22px',
    background: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: '18px',
    boxShadow:
      '0 7px 22px rgba(15,23,42,0.045)'
  },

  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '24px'
  },

  metricIconGreen: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    background: '#f0fdf4',
    color: '#16a34a',
    fontSize: '19px',
    fontWeight: 800
  },

  metricIconBlue: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: '19px',
    fontWeight: 800
  },

  greenBadge: {
    padding: '5px 8px',
    borderRadius: '20px',
    background: '#f0fdf4',
    color: '#16a34a',
    fontSize: '9px',
    fontWeight: 700
  },

  blueBadge: {
    padding: '5px 8px',
    borderRadius: '20px',
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: '9px',
    fontWeight: 700
  },

  metricLabel: {
    minHeight: '28px',
    color: '#94a3b8',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.6px'
  },

  metricMain: {
    marginTop: '7px',
    color: '#172b4d',
    fontSize: '19px',
    lineHeight: 1.3,
    fontWeight: 800
  },

  metricMoney: {
    marginTop: '6px',
    color: '#16a34a',
    fontSize: '13px',
    fontWeight: 700
  },

  metricNote: {
    marginTop: '7px',
    color: '#94a3b8',
    fontSize: '11px'
  },

  // =====================================================
  // CHART
  // =====================================================

  chartCard: {
    marginBottom: '20px',
    padding: '25px',
    background: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: '20px',
    boxShadow:
      '0 8px 28px rgba(15,23,42,0.05)'
  },

  chartHeader: {
    paddingBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '15px',
    flexWrap: 'wrap',
    borderBottom: '1px solid #edf1f5'
  },

  chartTitle: {
    color: '#172b4d',
    fontSize: '18px',
    fontWeight: 800
  },

  chartSubtitle: {
    marginTop: '5px',
    color: '#94a3b8',
    fontSize: '12px'
  },

  chartLegend: {
    padding: '7px 11px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    borderRadius: '20px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 600
  },

  legendDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#2563eb'
  },

  chartBody: {
    height: '300px',
    paddingTop: '24px',
    display: 'flex',
    gap: '13px'
  },

  yAxis: {
    width: '36px',
    paddingBottom: '29px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    color: '#b0bac8',
    fontSize: '9px'
  },

  chartContent: {
    position: 'relative',
    flex: 1,
    minWidth: 0
  },

  gridLines: {
    position: 'absolute',
    inset: '0 0 29px 0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    pointerEvents: 'none'
  },

  gridLine: {
    width: '100%',
    borderTop: '1px dashed #e9eef5'
  },

  columns: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '12px'
  },

  columnItem: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column'
  },

  columnArea: {
    position: 'relative',
    height: 'calc(100% - 29px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },

  column: {
    width: '56%',
    minWidth: '14px',
    maxWidth: '34px',
    borderRadius: '7px 7px 3px 3px',
    transition: 'height 0.25s ease'
  },

  columnTooltip: {
    position: 'absolute',
    top: '-2px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '4px 6px',
    borderRadius: '5px',
    background: '#172b4d',
    color: '#ffffff',
    fontSize: '8px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    zIndex: 2
  },

  columnMonth: {
    height: '29px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    color: '#64748b',
    fontSize: '10px'
  },

  chartFooter: {
    marginTop: '7px',
    padding: '17px 20px',
    display: 'grid',
    gridTemplateColumns:
      '1fr auto 1fr auto 1fr auto 1fr',
    alignItems: 'center',
    gap: '18px',
    borderRadius: '14px',
    background: '#f8fafc'
  },

  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },

  summaryIcon: {
    width: '32px',
    height: '32px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9px',
    background: '#ffffff',
    border: '1px solid #e5eaf2',
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: 800
  },

  summaryLabel: {
    color: '#94a3b8',
    fontSize: '9px',
    fontWeight: 600
  },

  summaryValue: {
    marginTop: '3px',
    color: '#172b4d',
    fontSize: '12px',
    fontWeight: 800
  },

  summaryDivider: {
    width: '1px',
    height: '32px',
    background: '#e2e8f0'
  },

  // =====================================================
  // MONTH DETAIL
  // =====================================================

  monthSection: {
    padding: '25px',
    background: '#ffffff',
    border: '1px solid #e5eaf2',
    borderRadius: '20px',
    boxShadow:
      '0 8px 28px rgba(15,23,42,0.05)'
  },

  monthSectionHeader: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap'
  },

  monthSectionTitle: {
    color: '#172b4d',
    fontSize: '18px',
    fontWeight: 800
  },

  monthSectionSubtitle: {
    marginTop: '5px',
    color: '#94a3b8',
    fontSize: '12px'
  },

  monthCount: {
    padding: '7px 11px',
    borderRadius: '20px',
    background: '#eff6ff',
    color: '#2563eb',
    fontSize: '10px',
    fontWeight: 700
  },

  monthGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px'
  },

  monthCard: {
    padding: '16px',
    border: '1px solid #edf1f5',
    borderRadius: '14px',
    background: '#fbfcfe'
  },

  highestMonthCard: {
    border: '1px solid #bfdbfe',
    background:
      'linear-gradient(145deg, #eff6ff, #ffffff)'
  },

  monthCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },

  monthNumber: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9px',
    background: '#f1f5f9',
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 800
  },

  activeMonthNumber: {
    background: '#dbeafe',
    color: '#1d4ed8'
  },

  bestBadge: {
    padding: '4px 7px',
    borderRadius: '20px',
    background: '#dbeafe',
    color: '#1d4ed8',
    fontSize: '8px',
    fontWeight: 700
  },

  monthName: {
    marginTop: '13px',
    color: '#64748b',
    fontSize: '10px',
    fontWeight: 600
  },

  monthMoney: {
    marginTop: '4px',
    fontSize: '14px',
    fontWeight: 800
  },

  monthProgress: {
    height: '4px',
    marginTop: '13px',
    overflow: 'hidden',
    borderRadius: '20px',
    background: '#e8eef5'
  },

  monthProgressValue: {
    height: '100%',
    borderRadius: '20px',
    background:
      'linear-gradient(90deg, #2563eb, #60a5fa)'
  }
}

export default IncomeStatistics