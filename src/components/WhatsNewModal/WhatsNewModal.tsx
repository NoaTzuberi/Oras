import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import './WhatsNewModal.css'

type Item = { icon: string; title: string; body: string }

/** One-time release notes. Closing (button or Escape) calls onClose. */
export const WhatsNewModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation()
  const titleId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const items = t('whatsNew.items', { returnObjects: true }) as Item[]
  // Latest onClose without re-running the open/close effect on every render
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    buttonRef.current?.focus()
    // Keep the page behind from scrolling while it's open
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
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
          {items.map(item => (
            <section key={item.title} className="whats-new__item">
              <span className="whats-new__icon" aria-hidden="true">{item.icon}</span>
              <div>
                <h3 className="whats-new__item-title">{item.title}</h3>
                <p className="whats-new__item-body">{item.body}</p>
              </div>
            </section>
          ))}
          <p className="whats-new__note">{t('whatsNew.unchanged')}</p>
          <p className="whats-new__note">{t('whatsNew.feedback')}</p>
        </div>
        <div className="whats-new__footer">
          <button ref={buttonRef} type="button" className="whats-new__btn" onClick={onClose}>
            {t('whatsNew.gotIt')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
