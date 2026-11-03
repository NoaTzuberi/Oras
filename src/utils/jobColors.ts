// Same palette, same order as public.jobs_assign_color() in
// supabase/migrations/20261101120000_add_jobs_and_shift_pay_columns.sql,
// which assigns job colors. Kept here for the multi-job view later.
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
