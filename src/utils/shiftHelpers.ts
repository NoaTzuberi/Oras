export type SpecialDayResult = {
  isSpecial: boolean
  reason: string | null
}

type HebcalItem = {
  date: string
  category: string
  yomtov?: boolean
  title: string
}

type HebcalResponse = {
  items?: HebcalItem[]
}

export const checkIfSpecialDay = async (date: Date): Promise<SpecialDayResult> => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (date.getDay() === 6) return { isSpecial: true, reason: 'שבת' }

  try {
    const res = await fetch(
      `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&month=${month}&maj=on&min=off&mod=off&nx=off&mf=off&ss=off&s=on&geo=none`
    )
    const data: HebcalResponse = await res.json()
    const match = data.items?.find((item) => {
      const itemDate = new Date(item.date)
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() + 1 === month &&
        itemDate.getDate() === day &&
        item.category === 'holiday' &&
        item.yomtov === true
      )
    })
    if (match) return { isSpecial: true, reason: match.title }
  } catch (e) {
    console.error('Hebcal error:', e)
  }

  return { isSpecial: false, reason: null }
}

export const calcHours = (start: string, end: string): number => {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  return parseFloat((mins / 60).toFixed(2))
}
