import { useNavigate } from 'react-router-dom'
import { useShifts } from '../../context/ShiftContext'
import { useTranslation } from "react-i18next"
import './Dashboard.css'

export const Dashboard = () => {
  const { taxInfo, userProfile, filteredShifts } = useShifts()
  const navigate = useNavigate()
  const isProfileComplete = userProfile.gender !== null
  const { t } = useTranslation()

  const totalDeductions =
    taxInfo.incomeTax +
    taxInfo.nationalInsurance +
    taxInfo.healthInsurance

    const totalHours = filteredShifts.reduce((sum, shift) => sum + shift.hours, 0)

const totalEarnings = filteredShifts.reduce(
  (sum, shift) => sum + shift.totalEarnings,
  0
)

const averageHourlyRate =
  totalHours > 0 ? totalEarnings / totalHours : 0

  return (
    <div className="dashboard">

      {/* Notice */}
      {!isProfileComplete && (
        <div className="dashboard-notice">
          <div className="dashboard-notice__right">
            <span className="dashboard-notice__icon">⚙️</span>
            <div className="dashboard-notice__text">
              <p className="dashboard-notice__title">
                {t("dashboard.completeProfileTitle")}
              </p>
              <p className="dashboard-notice__sub">
                {t("dashboard.completeProfileSubtitle")}
              </p>
            </div>
          </div>

          <button
            className="dashboard-notice__btn"
            onClick={() => navigate('/settings')}
          >
            {t("dashboard.settingsButton")}
          </button>
        </div>
      )}

      {/* Cards */}
      <div className='card-container'>

        {/* Gross */}
        <div className="card card--gross">
          <div className="card-icon">💼</div>
          <h3>{t("dashboard.grossTitle")}</h3>
          <p>₪{taxInfo.grossSalary.toLocaleString()}</p>
          <span className="card-subtitle">
            {t("dashboard.grossSubtitle")}
          </span>
        </div>

        {/* Net */}
        <div className="card card--net">
          <div className="card-icon">✦</div>
          <h3>{t("dashboard.netTitle")}</h3>
          <p>₪{taxInfo.netSalary.toLocaleString()}</p>
          <span className="card-subtitle">
            {t("dashboard.netSubtitle")}
          </span>
        </div>

        {/* Credits */}
        <div className="card card--hours">
          <div className="card-icon">⏱</div>
          <h3>{t("dashboard.creditsTitle")}</h3>
          <p>{taxInfo.creditPoints}</p>
          <span className="card-subtitle">
            {t("dashboard.creditsSubtitle", {
              value: taxInfo.monthlyTaxCredit
            })}
          </span>
        </div>

        {/* Deductions */}
        <div className="card card--rate">
          <div className="card-icon">📊</div>
          <h3>{t("dashboard.deductionsTitle")}</h3>
          <p>₪{totalDeductions.toLocaleString()}</p>
          <span className="card-subtitle">
            {t("dashboard.deductionsSubtitle")}
          </span>
        </div>

        <div className='card card--averageHr'>
  <div className='card-icon'>📈</div>

  <h3>{t("dashboard.AverageTitle")}</h3>

  <p>
    ₪{averageHourlyRate.toFixed(2)}
  </p>

  <span className="card-subtitle">
    Average hourly earnings
  </span>
</div>

      </div>
    </div>
  )
}