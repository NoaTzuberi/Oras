import { useNavigate } from 'react-router-dom'
import { useShifts } from '../../context/ShiftContext'
import { useTranslation } from "react-i18next"
import { FitText } from '../FitText/FitText'
import { JobFilterTabs } from '../JobFilterTabs/JobFilterTabs'
import { useJobFilter } from '../../hooks/useJobFilter'
import { filterShiftsByJob, jobBreakdown } from '../../utils/jobFilter'
import { jobDisplayName } from '../../utils/jobs'
import { NO_JOB_COLOR, jobColor } from '../../utils/jobColors'
import { formatHM, formatMoney } from '../../utils/format'
import { monthlyOvertime, type OvertimeByRate } from '../../utils/overtimeStats'
import './Dashboard.css'

// Same colors as the overtime parts of the shift timeline (PayBreakdownSection.css)
const OT_RATE_COLORS: Record<keyof OvertimeByRate, string> = { 125: '#fbbf24', 150: '#d97706', 175: '#c026d3', 200: '#86198f' }
const OT_RATES = [125, 150, 175, 200] as const

export const Dashboard = () => {
  const { taxInfo, userProfile, filteredShifts: monthShifts, jobs } = useShifts()
  const { activeJobs, showTabs, selected: jobFilter, select: setJobFilter } = useJobFilter()
  const filteredShifts = filterShiftsByJob(monthShifts, jobFilter)
  const selectedJob = jobs.find(j => j.id === jobFilter) ?? null
  const breakdown = jobFilter === null ? jobBreakdown(monthShifts, jobs) : []
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

  // Paid overtime this month (all jobs, or the selected job's tab)
  const overtime = monthlyOvertime(filteredShifts)
  const overtimeTotal = OT_RATES.reduce((sum, r) => sum + overtime[r], 0)

  // "All" uses the tax calculation's gross (same number); a job tab sums its shifts
  const gross = selectedJob ? Math.round(totalEarnings * 100) / 100 : taxInfo.grossSalary

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

      {showTabs && (
        <div className="dashboard-tabs">
          <JobFilterTabs jobs={activeJobs} selected={jobFilter} onSelect={setJobFilter} />
        </div>
      )}

      {/* Cards */}
      <div className='card-container'>

        {/* Gross */}
        <div className="card card--gross">
          <div className="card-icon">💼</div>
          <h3>{t("dashboard.grossTitle")}</h3>
          <FitText className="card-value">₪{gross.toLocaleString()}</FitText>
          <span className="card-subtitle">
            {selectedJob
              ? t("dashboard.jobGrossSubtitle", { job: jobDisplayName(selectedJob, t) })
              : t("dashboard.grossSubtitle")}
          </span>
        </div>

        {/* Per job, on "All" only */}
        {breakdown.length > 1 && (
          <div className="card card--breakdown">
            <h3>{t("dashboard.breakdownTitle")}</h3>
            <ul className="job-breakdown">
              {breakdown.map(row => (
                <li
                  key={row.jobId ?? 'none'}
                  className="job-breakdown__row"
                  style={{ '--job-color': row.job ? jobColor(row.job) : NO_JOB_COLOR } as React.CSSProperties}
                >
                  <span className="job-breakdown__name">
                    <span className="job-breakdown__dot" aria-hidden="true" />
                    <span className="job-breakdown__label">{row.job ? jobDisplayName(row.job, t) : t("dashboard.noJob")}</span>
                  </span>
                  <span className="job-breakdown__value">
                    {t("dashboard.breakdownRow", { hours: formatHM(row.hours), gross: formatMoney(row.gross) })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Job tab: hours instead of net / credits / deductions */}
        {selectedJob && (
          <div className="card card--hours">
            <div className="card-icon">⏱</div>
            <h3>{t("dashboard.hoursTitle")}</h3>
            <FitText className="card-value">{formatHM(totalHours)}</FitText>
            <span className="card-subtitle">{t("dashboard.hoursSubtitle")}</span>
          </div>
        )}

        {/* Overtime hours by rate, on "All" and on each job tab */}
        {overtimeTotal > 0 && (
          <div className="card card--breakdown card--overtime">
            <h3>{t("dashboard.overtimeTitle")}</h3>
            <FitText className="card-value">{formatHM(overtimeTotal / 60)}</FitText>
            <ul className="job-breakdown">
              {OT_RATES.filter(r => overtime[r] > 0).map(r => (
                <li key={r} className="job-breakdown__row" style={{ '--job-color': OT_RATE_COLORS[r] } as React.CSSProperties}>
                  <span className="job-breakdown__name">
                    <span className="job-breakdown__dot" aria-hidden="true" />
                    <span className="job-breakdown__label">{t("dashboard.overtimeRow", { pct: r })}</span>
                  </span>
                  <span className="job-breakdown__value">{formatHM(overtime[r] / 60)}</span>
                </li>
              ))}
            </ul>
            <span className="card-subtitle">{t("dashboard.overtimeSubtitle")}</span>
          </div>
        )}

        {!selectedJob && <>
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
        </>}

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

      {selectedJob && <p className="dashboard-job-note">{t("dashboard.netAllOnly")}</p>}
    </div>
  )
}