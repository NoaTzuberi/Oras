import { useLayoutEffect, useRef, type ReactNode } from 'react'

type FitTextProps = {
  children: ReactNode
  minFontSize?: number
  className?: string
}

export const FitText = ({ children, minFontSize = 16, className }: FitTextProps) => {
  const ref = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      el.style.fontSize = ''
      let size = parseFloat(getComputedStyle(el).fontSize)

      while (el.scrollWidth > el.clientWidth && size > minFontSize) {
        size -= 1
        el.style.fontSize = `${size}px`
      }
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [children, minFontSize])

  return (
    <p ref={ref} className={className} style={{ whiteSpace: 'nowrap' }}>
      {children}
    </p>
  )
}
