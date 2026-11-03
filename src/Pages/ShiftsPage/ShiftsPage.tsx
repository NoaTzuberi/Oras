import { ShiftCard } from '../../components/ShiftCard/ShiftCard'
import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import { TopNavBar } from '../../components/TopNavBar/TopNavBar'
import './ShiftsPage.css'
import { useShifts } from '../../context/ShiftContext'
import { useTranslation } from 'react-i18next'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { parseLocalISODate } from '../../utils/localDate'
import { JobFilterTabs } from '../../components/JobFilterTabs/JobFilterTabs'
import { useJobFilter } from '../../hooks/useJobFilter'
import { filterShiftsByJob } from '../../utils/jobFilter'

export const ShiftsPage = () => {
const { t } = useTranslation()
const {
  filteredShifts: monthShifts,
  taxInfo,
  userProfile,
  selectedMonth,
  setSelectedMonth,
} = useShifts()

const isProfileComplete = userProfile.gender !== null
const { activeJobs, showTabs, selected: jobFilter, select: setJobFilter } = useJobFilter()
const filteredShifts = filterShiftsByJob(monthShifts, jobFilter)
// Gross of the visible shifts; net only for "All", since tax depends on combined income
const gross = jobFilter === null
  ? taxInfo.grossSalary
  : parseFloat(filteredShifts.reduce((sum, s) => sum + s.totalEarnings, 0).toFixed(2))

  const totalHours = parseFloat(
  filteredShifts.reduce((sum, s) => sum + s.hours, 0).toFixed(2)
)

const goToPrevMonth = () => {
  const newDate = new Date(selectedMonth)
  newDate.setMonth(newDate.getMonth() - 1)
  setSelectedMonth(newDate)
}

const goToNextMonth = () => {
  const newDate = new Date(selectedMonth)
  newDate.setMonth(newDate.getMonth() + 1)
  setSelectedMonth(newDate)
}
const monthNames = t('ShiftsPage.months', { returnObjects: true }) as string[]

const monthLabel = `${
  monthNames[selectedMonth.getMonth()]
} ${selectedMonth.getFullYear()}`

  return (
    <div className="shifts-page">
      <TopNavBar />
      <div className="shifts-content">
    

        <div className="month-nav">
          <button className="month-nav__btn" onClick={goToPrevMonth} aria-label="previous month">
            <FiChevronLeft />
          </button>

          <div className="month-title">
            {monthLabel}
          </div>

          <button className="month-nav__btn" onClick={goToNextMonth} aria-label="next month">
            <FiChevronRight />
          </button>
        </div>

        {showTabs && <JobFilterTabs jobs={activeJobs} selected={jobFilter} onSelect={setJobFilter} />}

        {/* Summary bar */}
        {filteredShifts.length > 0 && (
          <div className="shifts-summary">
            <div className="shifts-summary__item">
              <span className="shifts-summary__label"> {t("ShiftsPage.grossTitle")} </span>
              <span className="shifts-summary__value">
                ₪{gross.toLocaleString()}
              </span>
            </div>

            {jobFilter === null && <>
            <div className="shifts-summary__divider" />

            <div className="shifts-summary__item">
              <span className="shifts-summary__label">{t("ShiftsPage.netTitle")}</span>
              <span className="shifts-summary__value shifts-summary__value--net">
                {isProfileComplete
                  ? `₪${taxInfo.netSalary.toLocaleString()}`
                  : '—'}
              </span>
              {!isProfileComplete && (
                <span className="shifts-summary__hint">{t('ShiftsPage.completeProfileHint')}</span>
              )}
            </div>
            </>}

            <div className="shifts-summary__divider" />

            <div className="shifts-summary__item">
              <span className="shifts-summary__label">{t("ShiftsPage.hours")}</span>
              <span className="shifts-summary__value">{totalHours}</span>
            </div>

            <div className="shifts-summary__divider" />

            <div className="shifts-summary__item">
              <span className="shifts-summary__label">{t("ShiftsPage.Shifts")}</span>
              <span className="shifts-summary__value">{filteredShifts.length}</span>
            </div>
          </div>
        )}

        

        {/* Grid */}
        {filteredShifts.length === 0 ? (
          <div className="shifts-empty">
            <p>{t('ShiftsPage.emptyTitle')}</p>
            <span>{t('ShiftsPage.emptySubtitle')}</span>
          </div>
        ) : (
          <div className="shifts-grid">
            {[...filteredShifts]
              .sort(
               (a, b) =>
                  parseLocalISODate(b.date).getTime() - parseLocalISODate(a.date).getTime()
              )
              .map((shift, i) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />
    </div>
  )
}