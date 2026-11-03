import { useId } from 'react'
import './Switch.css'

type Props = {
  /** null = not set yet: shown as "not set", not as off. Tapping turns it on. */
  checked: boolean | null
  onChange: (checked: boolean) => void
  label: string
  hint?: string
  /** Badge shown next to the label when checked is null */
  unsetLabel?: string
  disabled?: boolean
  className?: string
}

/**
 * The app's one on/off switch (Settings, jobs, Shabbat card). The whole row
 * is clickable. The knob sits at the reading start when off and moves to
 * the reading end when on, so it reads correctly in Hebrew and English.
 */
export const Switch = ({ checked, onChange, label, hint, unsetLabel, disabled, className }: Props) => {
  const id = useId()
  const unset = checked === null
  return (
    <div className={`ui-switch-row${unset ? ' is-unset' : ''}${className ? ` ${className}` : ''}`}>
      <label className="ui-switch-row__text" htmlFor={id}>
        <span className="ui-switch-row__label">
          {label}
          {unset && unsetLabel && <span className="ui-switch-row__badge">{unsetLabel}</span>}
        </span>
        {hint && <span className="ui-switch-row__hint" id={`${id}-hint`}>{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={unset ? 'mixed' : checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="ui-switch"
        disabled={disabled}
        onClick={() => onChange(unset ? true : !checked)}
      >
        <span className="ui-switch__thumb" />
      </button>
    </div>
  )
}
