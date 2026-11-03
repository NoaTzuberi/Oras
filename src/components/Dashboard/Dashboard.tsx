import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShifts } from '../../context/ShiftContext'
import { useTranslation } from "react-i18next"
import { FitText } from '../FitText/FitText'
import './Dashboard.css'

// One-time notice about the 2026 tax/net update. Remembered per device:
// it's only a convenience, so a new device just shows it once more.
const TAX_UPDATE_DISMISSED_KEY = 'oras.taxUpdate2026Dismissed'

const readDismissed = (): boolean => {
  try { return localStorage.getItem(TAX_UPDATE_DISMISSED_KEY) === '1' } catch { return false }
}

const writeDismissed = () => {
  try { localStorage.setItem(TAX_UPDATE_DISMISSED_KEY, '1') } catch { /* storage unavailable: hidden for this visit only */ }
}

export const Dashboard = () => {
  const { taxInfo, userProfile, filteredShifts, shifts, loadingData } = useShifts()
  const [updateDismissed, setUpdateDismissed] = useState(readDismissed)
  // Only users with shifts had a net calculated the old way
  const showTaxUpdate = !updateDismissed && !loadingData && shifts.length > 0

  const dismissTaxUpdate = () => {
    writeDismissed()
    setUpdateDismissed(true)
  }
  const navigate = useNavigate()
  const isProfileComplete = userProfile.gender !== null
  const { t } = useTranslation()

  const totalDeductions =
    taxInfo.incomeTax +
    taxInfo.nationalInsurance +
    taxInfo.healthInsurance +
    taxInfo.pensionContribution

    const totalHours = filteredShifts.reduce((sum, shift) => sum + shift.hours, 0)

const totalEarnings = filteredShifts.reduce(
  (sum, shift) => sum + shift.totalEarnings,
  0
)

const averageHourlyRate =
  totalHours > 0 ? totalEarnings / totalHours : 0

  return (
    <div className="dashboard">
        
      {/* One-time: net calculation updated */}
      {showTaxUpdate && (
        <div className="dashboard-notice" role="status">
          <div className="dashboard-notice__right">
            <span className="dashboard-notice__icon">ℹ️</span>
            <div className="dashboard-notice__text">
              <p className="dashboard-notice__title">{t("dashboard.taxUpdateTitle")}</p>
              <p className="dashboard-notice__sub">{t("dashboard.taxUpdateBody")}</p>
            </div>
          </div>
          <button className="dashboard-notice__btn" onClick={dismissTaxUpdate}>
            {t("dashboard.taxUpdateDismiss")}
          </button>
        </div>
      )}

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
          <FitText className="card-value">₪{taxInfo.grossSalary.toLocaleString()}</FitText>
          <span className="card-subtitle">
            {t("dashboard.grossSubtitle")}
          </span>
        </div>

        {/* Net */}
        <div className="card card--net">
          <div className="card-icon">✦</div>
          <h3>{t("dashboard.netTitle")}</h3>
          <FitText className="card-value">₪{taxInfo.netSalary.toLocaleString()}</FitText>
          <span className="card-subtitle">
            {taxInfo.taxYearExact
              ? t("dashboard.netSubtitle")
              : t("dashboard.netSubtitleApprox", { year: taxInfo.taxYear })}
          </span>
        </div>

        {/* Credits */}
        <div className="card card--hours">
          <div className="card-icon">⏱</div>
          <h3>{t("dashboard.creditsTitle")}</h3>
          <FitText className="card-value">{taxInfo.creditPoints}</FitText>
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
          <FitText className="card-value">₪{(Math.round(totalDeductions * 100) / 100).toLocaleString()}</FitText>
          <span className="card-subtitle">
            {t("dashboard.deductionsSubtitle")}
          </span>
        </div>

        <div className='card card--averageHr'>
  <div className='card-icon'>📈</div>

  <h3>{t("dashboard.AverageTitle")}</h3>

  <FitText className="card-value">
    ₪{averageHourlyRate.toFixed(2)}
  </FitText>

  <span className="card-subtitle">
    {t("dashboard.AverageSubtitle")}
  </span>
</div>

      </div>
    </div>
  )
}