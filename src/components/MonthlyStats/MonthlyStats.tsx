import { useTranslation } from 'react-i18next'
import { useShifts, getMonthlyBreakdown } from '../../context/ShiftContext'
import { MonthlyBarChart } from '../MonthlyBarChart/MonthlyBarChart'
import './MonthlyStats.css'

const MONTHS_BACK = 6

export const MonthlyStats = () => {
  const { t } = useTranslation()
  const { shifts } = useShifts()

  const monthsShort = t('stats.monthsShort', { returnObjects: true }) as string[]
  const breakdown = getMonthlyBreakdown(shifts, MONTHS_BACK)
  const hasAnyData = breakdown.some(m => m.hours > 0)

  const hoursData = breakdown.map(m => ({ label: monthsShort[m.month], value: m.hours }))
  const rateData = breakdown.map(m => ({ label: monthsShort[m.month], value: m.avgHourlyRate }))

  return (
    <div className="monthly-stats">
      <div className="monthly-stats__header">
        <h2 className="monthly-stats__title">{t('stats.title')}</h2>
        <p className="monthly-stats__header-subtitle">{t('stats.headerSubtitle')}</p>
      </div>

      {!hasAnyData ? (
        <div className="monthly-stats__empty">
          <p>{t('stats.noDataTitle')}</p>
          <span>{t('stats.noDataSubtitle')}</span>
        </div>
      ) : (
        <>
          <div className="monthly-stats__card">
            <div className="monthly-stats__card-header">
              <h3>{t('stats.hoursTitle')}</h3>
              <span>{t('stats.hoursSubtitle')}</span>
            </div>
            <MonthlyBarChart
              data={hoursData}
              gradient={['#4f46e5', '#7c3aed']}
              formatValue={v => `${v}${t('stats.hoursUnit')}`}
            />
          </div>

          <div className="monthly-stats__card">
            <div className="monthly-stats__card-header">
              <h3>{t('stats.rateTitle')}</h3>
              <span>{t('stats.rateSubtitle')}</span>
            </div>
            <MonthlyBarChart
              data={rateData}
              gradient={['#10b981', '#059669']}
              formatValue={v => `₪${v}`}
            />
          </div>
        </>
      )}
    </div>
  )
}
