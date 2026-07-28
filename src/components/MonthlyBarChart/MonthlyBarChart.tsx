import './MonthlyBarChart.css'

type BarDatum = { label: string; value: number }

type MonthlyBarChartProps = {
  data: BarDatum[]
  gradient: [string, string]
  formatValue: (value: number) => string
}

export const MonthlyBarChart = ({ data, gradient, formatValue }: MonthlyBarChartProps) => {
  const max = Math.max(1, ...data.map(d => d.value))

  return (
    <div className="monthly-bar-chart" dir="ltr">
      {data.map((d, i) => {
        const pct = d.value > 0 ? Math.max((d.value / max) * 100, 4) : 0
        return (
          <div className="monthly-bar-chart__col" key={i}>
            <span className="monthly-bar-chart__value">
              {d.value > 0 ? formatValue(d.value) : '–'}
            </span>
            <div className="monthly-bar-chart__track">
              <div
                className="monthly-bar-chart__bar"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(180deg, ${gradient[0]}, ${gradient[1]})`,
                }}
              />
            </div>
            <span className="monthly-bar-chart__label">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
