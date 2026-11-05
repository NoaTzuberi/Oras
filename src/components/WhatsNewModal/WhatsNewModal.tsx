import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import './WhatsNewModal.css'

type Item = { icon: string; title: string; body: string }

type Props = {
  /** "Later" and Escape */
  onLater: () => void
  /** "Review my jobs": close and go to Settings → My jobs */
  onReviewJobs: () => void
  /** "Earlier updates" starts open (users who never saw the previous version) */
  earlierExpanded?: boolean
}

/** Release notes: the current release first, earlier ones in a collapsible section. */
export const WhatsNewModal = ({ onLater, onReviewJobs, earlierExpanded = false }: Props) => {
  const { t } = useTranslation()
  const titleId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [earlierOpen, setEarlierOpen] = useState(earlierExpanded)
  const overtime = t('whatsNew.overtime', { returnObjects: true }) as Item
  const checklist = t('whatsNew.jobsChecklist', { returnObjects: true }) as string[]
  const earlier = t('whatsNew.items', { returnObjects: true }) as Item[]
  // Latest onLater without re-running the open/close effect on every render
  const onLaterRef = useRef(onLater)
  useEffect(() => { onLaterRef.current = onLater })

  useEffect(() => {
    buttonRef.current?.focus()
    // Keep the page behind from scrolling while it's open
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onLaterRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div className="whats-new-backdrop">
      <div className="whats-new" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="whats-new__body">
          <h2 id={titleId} className="whats-new__title">{t('whatsNew.title')}</h2>

          <section className="whats-new__item">
            <span className="whats-new__icon" aria-hidden="true">{overtime.icon}</span>
            <div>
              <h3 className="whats-new__item-title">{overtime.title}</h3>
              <p className="whats-new__item-body">{overtime.body}</p>
            </div>
          </section>

          <section className="whats-new__item">
            <span className="whats-new__icon" aria-hidden="true">⚙️</span>
            <div>
              <p className="whats-new__item-body">{t('whatsNew.jobsIntro')}</p>
              <ul className="whats-new__checklist">
                {checklist.map(line => <li key={line}>{line}</li>)}
              </ul>
              <p className="whats-new__item-body">{t('whatsNew.multipleJobs')}</p>
            </div>
          </section>

          <p className="whats-new__note">{t('whatsNew.unchanged')}</p>

          <details
            className="whats-new__earlier"
            open={earlierOpen}
            onToggle={e => setEarlierOpen(e.currentTarget.open)}
          >
            <summary className="whats-new__earlier-title">{t('whatsNew.earlierTitle')}</summary>
            <div className="whats-new__earlier-body">
              {earlier.map(item => (
                <section key={item.title} className="whats-new__item">
                  <span className="whats-new__icon" aria-hidden="true">{item.icon}</span>
                  <div>
                    <h3 className="whats-new__item-title">{item.title}</h3>
                    <p className="whats-new__item-body">{item.body}</p>
                  </div>
                </section>
              ))}
            </div>
          </details>
        </div>

        {/* Always visible: the body above scrolls */}
        <div className="whats-new__footer">
          <button ref={buttonRef} type="button" className="whats-new__btn" onClick={onReviewJobs}>
            {t('whatsNew.reviewJobs')}
          </button>
          <button type="button" className="whats-new__btn whats-new__btn--secondary" onClick={onLater}>
            {t('whatsNew.later')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
