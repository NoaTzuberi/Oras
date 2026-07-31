import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './index.css'
import './Pages/SettingsPage/SettingsPage.css'

const Preview = () => {
  const [date, setDate] = useState<Date | null>(new Date(2022, 5, 15))
  return (
    <div style={{ padding: 40, background: '#eef0fb', minHeight: '100vh' }}>
      <DatePicker
        selected={date}
        onChange={(d: Date | null) => setDate(d)}
        maxDate={new Date()}
        dateFormat="dd/MM/yyyy"
        placeholderText="DD/MM/YYYY"
        className="settings-input"
        wrapperClassName="settings-datepicker"
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        yearDropdownItemNumber={60}
        scrollableYearDropdown
        inline
      />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
