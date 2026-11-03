import { useId } from 'react'
import './Switch.css'

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }

/** On/off switch with its label. The whole row is clickable. */
export const Switch = ({ checked, onChange, label, disabled }: Props) => {
  const id = useId()
  return (
    <div className="switch-row">
      <label className="switch-row__label" htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className="switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  )
}
