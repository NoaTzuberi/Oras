import { ShiftCard } from '../../components/ShiftCard/ShiftCard'
import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import { TopNavBar } from '../../components/TopNavBar/TopNavBar'
import './ShiftsPage.css'
import { useShifts } from '../../context/ShiftContext'
import { t } from 'i18next'

export const ShiftsPage = () => {
const {
  filteredShifts,
  taxInfo,
  userProfile,
  selectedMonth,
  setSelectedMonth,
} = useShifts()

const isProfileComplete = userProfile.gender !== null

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
const monthNames = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל',
  'מאי', 'יוני', 'יולי', 'אוגוסט',
  'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

const monthLabel = `${
  monthNames[selectedMonth.getMonth()]
} ${selectedMonth.getFullYear()}`

  return (
    <div className="shifts-page">
      <TopNavBar />
      <div className="shifts-content">
    

        <div className="month-nav">
          <button onClick={goToPrevMonth}>⬅️</button>

          <div className="month-title">
            {monthLabel}
          </div>

          <button onClick={goToNextMonth}>➡️</button>
        </div>

        {/* Summary bar */}
        {filteredShifts.length > 0 && (
          <div className="shifts-summary">
            <div className="shifts-summary__item">
              <span className="shifts-summary__label"> {t("ShiftsPage.grossTitle")} </span>
              <span className="shifts-summary__value">
                ₪{taxInfo.grossSalary.toLocaleString()}
              </span>
            </div>

            <div className="shifts-summary__divider" />

            <div className="shifts-summary__item">
              <span className="shifts-summary__label">{t("ShiftsPage.netTitle")}</span>
              <span className="shifts-summary__value shifts-summary__value--net">
                {isProfileComplete
                  ? `₪${taxInfo.netSalary.toLocaleString()}`
                  : '—'}
              </span>
              {!isProfileComplete && (
                <span className="shifts-summary__hint">מלא פרופיל</span>
              )}
            </div>

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
            <p>אין משמרות עדיין</p>
            <span>הוסף משמרת עם כפתור ה-+</span>
          </div>
        ) : (
          <div className="shifts-grid">
            {filteredShifts
              .sort(
               (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
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