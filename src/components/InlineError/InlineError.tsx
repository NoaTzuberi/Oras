import type { ReactNode } from 'react'
import './InlineError.css'

export const InlineError = ({ children }: { children: ReactNode }) => (
  <p className="inline-error">{children}</p>
)
