import { useId } from 'react'
import './Switch.css'

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }

/** On/off switch with its label. The whole row is clickable. */
export const Switch = ({ checked, onChange, label, disabled }: Props) => {
  const id = useId()
  return (
    <div className="pay-switch-row">
      <label className="pay-switch-row__label" htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className="pay-switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="pay-switch__thumb" />
      </button>
    </div>
  )
}
