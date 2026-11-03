/** Hours as h:mm, e.g. 3.4333 -> "3:26". Rounded to the nearest minute. */
export const formatHM = (hours: number): string => {
  const totalMin = Math.max(0, Math.round(hours * 60))
  return `${Math.floor(totalMin / 60)}:${String(totalMin % 60).padStart(2, '0')}`
}

/** "₪171.50", "₪700". Two decimals only when there are agorot. */
export const formatMoney = (n: number): string =>
  `₪${Number.isInteger(n) ? n : n.toFixed(2)}`
