// Same palette, same order as public.jobs_assign_color() in
// supabase/migrations/20261101120000_add_jobs_and_shift_pay_columns.sql,
// which assigns job colors.
export const JOB_COLOR_PALETTE = [
  '#6366F1', // indigo
  '#0EA5E9', // sky
  '#10B981', // emerald
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#D946EF', // fuchsia
  '#14B8A6', // teal
  '#F97316', // orange
] as const

const HEX_RE = /^#([0-9a-f]{6})$/i

/** The job's color, or the first palette color if the row has none (shouldn't happen: the DB assigns one). */
export const jobColor = (job: { color: string | null } | null | undefined): string =>
  job?.color && HEX_RE.test(job.color) ? job.color : JOB_COLOR_PALETTE[0]

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(HEX_RE.exec(hex)?.[1] ?? '6366F1', 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** "rgba(r, g, b, alpha)" for tints and borders. */
export const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = rgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * The color darkened toward black, for filled backgrounds under white text.
 * Most palette colors are too light for white text as-is (amber, emerald,
 * sky...); 65% keeps the hue and passes about 4.5:1.
 */
export const shade = (hex: string, factor = 0.65): string => {
  const [r, g, b] = rgb(hex).map(c => Math.round(c * factor))
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

/** Neutral color for "No job". */
export const NO_JOB_COLOR = '#94A3B8'
