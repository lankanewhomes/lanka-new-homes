'use client'

import { useState } from 'react'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

// A dropdown for a plain text field: pick a preset, or choose "Other" and type anything. The stored value is the
// text itself, so the field's type, existing data, the Supabase sync and the public site do not change at all (a real
// select field would turn the column into a fixed list and reject every value not on it). A value already saved that
// is not one of the presets shows under "Other" with the text filled in, so nothing disappears.
// Used via admin.components.Field: { path: '@/components/payload/TextDropdownField#TextDropdownField', clientProps: { options } }.

const OTHER = '__other__'

export function TextDropdownField(props: TextFieldClientProps & { options?: string[] }) {
  const { field, path, readOnly, options = [] } = props
  const { errorMessage, setValue, showError, value } = useField<string>({ path })
  const current = typeof value === 'string' ? value : ''
  const [chosenOther, setChosenOther] = useState(false)

  const isPreset = options.includes(current)
  const showOther = chosenOther || (current !== '' && !isPreset)
  const selectValue = showOther ? OTHER : current

  return (
    <div className={['field-type', 'text', 'text-dropdown-field', showError && 'error', readOnly && 'read-only'].filter(Boolean).join(' ')}>
      <FieldLabel label={field.label} localized={field.localized} path={path} required={field.required} />
      <div className="field-type__wrap">
        <FieldError message={errorMessage} path={path} showError={showError} />
        <select
          id={`field-${path.replace(/\./g, '__')}`}
          className="text-dropdown-select"
          value={selectValue}
          disabled={readOnly}
          onChange={(event) => {
            const next = event.target.value
            if (next === OTHER) {
              setChosenOther(true)
              if (isPreset) setValue('')
            } else {
              setChosenOther(false)
              setValue(next)
            }
          }}
        >
          <option value="">Select…</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value={OTHER}>Other (type your own)</option>
        </select>
        {showOther ? (
          <input
            type="text"
            className="text-dropdown-other"
            value={current}
            placeholder="Type your own…"
            disabled={readOnly}
            onChange={(event) => setValue(event.target.value)}
          />
        ) : null}
        <FieldDescription description={field.admin?.description} path={path} />
      </div>
    </div>
  )
}
